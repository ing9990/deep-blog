package com.deepblog.order.outbox;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    /**
     * 발행되지 않은 이벤트를 outbox PK 순으로 최대 100건 가져온다. PK 가 TSID 라
     * 시간순 정렬과 의미상 같다.
     */
    List<OutboxEvent> findTop100ByPublishedFalseOrderByIdAsc();
}
