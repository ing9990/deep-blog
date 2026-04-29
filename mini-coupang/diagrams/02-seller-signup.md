# UC-02 판매자 가입

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `POST /auth/signup/seller` |
| 인증 | 없음 |
| 입력 | `{ email, password, brandName, ... }` |
| 출력 | `{ accountId, sellerId }` |

## 흐름

![02-seller-signup flow](./img/02-seller-signup.svg)

<details><summary>다이어그램 소스 (Mermaid)</summary>

```mermaid
flowchart TD
    C["Client"] --> MS["member-server :8081"]
    MS --> V["Account 중복 확인<br/>MySQL: member.accounts"]
    V --> H["BCrypt 해시"]
    H --> I["Account + Seller INSERT<br/>(write TX)"]
    I --> P["publishEvent(SellerSignedUp)"]
    P -. "AFTER_COMMIT" .-> K[("Kafka<br/>seller.signed-up")]
    K --> NS["notification-server :8085"]
    NS --> NL["notification_log INSERT"]
    NL --> ND["환영 알림 발송 (콘솔)"]
```

</details>

## 사용 컴포넌트

| 종류 | 사용 |
|---|---|
| 서비스 | member-server, notification-server |
| 인프라 | MySQL (member 스키마), Kafka (`seller.signed-up`) |

## 참고

- UC-01 과 구조가 동일. 차이는 도메인 객체 (Member vs Seller) 와 토픽.
- Account 테이블은 member 와 seller 가 공유 (한 사람이 회원 + 판매자 동시 가능).
