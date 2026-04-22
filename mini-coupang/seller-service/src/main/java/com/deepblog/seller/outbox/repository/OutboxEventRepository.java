package com.deepblog.seller.outbox.repository;

import com.deepblog.seller.outbox.entity.OutboxEvent;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    List<OutboxEvent> findByPublishedAtIsNullOrderByIdAsc(Pageable pageable);

    long countByPublishedAtIsNull();

    @Modifying
    @Query("delete from OutboxEvent e where e.createdAt < :threshold")
    long deleteByCreatedAtBefore(LocalDateTime threshold);
}
