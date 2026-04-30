package com.deepblog.common.id;

import com.github.f4b6a3.tsid.TsidCreator;
import org.springframework.stereotype.Component;

/**
 * 분산 환경 안전한 64-bit ID 생성기. 모든 서비스가 동일 패턴으로 사용하도록 common-modules 에 둔다.
 *
 * <ul>
 *   <li>Snowflake 계열 64-bit long. {@code BIGINT} 컬럼에 그대로 저장.</li>
 *   <li>timestamp 가 prefix → 시간순 정렬 가능. B-tree 인덱스 locality 도 IDENTITY 와 비슷하게 좋다.</li>
 *   <li>여러 인스턴스가 동시에 ID 를 만들어도 충돌 없음 (TSID 내부의 노드 ID + sequence).</li>
 * </ul>
 *
 * <p>저장 패턴: 도메인 팩토리에 ID 를 외부에서 주입한다 (엔티티는 자기 상태 불변식만 검증).
 *
 * <pre>{@code
 * Order order = Order.create(tsidGenerator.nextId(), memberId);
 * orderRepository.save(order);
 * }</pre>
 *
 * <p>{@code @Id} 만 두고 {@code @GeneratedValue} 를 제거한 엔티티는 {@code Persistable<Long>}
 * 을 구현해 {@code save()} 가 SELECT 없이 곧장 INSERT 하도록 한다.
 */
@Component
public class TsidGenerator {

    public Long nextId() {
        return TsidCreator.getTsid().toLong();
    }

    public String nextString() {
        return TsidCreator.getTsid().toString();
    }
}
