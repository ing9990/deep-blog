package com.deepblog.member.application;

import com.deepblog.member.application.result.AuthVerifyResult;
import com.deepblog.member.repository.MemberRepository;
import com.deepblog.member.repository.SellerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 다른 서비스 (product-server, order-server) 의 Feign 호출을 위한 인증 검증.
 *
 * <p>세션 검증 자체는 Spring Session Redis 가 컨트롤러 진입에서 자동으로 처리하므로,
 * 본 서비스는 accountId 가 주어졌을 때 회원/판매자 식별자를 같이 묶어 반환만 한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthVerifyService {

    private final MemberRepository memberRepository;
    private final SellerRepository sellerRepository;

    public AuthVerifyResult verify(Long accountId) {
        Long memberId = memberRepository.findByAccountId(accountId)
            .map(m -> m.getId())
            .orElse(null);
        Long sellerId = sellerRepository.findByAccountId(accountId)
            .map(s -> s.getId())
            .orElse(null);
        return new AuthVerifyResult(accountId, memberId, sellerId);
    }
}
