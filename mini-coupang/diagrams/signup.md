# UC-01 회원가입 (회원 + 판매자)

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `POST /auth/signup/member`, `POST /auth/signup/seller` |
| 인증 | 없음 |
| 입력 (회원) | `{ email, password, name, phoneNumber?, nickname? }` |
| 입력 (판매자) | `{ email, password, businessName, businessRegistrationNumber, representativeName, phoneNumber }` |
| 출력 | `{ accountId, memberId }` 또는 `{ accountId, sellerId }` |

## 흐름

회원과 판매자 가입은 같은 모양이다 (이메일/비밀번호 + 도메인 프로필). 가입이 성공하면 도메인 이벤트가 발행되고, AFTER_COMMIT 시점에 Kafka 토픽으로 흘러 알림 서비스가 받는다.

![회원가입 flow](./img/signup.png)

<details><summary>다이어그램 소스 (Mermaid)</summary>

```mermaid
flowchart TD
    C["클라이언트"] --> MS["회원 서비스 :8081"]
    MS --> Branch{가입 종류}

    Branch -- "POST /auth/signup/member" --> VM["이메일 중복 확인<br/>MySQL: member.accounts"]
    VM --> HM["BCrypt 해시"]
    HM --> IM["Account + Member 동시 INSERT<br/>(write TX)"]
    IM --> PM["도메인 이벤트 발행<br/>publishEvent(MemberSignedUp)"]
    PM -. "AFTER_COMMIT" .-> KM[("Kafka<br/>member.signed-up")]

    Branch -- "POST /auth/signup/seller" --> VS["이메일 중복 확인<br/>MySQL: member.accounts"]
    VS --> HS["BCrypt 해시"]
    HS --> IS["Account + Seller 동시 INSERT<br/>(write TX)"]
    IS --> PS["도메인 이벤트 발행<br/>publishEvent(SellerSignedUp)"]
    PS -. "AFTER_COMMIT" .-> KS[("Kafka<br/>seller.signed-up")]

    KM --> NS["알림 서비스 :8085"]
    KS --> NS
    NS --> NL["알림 이력 INSERT<br/>MySQL: notification_log"]
    NL --> ND["환영 알림 발송 (콘솔 로그)"]
```

</details>

## 사용 컴포넌트

| 종류 | 사용 |
|---|---|
| 서비스 | 회원 서비스, 알림 서비스 |
| 인프라 | MySQL (member 스키마), Kafka (`member.signed-up`, `seller.signed-up`) |
| 외부 시스템 | 없음 |

## 트랜잭션 / 정합성

- 가입 자체는 회원 서비스 단일 commit 으로 끝난다.
- 알림 발행은 `@TransactionalEventListener(AFTER_COMMIT)` 로 트랜잭션 commit 후 비동기 발행된다. 알림 발송 실패가 가입 실패로 이어지지 않는다 (Outbox 미도입 단계의 trade-off).
- 이메일 중복은 DB UNIQUE 제약 + `findByEmail` 선조회 둘 다 확인한다.
