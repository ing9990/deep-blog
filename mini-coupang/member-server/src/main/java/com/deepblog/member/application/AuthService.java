package com.deepblog.member.application;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.member.application.result.LoginAsMemberResult;
import com.deepblog.member.application.result.LoginAsSellerResult;
import com.deepblog.member.domain.Account;
import com.deepblog.member.domain.Member;
import com.deepblog.member.domain.Seller;
import com.deepblog.member.repository.AccountRepository;
import com.deepblog.member.repository.MemberRepository;
import com.deepblog.member.repository.SellerRepository;
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
