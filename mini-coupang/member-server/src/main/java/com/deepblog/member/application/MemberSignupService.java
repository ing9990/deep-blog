package com.deepblog.member.application;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.member.application.command.MemberSignupCommand;
import com.deepblog.member.application.event.MemberSignedUpEvent;
import com.deepblog.member.application.result.MemberSignupResult;
import com.deepblog.member.domain.Account;
import com.deepblog.member.domain.Member;
import com.deepblog.member.repository.AccountRepository;
import com.deepblog.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberSignupService {

    private final AccountRepository accountRepository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public MemberSignupResult signup(MemberSignupCommand command) {
        if (accountRepository.existsByEmail(command.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL,
                "이미 가입된 이메일입니다: " + command.email());
        }
        Account account = accountRepository.save(
            Account.create(command.email(), passwordEncoder.encode(command.rawPassword()))
        );
        Member member = memberRepository.save(
            Member.create(account, command.name(), command.phoneNumber(), command.nickname())
        );

        eventPublisher.publishEvent(
            new MemberSignedUpEvent(account.getId(), member.getId(), account.getEmail()));

        return new MemberSignupResult(account.getId(), member.getId(), account.getEmail());
    }
}
