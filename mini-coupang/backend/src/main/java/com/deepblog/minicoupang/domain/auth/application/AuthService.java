package com.deepblog.minicoupang.domain.auth.application;

import com.deepblog.minicoupang.domain.auth.domain.Account;
import com.deepblog.minicoupang.domain.auth.repository.AccountRepository;
import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.domain.seller.domain.Seller;
import com.deepblog.minicoupang.domain.seller.repository.SellerRepository;
import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final MemberRepository memberRepository;
    private final SellerRepository sellerRepository;

    public record LoginAsMemberResult(Long accountId, Long memberId) {}
    public record LoginAsSellerResult(Long accountId, Long sellerId) {}

    @Transactional(readOnly = true)
    public LoginAsMemberResult loginAsMember(String email, String rawPassword) {
        Account account = accountRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        if (!passwordEncoder.matches(rawPassword, account.getPasswordHash())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
        Member member = memberRepository.findByAccountId(account.getId())
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_A_MEMBER,
                "구매자 계정이 아닙니다. 판매자 포털을 이용해 주세요."));
        return new LoginAsMemberResult(account.getId(), member.getId());
    }

    @Transactional(readOnly = true)
    public LoginAsSellerResult loginAsSeller(String email, String rawPassword) {
        Account account = accountRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        if (!passwordEncoder.matches(rawPassword, account.getPasswordHash())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
        Seller seller = sellerRepository.findByAccountId(account.getId())
            .orElseThrow(() -> new BusinessException(ErrorCode.SELLER_NOT_REGISTERED,
                "판매자 계정이 아닙니다. 구매자 포털을 이용해 주세요."));
        return new LoginAsSellerResult(account.getId(), seller.getId());
    }
}
