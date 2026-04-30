package com.deepblog.member.application;

import com.deepblog.common.event.EventTopic;
import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.member.application.command.SellerSignupCommand;
import com.deepblog.member.application.event.SellerSignedUpEvent;
import com.deepblog.member.application.result.SellerSignupResult;
import com.deepblog.member.domain.Account;
import com.deepblog.member.domain.Seller;
import com.deepblog.member.outbox.OutboxEventStore;
import com.deepblog.member.repository.AccountRepository;
import com.deepblog.member.repository.SellerRepository;
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
    private final OutboxEventStore outboxEventStore;

    @Transactional
    public SellerSignupResult signup(SellerSignupCommand c) {
        if (accountRepository.existsByEmail(c.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL,
                "이미 가입된 이메일입니다: " + c.email());
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

        SellerSignedUpEvent event = new SellerSignedUpEvent(
            account.getId(), seller.getId(), account.getEmail());
        outboxEventStore.save(
            EventTopic.SELLER_SIGNED_UP.getName(),
            String.valueOf(account.getId()),
            event
        );

        return new SellerSignupResult(account.getId(), seller.getId(), account.getEmail());
    }
}
