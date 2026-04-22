package com.deepblog.minicoupang.domain.member.repository;

import com.deepblog.minicoupang.domain.member.domain.Member;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByAccountId(Long accountId);

    Optional<Member> findByPhoneNumber(String phoneNumber);

    boolean existsByAccountId(Long accountId);

    boolean existsByPhoneNumber(String phoneNumber);
}
