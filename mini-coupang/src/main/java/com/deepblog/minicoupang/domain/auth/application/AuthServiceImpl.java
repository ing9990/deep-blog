package com.deepblog.minicoupang.domain.auth.application;

import com.deepblog.minicoupang.domain.auth.domain.Account;
import com.deepblog.minicoupang.domain.auth.exception.DuplicateEmailException;
import com.deepblog.minicoupang.domain.auth.exception.InvalidCredentialsException;
import com.deepblog.minicoupang.domain.auth.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public Long signup(String email, String rawPassword) {
        accountRepository.findByEmail(email).ifPresent(existing -> {
            throw new DuplicateEmailException(email);
        });

        return accountRepository
            .save(Account.create(email, passwordEncoder.encode(rawPassword)))
            .getId();
    }

    @Override
    @Transactional(readOnly = true)
    public Long login(String email, String rawPassword) {
        return accountRepository.findByEmail(email)
            .filter(account -> passwordEncoder.matches(rawPassword, account.getPasswordHash()))
            .map(Account::getId)
            .orElseThrow(InvalidCredentialsException::new);
    }
}
