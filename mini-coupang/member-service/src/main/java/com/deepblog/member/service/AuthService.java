package com.deepblog.member.service;

import com.deepblog.common.error.BusinessException;
import com.deepblog.member.common.auth.JwtProvider;
import com.deepblog.member.common.exception.AuthErrorCode;
import com.deepblog.member.entity.Member;
import com.deepblog.member.infrastructure.redis.RefreshTokenStore;
import com.deepblog.member.model.request.LoginRequest;
import com.deepblog.member.model.response.LoginResponse;
import com.deepblog.member.repository.MemberRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RefreshTokenStore refreshTokenStore;

    public LoginResponse login(LoginRequest request) {
        Authenticated authenticated = memberRepository.findByEmail(request.email())
            .map(existing -> authenticateExisting(existing, request.password()))
            .orElseGet(() -> registerAndAuthenticate(request));

        return issueTokens(authenticated);
    }

    private Authenticated authenticateExisting(Member member, String rawPassword) {
        if (!passwordEncoder.matches(rawPassword, member.getPasswordHash())) {
            throw new BusinessException(AuthErrorCode.INVALID_CREDENTIALS);
        }
        member.markLoggedIn(LocalDateTime.now());
        return new Authenticated(member, false);
    }

    private Authenticated registerAndAuthenticate(LoginRequest request) {
        Member member = memberRepository.save(Member.create(
            request.email(),
            passwordEncoder.encode(request.password()),
            deriveName(request.email()),
            null
        ));
        return new Authenticated(member, true);
    }

    private LoginResponse issueTokens(Authenticated authenticated) {
        Member member = authenticated.member();
        String access = jwtProvider.issueAccess(member.getId());
        String refresh = jwtProvider.issueRefresh(member.getId());
        refreshTokenStore.save(member.getId(), refresh);

        return new LoginResponse(
            member.getId(),
            member.getEmail(),
            member.getName(),
            access,
            refresh,
            authenticated.newMember()
        );
    }

    private String deriveName(String email) {
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }

    private record Authenticated(Member member, boolean newMember) {
    }
}
