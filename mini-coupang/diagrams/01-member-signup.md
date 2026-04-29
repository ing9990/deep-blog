# UC-01 회원가입

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `POST /auth/signup/member` |
| 인증 | 없음 |
| 입력 | `{ email, password, name }` |
| 출력 | `{ accountId, memberId }` |
| 상태 | 🔄 backend → member-server (Phase 4) |

## 흐름 (목표 MSA)

```
[Client] -> [member-server :8081]
              |--> Account 중복 확인 (MySQL: member.accounts)
              |--> 비밀번호 해시 (BCrypt)
              |--> Account + Member INSERT (write TX)
              |--> ApplicationEventPublisher.publishEvent(MemberSignedUp)
              |
              |  (트랜잭션 commit 후, AFTER_COMMIT)
              |--> [Kafka] member.signed-up
                              |--> [notification-server :8085]
                                      |--> notification_log INSERT
                                      |--> 알림 발송 (콘솔 로그)
```

## 사용 컴포넌트

| 종류 | 사용 |
|---|---|
| 서비스 | member-server, notification-server |
| 인프라 | MySQL (member 스키마), Kafka (`member.signed-up`) |
| 외부 시스템 | 없음 |

## 참고

- 트랜잭션은 member-server 단일 commit 으로 끝난다.
- 알림 실패는 가입 실패로 이어지지 않는다 (publish 는 commit 후 비동기).
- 이메일 중복은 DB UNIQUE 제약 + `findByEmail` 선조회 둘 다.
