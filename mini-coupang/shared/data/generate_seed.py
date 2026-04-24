"""Seed via the public API so MySQL and Qdrant stay consistent.

Flow:
    1) Naver Shopping API 로 N건 수집(dedup).
    2) (옵션) MySQL truncate + Qdrant collection 재생성.
    3) POST /auth/signup/seller 로 40명 판매자 생성(기존 계정은 409 skip).
    4) POST /auth/login/seller 로 40명의 JSESSIONID 확보.
    5) ThreadPoolExecutor 로 POST /api/seller/products 를 병렬 호출.
       Backend 가 AFTER_COMMIT + @Async 로 EmbedPort.indexProduct 를 돌려
       Qdrant 까지 자동으로 반영된다.
    6) Qdrant points_count 가 목표에 도달할 때까지 polling -> MySQL ↔ Qdrant 일치 보장.

Usage:
    mini-coupang/ml/.venv/bin/python mini-coupang/shared/data/generate_seed.py \
        [--sellers 40] [--products 12000] [--concurrency 8] \
        [--base-url http://localhost:8080] \
        [--qdrant-url http://localhost:6333] \
        [--no-reset]

Prereqs:
    - mini-coupang-{mysql,qdrant,ml} 컨테이너 UP
    - backend (:8080) UP  (IntelliJ 실행 또는 bootRun)
    - .env 에 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET

한국어 메모:
    - 기존 SQL 직접 적재(seed_data.sql.gz) 경로는 JPA 이벤트를 우회해 Qdrant 가
      비는 문제가 있었다. 동일 경로로 들어가는 공개 API 를 써서 정합성을 구조적으로
      보장하는 방향으로 전환.
    - 병렬도(concurrency)는 backend 의 productIndexingExecutor(max=4)가 bottleneck.
      Python 이 더 많이 찔러도 @Async 큐가 포화되면 CallerRunsPolicy 로 넘어가
      HTTP 응답이 지연될 뿐. 기본 8 로 유지.
    - signup 은 멱등하다(409 skip). 스크립트를 여러 번 돌려도 안전.
    - 마지막 sync 대기가 성공 조건의 핵심. polling 이 target 도달하면 exit 0.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import os
import re
import subprocess
import sys
import time
from collections import Counter
from pathlib import Path

import requests
from dotenv import load_dotenv

HERE = Path(__file__).parent
load_dotenv(HERE / ".env")

NAVER_CLIENT_ID = os.environ["NAVER_CLIENT_ID"]
NAVER_CLIENT_SECRET = os.environ["NAVER_CLIENT_SECRET"]
SEED_PASSWORD = "test1234!"  # BCryptPasswordEncoder 쪽과 공유하는 평문
VECTOR_DIM = 1024  # bge-m3 임베딩 차원

# 카테고리당 검색어 3개. 네이버 API 의 "query 당 최대 1,000개" 제약을 극복.
QUERIES: list[tuple[int, str]] = [
    (1, "텀블러"), (1, "보온병"), (1, "물병"),
    (2, "노트북"), (2, "랩탑"), (2, "울트라북"),
    (3, "운동화"), (3, "러닝화"), (3, "스니커즈"),
    (4, "키보드"), (4, "기계식키보드"), (4, "무선키보드"),
    (5, "백팩"), (5, "등산가방"), (5, "캠핑백팩"),
]

NAVER_API_URL = "https://openapi.naver.com/v1/search/shop.json"
NAVER_HEADERS = {
    "X-Naver-Client-Id": NAVER_CLIENT_ID,
    "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
}

HTML_TAG_RE = re.compile(r"</?[bB]>")


def clean_title(text: str) -> str:
    return HTML_TAG_RE.sub("", text or "").strip()


def truncate_bytes(text: str, max_bytes: int) -> str:
    """products.name varchar(200) 은 byte 단위. 한글 1자 = 3 byte 라 char-slice 로는
    쉽게 201 byte 가 되어 MySQL 이 Data too long 으로 reject 한다."""
    encoded = text.encode("utf-8")
    if len(encoded) <= max_bytes:
        return text
    return encoded[:max_bytes].decode("utf-8", errors="ignore")


def fetch_page(query: str, start: int) -> list[dict]:
    r = requests.get(
        NAVER_API_URL,
        headers=NAVER_HEADERS,
        params={"query": query, "display": 100, "start": start, "sort": "sim"},
        timeout=10,
    )
    r.raise_for_status()
    return r.json().get("items", [])


def collect_products(target: int) -> list[dict]:
    out: list[dict] = []
    seen: set[str] = set()
    for cid, query in QUERIES:
        print(f"[collect] ({cid}) {query!r}", file=sys.stderr)
        for start in range(1, 1001, 100):
            try:
                items = fetch_page(query, start)
            except requests.HTTPError as e:
                print(f"  page start={start} failed: {e}", file=sys.stderr)
                break
            if not items:
                break
            for item in items:
                name = truncate_bytes(clean_title(item.get("title", "")), 200)
                if len(name) < 2 or name in seen:
                    continue
                seen.add(name)
                brand = (item.get("brand") or item.get("maker") or "").strip()
                description = f"{brand} {name}".strip()[:500]
                try:
                    price = int(item.get("lprice") or 0)
                except (TypeError, ValueError):
                    price = 0
                mall = (item.get("mallName") or "네이버쇼핑").strip()[:100] or "네이버쇼핑"
                out.append({
                    "categoryId": cid,
                    "name": name,
                    "description": description,
                    "basePrice": price,
                    "mall": mall,
                })
                if len(out) >= target:
                    print(f"  reached target {target}", file=sys.stderr)
                    return out
            time.sleep(0.1)
    print(f"[collect] collected {len(out)}/{target}", file=sys.stderr)
    return out


def pick_sellers(products: list[dict], count: int) -> list[str]:
    """네이버 mall 점유율 top N. 부족하면 '기본몰k'로 채움."""
    counter = Counter(p["mall"] for p in products)
    top = [m for m, _ in counter.most_common(count)]
    i = 1
    while len(top) < count:
        candidate = f"기본몰{i}"
        if candidate not in top:
            top.append(candidate)
        i += 1
    return top


def reset_mysql() -> None:
    print("[reset] MySQL TRUNCATE", file=sys.stderr)
    sql = (
        "SET FOREIGN_KEY_CHECKS=0;"
        "TRUNCATE products;"
        "TRUNCATE product_options;"
        "TRUNCATE product_images;"
        "TRUNCATE sellers;"
        "TRUNCATE accounts;"
        "SET FOREIGN_KEY_CHECKS=1;"
    )
    subprocess.run(
        [
            "docker", "exec", "mini-coupang-mysql",
            "mysql", "-umini", "-pmini", "mini_coupang", "-e", sql,
        ],
        check=True,
        capture_output=True,
    )


def reset_qdrant(qdrant_url: str) -> None:
    print("[reset] Qdrant collection rebuild", file=sys.stderr)
    requests.delete(f"{qdrant_url}/collections/products", timeout=10)
    r = requests.put(
        f"{qdrant_url}/collections/products",
        json={"vectors": {"size": VECTOR_DIM, "distance": "Cosine"}},
        timeout=10,
    )
    r.raise_for_status()
    for field, schema in [
        ("category_id", "integer"),
        ("status", "keyword"),
        ("base_price", "integer"),
    ]:
        r = requests.put(
            f"{qdrant_url}/collections/products/index",
            json={"field_name": field, "field_schema": schema},
            timeout=10,
        )
        r.raise_for_status()


def signup_seller(base_url: str, idx: int, mall: str) -> None:
    email = f"seller{idx}@seed.local"
    body = {
        "email": email,
        "password": SEED_PASSWORD,
        "businessName": mall,
        "businessRegistrationNumber": f"1{idx:09d}",
        "representativeName": f"판매자{idx}",
        "phoneNumber": f"010{idx:08d}",
    }
    r = requests.post(f"{base_url}/auth/signup/seller", json=body, timeout=10)
    if r.status_code in (200, 201):
        return
    if r.status_code == 409:
        return  # 중복 이메일: 이미 존재. 멱등 skip.
    raise RuntimeError(f"signup seller{idx} failed: {r.status_code} {r.text}")


def login_seller(base_url: str, idx: int) -> str:
    r = requests.post(
        f"{base_url}/auth/login/seller",
        json={"email": f"seller{idx}@seed.local", "password": SEED_PASSWORD},
        timeout=10,
    )
    r.raise_for_status()
    cookie = r.cookies.get("JSESSIONID")
    if not cookie:
        raise RuntimeError(f"seller{idx} login OK but no JSESSIONID")
    return cookie


def register_product(base_url: str, cookie: str, product: dict) -> tuple[bool, int]:
    try:
        r = requests.post(
            f"{base_url}/api/seller/products",
            json={
                "categoryId": product["categoryId"],
                "name": product["name"],
                "description": product["description"],
                "basePrice": product["basePrice"],
                "options": [],
                "images": [],
            },
            cookies={"JSESSIONID": cookie},
            timeout=15,
        )
        return (r.status_code == 201, r.status_code)
    except requests.RequestException:
        return (False, -1)


def wait_qdrant_sync(qdrant_url: str, target: int, timeout_sec: int = 900) -> int:
    print(f"[wait] Qdrant sync target={target}", file=sys.stderr)
    start = time.time()
    last = -1
    while time.time() - start < timeout_sec:
        try:
            r = requests.get(f"{qdrant_url}/collections/products", timeout=5)
            count = int(r.json()["result"].get("points_count") or 0)
        except Exception:
            count = last if last >= 0 else 0
        if count != last:
            elapsed = time.time() - start
            print(f"  {count}/{target}  ({elapsed:.0f}s)", file=sys.stderr)
            last = count
        if count >= target:
            return count
        time.sleep(5)
    return last


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Seed via public API (MySQL + Qdrant consistent)")
    p.add_argument("--sellers", type=int, default=40)
    p.add_argument("--products", type=int, default=12_000)
    p.add_argument("--concurrency", type=int, default=8,
                   help="concurrent POST workers (default 8)")
    p.add_argument("--base-url", type=str, default="http://localhost:8080")
    p.add_argument("--qdrant-url", type=str, default="http://localhost:6333")
    p.add_argument("--no-reset", action="store_true",
                   help="skip MySQL truncate + Qdrant recreate")
    return p.parse_args()


def main() -> int:
    args = parse_args()

    # 사전 점검: backend 가 살아있지 않으면 수천 요청이 전부 connection refused 로 갈 뿐.
    try:
        r = requests.get(f"{args.base_url}/actuator/health", timeout=3)
        if r.status_code != 200:
            print(f"backend not healthy: {r.status_code}", file=sys.stderr)
            return 1
    except requests.RequestException as e:
        print(f"backend unreachable at {args.base_url}: {e}", file=sys.stderr)
        return 1

    products = collect_products(args.products)
    if not products:
        print("no products collected", file=sys.stderr)
        return 1
    sellers = pick_sellers(products, args.sellers)
    print(f"[ready] products={len(products)}, sellers={len(sellers)}", file=sys.stderr)

    if not args.no_reset:
        reset_mysql()
        reset_qdrant(args.qdrant_url)

    print("[signup] 40 sellers", file=sys.stderr)
    for i, mall in enumerate(sellers, start=1):
        signup_seller(args.base_url, i, mall)

    print("[login] fetching seller cookies", file=sys.stderr)
    cookies: dict[int, str] = {}
    for i in range(1, len(sellers) + 1):
        cookies[i] = login_seller(args.base_url, i)

    print(
        f"[register] POST /api/seller/products x{len(products)} "
        f"(concurrency={args.concurrency})",
        file=sys.stderr,
    )
    tasks = [
        (cookies[1 + (i % len(sellers))], p)
        for i, p in enumerate(products)
    ]
    success = 0
    failures: Counter[int] = Counter()
    t0 = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as ex:
        futures = [ex.submit(register_product, args.base_url, c, p) for c, p in tasks]
        for done_idx, f in enumerate(concurrent.futures.as_completed(futures), start=1):
            ok, status = f.result()
            if ok:
                success += 1
            else:
                failures[status] += 1
            if done_idx % 500 == 0:
                elapsed = time.time() - t0
                print(
                    f"  {done_idx}/{len(tasks)} "
                    f"(ok={success}, fail={sum(failures.values())}, "
                    f"{elapsed:.1f}s)",
                    file=sys.stderr,
                )
    print(
        f"[register] done ok={success}, fail={sum(failures.values())} "
        f"{dict(failures) or ''}, elapsed={time.time() - t0:.1f}s",
        file=sys.stderr,
    )

    final_count = wait_qdrant_sync(args.qdrant_url, success)
    if final_count < success:
        print(
            f"[warn] Qdrant sync short: {final_count}/{success}",
            file=sys.stderr,
        )
        return 2
    print(f"[done] MySQL={success} Qdrant={final_count}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
