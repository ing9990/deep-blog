package com.deepblog.minicoupang.domain.member.application;

import com.deepblog.minicoupang.domain.auth.domain.Account;
import com.deepblog.minicoupang.domain.auth.repository.AccountRepository;
import com.deepblog.minicoupang.domain.member.domain.Member;
import com.deepblog.minicoupang.domain.member.repository.MemberRepository;
import com.deepblog.minicoupang.global.exception.BusinessException;
import com.deepblog.minicoupang.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberSignupService {

    private final AccountRepository accountRepository;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public MemberSignupResult signup(MemberSignupCommand command) {
        if (accountRepository.existsByEmail(command.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL, "이미 가입된 이메일입니다: " + command.email());
        }
        Account account = accountRepository.save(
            Account.create(command.email(), passwordEncoder.encode(command.rawPassword()))
        );
        Member member = memberRepository.save(
            Member.create(account, command.name(), command.phoneNumber(), command.nickname())
        );
        return new MemberSignupResult(account.getId(), member.getId(), account.getEmail());
    }
}
