package com.deepblog.minicoupang.domain.auth.application;

import com.deepblog.minicoupang.domain.auth.domain.Account;
import com.deepblog.minicoupang.domain.auth.exception.DuplicateEmailException;
import com.deepblog.minicoupang.domain.auth.exception.InvalidCredentialsException;
import com.deepblog.minicoupang.domain.auth.repository.AccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(AccountRepository accountRepository, PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public Long signup(String email, String rawPassword) {
        if (accountRepository.existsByEmail(email)) {
            throw new DuplicateEmailException(email);
        }
        String hash = passwordEncoder.encode(rawPassword);
        Account saved = accountRepository.save(Account.create(email, hash));
        return saved.getId();
    }

    @Override
    @Transactional(readOnly = true)
    public Long login(String email, String rawPassword) {
        Account account = accountRepository.findByEmail(email)
            .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(rawPassword, account.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        return account.getId();
    }
}
