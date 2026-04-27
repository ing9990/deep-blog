package com.deepblog.minicoupang.domain.seller.application;

import com.deepblog.minicoupang.domain.auth.domain.Account;
import com.deepblog.minicoupang.domain.auth.repository.AccountRepository;
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
public class SellerSignupService {

    private final AccountRepository accountRepository;
    private final SellerRepository sellerRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public SellerSignupResult signup(SellerSignupCommand c) {
        if (accountRepository.existsByEmail(c.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL, "이미 가입된 이메일입니다: " + c.email());
        }
        if (sellerRepository.existsByBusinessRegistrationNumber(c.businessRegistrationNumber())) {
            throw new BusinessException(ErrorCode.INVALID_SELLER, "이미 등록된 사업자등록번호입니다.");
        }
        Account account = accountRepository.save(
            Account.create(c.email(), passwordEncoder.encode(c.rawPassword()))
        );
        Seller seller = sellerRepository.save(
            Seller.create(account, c.businessName(), c.businessRegistrationNumber(),
                c.representativeName(), c.phoneNumber())
        );
        return new SellerSignupResult(account.getId(), seller.getId(), account.getEmail());
    }
}
