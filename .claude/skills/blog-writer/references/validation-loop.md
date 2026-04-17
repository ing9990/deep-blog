# Validation Loop

MDX 생성과 자산 생성이 모두 완료된 후, 스킬은 4단계 검증을 순차 실행한다. 각 단계 실패 시 원인 파싱 후 자동 수정 최대 2회 시도하고, 반복 실패 시 사용자 개입을 요청한다.

---

## 4-단계 검증 흐름

```
[Stage 3 MDX + 자산 생성 완료]
         ↓
┌─────────────────────────────────────────┐
│ 단계 1: pnpm generate-keyword-map        │
│   실패 → 충돌 파싱 → 해결 옵션 → 재실행  │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 단계 2: pnpm velite                      │
│   실패 → schema 에러 파싱 → 필드 수정    │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 단계 3: pnpm type-check                  │
│   실패 → import/type 수정                │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 단계 4: pnpm build                       │
│   실패 → 원인 분석 → 수정 또는 중단      │
└─────────────────────────────────────────┘
         ↓
[최종 보고]
```

---

## 단계 1: pnpm generate-keyword-map

**목적**: 키워드 충돌 감지 + `lib/generated/keyword-map.ts` 재생성.

**실패 시 처리**:
1. 에러 출력에서 `KEYWORD CONFLICT DETECTED` 메시지 파싱
2. 충돌 키워드와 관련 파일 경로 추출
3. 사용자에게 해결 옵션 제시 (키워드 소유권 결정은 `frontmatter-rules.md` §키워드 충돌 해결 참조)
4. 사용자 결정 반영 후 재실행 (최대 2회)

**통상 실행 시간**: ~0.5초

---

## 단계 2: pnpm velite

**목적**: Velite schema 검증 — frontmatter 필드 유효성, MDX 파싱, 결과 JSON 생성.

**frontmatter 구조 체크리스트**:
- [ ] `title`이 `{ ko, en }` object 형태인가 (flat string 아님)
- [ ] `title.ko`와 `title.en` 둘 다 존재하는가 (한쪽 누락 시 Velite 빌드 실패)
- [ ] `summary`가 `{ ko, en }` object 형태인가
- [ ] `summary.ko`와 `summary.en` 둘 다 10~300자인가
- [ ] 두 요약이 동일 의미를 전달하는가 (재작성 아닌 번역)
- [ ] 어느 필드도 em-dash `—` (U+2014) 포함하지 않는가

**흔한 위반 목록**:
- `title` 또는 `summary`가 flat string으로 작성됨 (`{ ko, en }` 중첩 필요)
- `summary.ko` 또는 `summary.en` 길이 10~300자 범위 벗어남
- `slug` 형식 오류 (대문자, 특수문자 포함)
- `tags` 빈 배열 또는 5개 초과
- `keywords` 빈 배열
- 잘못된 `date` 형식 (`YYYY-MM-DD` 아닌 값)

**실패 시 처리**:
1. 에러 메시지에서 위반 필드 파싱
2. 해당 frontmatter 필드 수정
3. 재실행 (최대 2회)

**통상 실행 시간**: ~1초

---

## 단계 3: pnpm type-check

**목적**: TypeScript 컴파일 검증 — 신규 컴포넌트의 타입 에러, 잘못된 import, props 타입 불일치 조기 발견.

**실패 시 처리**:
1. `tsc` 에러 메시지에서 `파일:라인` 파싱
2. import 누락 또는 타입 불일치 수정
3. 재실행 (최대 2회)

**왜 build와 별도 단계인가**: `pnpm build`가 내부적으로 타입 검증을 하지만 ~30초 소요. `pnpm type-check`는 ~5초에 실패 신호를 주므로 빠른 피드백 루프에 유리. 타입 에러는 새 글에서 흔한 오류(컴포넌트 import 누락, 잘못된 props)이므로 여기서 먼저 잡는다.

**통상 실행 시간**: ~5초

---

## 단계 4: pnpm build

**목적**: Next.js 프로덕션 빌드 검증 — SSG 경로 생성, 신규 글이 `/posts/[slug]` 라우트에 편입.

**실패 시 처리**:
1. 빌드 로그에서 원인 분석
2. 자동 수정 가능한 케이스이면 수정 후 재실행 (최대 2회)
3. 자동 수정 불가능한 케이스이면 즉시 중단, 에러 노출

**성공 확인**: 빌드 출력에서 신규 경로 `/posts/<slug>` 확인.

**통상 실행 시간**: ~30초

---

## 자동 수정 한계

- 각 단계 최대 **2회** 수정 시도
- **누적 수정 시도 3회 이상 시 무조건 중단** (무한 루프 방지)
- 실패 시 에러 로그 전체를 사용자에게 노출하고 "수동 개입이 필요합니다" 선언

---

## 자동 수정 가능 케이스

| 에러 종류 | 자동 수정 내용 |
|---|---|
| `summary.ko` / `summary.en` 길이 초과/미달 | 해당 언어 요약 텍스트 재작성 |
| `slug` 형식 오류 (대문자) | 소문자 변환 |
| `tags` 빈 배열 | 노트 재참조 후 기본 카테고리 태그 삽입 |
| 컴포넌트 import 누락 | `components/mdx/components.tsx`에 추가 |
| MDX 문법 오타 | 예: `<Callout type="ifno">` → `<Callout type="info">` 수정 |

---

## 자동 수정 불가능 케이스

- **키워드 충돌**: 어느 글이 키워드 소유자인지는 사용자 결정이 필요. 스킬이 임의로 판단하지 않는다.
- **Velite unexpected schema 위반**: 예를 들어 Velite가 새로 도입한 필드 요구사항. `frontmatter-rules.md` 업데이트 필요.
- **알 수 없는 webpack/Next.js 빌드 에러**: 스킬이 원인을 특정할 수 없는 스택 트레이스. 로그 전체를 노출하고 중단.
- **신규 컴포넌트 코드의 런타임 오류**: 생성한 React 코드에 논리 오류가 있는 경우. 자동 수정 시도는 위험. 사용자 검토 요청.

---

## 최종 보고 템플릿

```
✅ "<제목>" 블로그 생성 완료

작성된 파일:
  ✓ content/posts/<slug>.mdx (N줄)
  ✓ components/visualizations/<Name>.tsx (M줄, 신규)  # React 시각화([A-1]/[A-2]) 신규 생성 시
  ✓ components/mdx/components.tsx 업데이트             # 컴포넌트 등록 시
  ✓ lib/generated/keyword-map.ts (N → M keywords)

검증 결과:
  ✓ pnpm generate-keyword-map — 키워드 K개 추가, 충돌 없음
  ✓ pnpm velite — frontmatter schema 통과
  ✓ pnpm type-check — 에러 0
  ✓ pnpm build — SSG 성공, /posts/<slug> 경로 생성

테스트: N개 모두 통과 (변경 없음)

학습 노트: .claude/drafts/<slug>-notes.md (보존됨)

다음 단계 (사용자 영역):
  - http://localhost:3000/posts/<slug> 에서 직접 확인
  - 커밋: /commit
```
