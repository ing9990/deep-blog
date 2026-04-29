# UC-05 로그아웃

| 항목 | 내용 |
|---|---|
| 엔드포인트 | `POST /auth/logout` |
| 인증 | 세션 |
| 입력 | 없음 |
| 출력 | 204 No Content |
| 상태 | 🔄 backend → member-server (Phase 4) |

## 흐름 (목표 MSA)

```
[Client] -> [member-server :8081]
              |--> HttpSession.invalidate()
                       |
                       v
              [Redis] DEL session:account:{accountId}
                       |
              <-- 204 No Content
              <-- Set-Cookie: SESSION=; Max-Age=0
```

## 사용 컴포넌트

| 종류 | 사용 |
|---|---|
| 서비스 | member-server |
| 인프라 | Redis (세션 삭제) |

## 참고

- DB 호출 없음. Redis 만 건드린다.
- 세션이 없는 요청도 204 로 응답 (idempotent).
