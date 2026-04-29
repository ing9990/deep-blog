# diagrams

각 usecase 의 흐름 다이어그램. 세 부분으로 구성된다.

| 폴더/파일 | 역할 |
|---|---|
| `<id>.md` | 마크다운 본문 (엔드포인트, 흐름 이미지, 사용 컴포넌트, 참고). 흐름은 `![](./img/<id>.svg)` 로 노출, Mermaid 원문은 `<details>` 안 fallback. |
| `src/<id>.mmd` | Mermaid 원본 (`flowchart TD/LR ...`). 수정 입력. |
| `img/<id>.svg` | 렌더된 SVG. 마크다운 뷰어 어디서든 그래프로 표시됨. |

## 재생성

단일:

```bash
cd mini-coupang/diagrams
npx -y -p @mermaid-js/mermaid-cli@latest mmdc \
  -i src/<id>.mmd -o img/<id>.svg -b transparent
```

전체:

```bash
cd mini-coupang/diagrams
for f in src/*.mmd; do
  name=$(basename "${f%.mmd}")
  npx -y -p @mermaid-js/mermaid-cli@latest mmdc \
    -i "$f" -o "img/${name}.svg" -b transparent
done
```

`-b transparent` 빠뜨리면 흰 배경이 박혀 다크 모드에서 어색해진다. 첫 실행은 Puppeteer 다운로드 때문에 ~30s 소요.

## 새 다이어그램 추가

1. `src/<id>.mmd` 작성.
2. 위 명령으로 SVG 생성.
3. `<id>.md` 의 `## 흐름` 아래에 이미지 + `<details>` 블록의 Mermaid 원문을 같이 넣는다.
4. `src/`, `img/`, `<id>.md` 세 파일 함께 커밋.
