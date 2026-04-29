# UC-08 상품 검색 (하이브리드)

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `GET /api/products/search?q=&category_id=&min_price=&max_price=&limit=` |
| 인증 | 없음 |
| 입력 | 쿼리 파라미터 (q 필수, 나머지 선택) |
| 출력 | `{ items: [{ id, name, basePrice, sellerId, score, ... }, ...] }` |
| 상태 | 🔄 backend (+ml/) → product-server (+ml/) (Phase 3) |

## 흐름 (목표 MSA)

```
[Client] -> [product-server :8082]
              |
              |--> [ml :50051] (gRPC) SearchByQuery(q, filters, limit)
              |        |
              |        |--> bge-m3 임베딩 인코딩 (dense vector)
              |        |--> [Qdrant :6333] Query API (Prefetch + FusionQuery RRF)
              |        |        |--- sparse 채널 (BM25-like)
              |        |        \--- dense 채널 (코사인 유사도)
              |        |             ↓
              |        |        RRF 융합 후 hit 목록 반환
              |        |
              |        <-- { hits: [{ productId, score }, ...] }
              |
              |--> [MySQL: product 스키마] productRepository.findAllById(ids)
              |        |--- 상품 detail 일괄 조회
              |
              |--> hit 순서 보존 + 가격 / 카테고리 필터 합성
              |
              <-- { items: [...] }
```

## 사용 컴포넌트

| 종류 | 사용 |
|---|---|
| 서비스 | product-server, ml (Python gRPC) |
| 인프라 | MySQL (product 스키마), Qdrant |
| 외부 시스템 | 없음 (bge-m3 모델은 ml 컨테이너 내장) |

## 참고

- lexical (sparse) + semantic (dense) 두 채널을 Qdrant 의 Query API 한 번 호출로 RRF 융합 (Prefetch + FusionQuery).
- `MeasureStepAspect` 가 `SearchSteps.embedAndSearch` / `fetch` 단계별 latency 를 기록 (Prometheus).
- 상태 필터: `ProductStatus.ACTIVE` 만 노출 (suspended/sold-out 제외). Qdrant payload index 가 양 채널 모두에 적용.
- `limit` 은 1~100 으로 clamp.
