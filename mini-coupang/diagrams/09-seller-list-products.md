# UC-09 판매자 상품 목록

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `GET /api/seller/products?page=&size=` |
| 인증 | 세션 (판매자) |
| 입력 | 페이징 파라미터 |
| 출력 | `{ items: [{ id, name, basePrice, status, optionsCount, imagesCount, createdAt }, ...], page, size, totalElements }` |
| 상태 | 🔄 backend → product-server (Phase 3) |

## 흐름 (목표 MSA)

```
[Client (Cookie: SESSION)] -> [product-server :8082]
                                 |
                                 |--> [member-server] Feign GET /internal/auth/verify
                                 |        <-- { accountId, sellerId }       (인증 검증)
                                 |
                                 |--> Seller 조회 (MySQL: product.sellers OR product 스키마의 seller_id 캐시 행)
                                 |--> productRepository.findBySellerIdOrderByCreatedAtDesc(sellerId, pageable)
                                 |
                                 <-- { items, page, size, totalElements }
```

## 사용 컴포넌트

| 종류 | 사용 |
|---|---|
| 서비스 | product-server, member-server (인증 검증 Feign) |
| 인프라 | MySQL (product 스키마, member 스키마) |

## 참고

- 인증 검증을 매 요청 member-server Feign 호출로 한다 (Gateway 미도입). Phase 6 도입 후 헤더 신뢰로 대체.
- read-only TX. 판매자 본인 데이터만 조회 (sellerId 일치 여부 체크).
- 페이징 기본 `page=0, size=20`, `createdAt DESC`.
