# mini-coupang 코딩 패턴

mini-coupang 모놀리스가 따르는 레이어별 파일 구성 규칙. 신규 도메인을 추가할 때 이 문서를 그대로 따라 쓴다. 예시 레퍼런스: [f-lab-edu/woowahan-eats](https://github.com/f-lab-edu/woowahan-eats).

## 공통 원칙

- **Lombok 적극 사용**. 생성자 주입은 `@RequiredArgsConstructor`, Getter는 `@Getter`. `@Data`/`@EqualsAndHashCode`/`@ToString`은 엔티티에 붙이지 않는다 (프록시/지연로딩 사고 원인).
- **Service에서 Optional 체이닝**. `findById().orElseThrow()`, `.filter(...).map(...).orElseThrow(...)`를 우선. 명령형 `if (opt.isPresent())` 분기는 지양.
- **DTO는 record**. 요청/응답 모두 불변 레코드.
- **도메인 예외는 RuntimeException 상속**. `GlobalExceptionHandler`가 HTTP 상태로 매핑.
- **Enum 상수는 static import 기본**. 어노테이션 인자·메서드 인자 모두 해당. 예: `AccessLevel.PROTECTED` → `PROTECTED`, `FetchType.LAZY` → `LAZY`, `GenerationType.IDENTITY` → `IDENTITY`, `HttpStatus.CREATED` → `CREATED`. import 순서는 static import 블록 → 빈 줄 → 일반 import.

## 패키지 구조

```
com.deepblog.minicoupang
├── MiniCoupangApplication.java
├── domain/
│   ├── common/                  # BaseEntity, 공통 VO
│   ├── auth/                    # 인증(Account) 도메인
│   │   ├── domain/              # JPA 엔티티
│   │   ├── repository/          # Spring Data JPA 인터페이스
│   │   ├── application/         # Service 인터페이스 + Impl
│   │   ├── controller/          # @RestController
│   │   │   └── dto/             # Request/Response record
│   │   ├── context/             # (도메인 특화) AuthContext, AuthContextHolder, SessionKeys
│   │   └── exception/           # 도메인 예외
│   ├── member/                  # 일반 소비자 도메인
│   └── seller/                  # 판매자 도메인
└── global/
    ├── config/                  # JpaConfig, WebConfig, AuthConfig
    ├── exception/               # GlobalExceptionHandler, ErrorResponse
    └── interceptor/             # AuthInterceptor 등 cross-cutting
```

한 도메인 = 한 최상위 패키지. 도메인 내부에는 표준 레이어 하위 패키지(`domain/`, `repository/`, `application/`, `controller/`, `exception/`)만 둔다. 도메인에 고유한 개념 묶음(예: auth의 `context/`)이 생기면 하위 패키지로 분리하고 루트에는 `.java` 파일을 두지 않는다.

## 1. Entity (`domain/<domain>/domain/`)

### 레이아웃

```java
import static jakarta.persistence.GenerationType.IDENTITY;
import static lombok.AccessLevel.PRIVATE;
import static lombok.AccessLevel.PROTECTED;

// ...

@Entity
@Getter
@NoArgsConstructor(access = PROTECTED)
@AllArgsConstructor(access = PRIVATE)
@Builder
@Table(name = "xxx")   // 복수형 스네이크 케이스
public class Xxx extends BaseEntity {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    @Column(name = "xxx_id")
    private Long id;

    // ... 필드 ...

    public static Xxx create(...) {
        // 1. 검증
        // 2. builder로 조립
    }

    private static void validateYyy(...) { ... }
}
```

### 어노테이션 조합 (고정)

- `@Entity` + `@Table(name = "복수형")`
- `@Getter` — Setter는 쓰지 않는다.
- `@NoArgsConstructor(access = PROTECTED)` — JPA 프록시용.
- `@AllArgsConstructor(access = PRIVATE)` — `@Builder`가 내부적으로 호출할 수 있도록 private로만 노출.
- `@Builder` — 생성은 반드시 builder 경유. 직접 `new Xxx(...)` 금지.
- 외부 생성 진입점은 정적 팩토리 `create(...)` 하나로 통일.

### 필드 제약 작성 규칙

- **PK 컬럼명은 `<도메인>_id`** (`account_id`, `member_id`, `seller_id`). `id` 단독 사용 금지.
- **Unique 제약은 `@Column(unique = true)` 로 선언**. `@Table(uniqueConstraints = ...)` 쓰지 않는다.
- **모든 `@Column`에 4개 속성 명시**: `name`, `nullable`, `length`, 필요시 `unique`.
  - `name`: DB 컬럼명 (스네이크 케이스).
  - `nullable`: 기본값이 `true`라 명시 필수.
  - `length`: VARCHAR 크기. 문자열 필드는 반드시 지정.
  - `unique`: 유니크일 때만 `true`.
- 예: `@Column(name = "email", nullable = false, length = 255, unique = true)`
- 연관관계 FK (`FetchType.LAZY`는 `LAZY`로 static import):
  - `@OneToOne(fetch = LAZY, optional = false)`
  - `@JoinColumn(name = "xxx_id", nullable = false, unique = true)` (1:1일 때 unique)
  - `@ManyToOne(fetch = LAZY)` + `@JoinColumn(name = "xxx_id", nullable = false)` (N:1)
- 모든 연관관계 기본값은 `LAZY`. `EAGER` 금지.

### 공통 필드 — `BaseEntity`

`createdAt`, `updatedAt`은 `BaseEntity`가 `@CreatedDate` / `@LastModifiedDate`로 채운다. 엔티티에서 직접 `Instant.now()` 호출 금지. 활성화는 `global/config/JpaConfig.java`의 `@EnableJpaAuditing`.

### 정적 팩토리 + 검증

- 외부 생성 경로는 `create(...)` 하나로 고정.
- `create` 본문 순서: ① validateXxx 호출들 → ② `builder()...build()` return.
- validator는 private static, 필드당 하나. 메시지는 한국어 문장 (엔드유저에게 노출되므로).
- 검증 실패 시 도메인 전용 `Invalid<Name>Exception(message)` 던지기.

## 2. Repository (`domain/<domain>/repository/`)

```java
public interface XxxRepository extends JpaRepository<Xxx, Long> {

    Optional<Xxx> findByYyy(String yyy);

    boolean existsByYyy(String yyy);
}
```

- 인터페이스만. `@Repository` 필요 없음 (Spring Data가 자동 등록).
- 단건 조회는 **항상 `Optional<T>` 반환**. `T` 직접 반환 금지.
- 존재 여부는 `existsByXxx` 사용 (COUNT 대신 EXISTS).
- 도메인 간 조인은 JPQL/QueryDSL로. 네이티브 쿼리는 정말 필요할 때만.

## 3. Service (`domain/<domain>/application/`)

### 인터페이스 + 구현체 2파일 분리

```java
public interface XxxService {
    Long register(...);
    Xxx get(Long id);
}
```

```java
@Service
@RequiredArgsConstructor
public class XxxServiceImpl implements XxxService {

    private final XxxRepository xxxRepository;

    @Override
    @Transactional
    public Long register(...) {
        // 중복/선행조건 검증은 Optional.ifPresent로
        xxxRepository.findByKey(key).ifPresent(existing -> {
            throw new DuplicateXxxException(key);
        });
        return xxxRepository.save(Xxx.create(...)).getId();
    }

    @Override
    @Transactional(readOnly = true)
    public Xxx get(Long id) {
        return xxxRepository.findById(id)
            .orElseThrow(() -> new XxxNotFoundException(id));
    }
}
```

### 규칙

- **생성자 주입은 `@RequiredArgsConstructor`**. 수동 생성자 작성 금지.
- `@Transactional` 기본은 `readOnly = true`, 쓰기만 별도로 `@Transactional`.
- Optional 체인 우선:
  - 중복 체크: `findByKey(k).ifPresent(x -> { throw ... })`
  - 단건 조회: `findById(id).orElseThrow(...)`
  - 복합 조건: `findByKey(k).filter(...).map(...).orElseThrow(...)`
- 명령형 `if/else` 분기는 체인으로 대체.
- DTO 변환은 Controller 경계에서. Service는 도메인 객체 또는 원시값 반환.

## 4. Controller (`domain/<domain>/controller/`)

```java
@RestController
@RequestMapping("/xxx")
@RequiredArgsConstructor
public class XxxController {

    private final XxxService xxxService;

    @PostMapping
    public ResponseEntity<XxxResponse> register(@Valid @RequestBody XxxRequest request) {
        Long id = xxxService.register(request.a(), request.b());
        return ResponseEntity.status(HttpStatus.CREATED).body(new XxxResponse(id));
    }
}
```

- `@RequiredArgsConstructor`로 필드 주입.
- 요청 DTO에 `@Valid` 반드시. 검증 실패는 `GlobalExceptionHandler`가 400으로 변환.
- HTTP 상태는 `ResponseEntity.status(...)` 로 명시. 기본 200 암묵 사용 자제.
- 비즈니스 로직 금지. Controller는 입력 매핑 → Service 호출 → 응답 포장만.

## 5. DTO (`domain/<domain>/controller/dto/`)

- **항상 record**. class 금지.
- Request에는 `jakarta.validation.constraints.*` 애너테이션으로 형식 검증.
- Response는 검증 없음, 필요한 필드만.

```java
public record XxxRequest(
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Size(min = 8, max = 72) String password
) {}

public record XxxResponse(Long id, String email) {}
```

## 6. Exception (`domain/<domain>/exception/`)

- `RuntimeException` 상속.
- 메시지는 한국어 문장, 식별자 포함.
- `GlobalExceptionHandler`에 `@ExceptionHandler` 등록 → HTTP 상태 + `ErrorResponse(code, message)`로 매핑.

```java
public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String email) {
        super("이미 등록된 이메일입니다: " + email);
    }
}
```

## 7. Global (`global/`)

- `config/JpaConfig` — `@EnableJpaAuditing` (BaseEntity 동작에 필수).
- `config/WebConfig` — 인터셉터 등록.
- `config/AuthConfig` — `PasswordEncoder` 같은 공용 Bean.
- `exception/GlobalExceptionHandler` — `@RestControllerAdvice`, 도메인 예외 → HTTP 변환.
- `exception/ErrorResponse` — record `(String code, String message)`.
- `interceptor/` — 인증/로깅 등 cross-cutting.

## 체크리스트 (신규 도메인 추가 시)

1. `domain/<name>/domain/<Name>.java` — BaseEntity 상속, `@Builder`, 정적 팩토리 + validators.
2. `domain/<name>/repository/<Name>Repository.java` — JpaRepository, `Optional` 반환.
3. `domain/<name>/application/<Name>Service.java` + `<Name>ServiceImpl.java` — Optional 체이닝.
4. `domain/<name>/controller/<Name>Controller.java` — `@RequiredArgsConstructor`, `@Valid`.
5. `domain/<name>/controller/dto/` — Request/Response record.
6. `domain/<name>/exception/` — 도메인 예외.
7. `GlobalExceptionHandler`에 신규 예외 핸들러 추가.
