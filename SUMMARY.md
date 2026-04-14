# Table of contents

## Concurrency

* [ConcurrentHashMap과 bin-level lock](concurrency/concurrent-hashmap.md)
* [비관적 동기화 vs 낙관적 동기화 (CAS)](concurrency/optimistic-vs-pessimistic.md)
* [volatile과 메모리 가시성 (JMM)](concurrency/volatile-memory-visibility.md)
* [Race Condition / TOCTOU](concurrency/race-condition.md)
* [Thread Pool과 스레드 관리](concurrency/thread-pool.md)
* [Deadlock / Livelock / Starvation](concurrency/deadlock.md)
* [Synchronized vs ReentrantLock](concurrency/synchronized-vs-reentrantlock.md)
* [Coroutine과 비동기 처리](concurrency/coroutine.md)

## Cache

* [캐시 스탬피드](cache/cache-stampede.md)
* [stale-while-revalidate](cache/stale-while-revalidate.md)
* [캐시 크기 제한과 Eviction (LRU, LFU, W-TinyLFU)](cache/eviction-strategy.md)
* [로컬 캐시 vs 분산 캐시](cache/local-vs-distributed.md)
* [Cache Aside / Read Through / Write Through / Write Behind](cache/caching-strategy.md)
* [캐시 일관성 (Cache Coherence)](cache/cache-coherence.md)

## Rate Limiting

* [Fixed Window / Sliding Window / Token Bucket](rate-limiting/algorithms.md)
* [다층 방어 아키텍처](rate-limiting/defense-in-depth.md)

## Spring Framework

* [AOP Proxy와 Self-Invocation](spring/aop-proxy-self-invocation.md)
* [OSIV (Open Session In View)](spring/osiv.md)
* [@Transactional 전파와 Repository 프록시](spring/transaction.md)
* [Bean Lifecycle과 Scope](spring/bean-lifecycle.md)
* [Spring Security 인증/인가 흐름](spring/spring-security.md)

## Software Architecture

* [SOLID 원칙 적용과 판단 기준](architecture/solid.md)
* [추상화의 적정선](architecture/abstraction-tradeoff.md)
* [읽기/수집 경로 분리 (CQRS)](architecture/read-write-separation.md)
* [레이어드 아키텍처와 의존 방향](architecture/layered-architecture.md)
* [DDD 전술적 패턴](architecture/ddd-tactical.md)

## Security

* [입력 검증과 URL 인코딩](security/input-validation.md)
* [리소스 고갈 공격과 방어](security/resource-exhaustion.md)
* [인증 vs 인가](security/authn-vs-authz.md)
* [OWASP Top 10](security/owasp-top10.md)

## Network

* [HTTP/1.1 vs HTTP/2 vs HTTP/3](network/http-versions.md)
* [TCP 3-way Handshake / 4-way Teardown](network/tcp-handshake.md)
* [DNS 동작 원리](network/dns.md)
* [TLS/SSL Handshake](network/tls.md)
* [REST vs gRPC vs GraphQL](network/api-protocols.md)
* [Connection Pool과 Keep-Alive](network/connection-pool.md)

## Operating System

* [프로세스 vs 스레드](os/process-vs-thread.md)
* [컨텍스트 스위칭](os/context-switching.md)
* [가상 메모리와 페이징](os/virtual-memory.md)
* [CPU 스케줄링](os/cpu-scheduling.md)
* [I/O 모델 (Blocking, Non-Blocking, Multiplexing)](os/io-model.md)

## Database

* [인덱스 구조 (B-Tree, B+Tree, Hash)](database/index.md)
* [트랜잭션 격리 수준](database/isolation-level.md)
* [N+1 문제와 해결](database/n-plus-one.md)
* [정규화와 반정규화](database/normalization.md)
* [커넥션 풀](database/connection-pool.md)
* [Replication과 Sharding](database/replication-sharding.md)

## Data Structure & Algorithm

* [HashMap 내부 구조 (해시 충돌, 리사이징)](data-structure/hashmap.md)
* [Tree (Red-Black, AVL, B-Tree)](data-structure/tree.md)
* [시간복잡도 분석](data-structure/time-complexity.md)
* [정렬 알고리즘 비교](data-structure/sorting.md)
