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
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final MemberRepository repo;
    private final PasswordEncoder encoder;
    private final JwtProvider jwt;
    private final RefreshTokenStore refreshStore;

    public AuthService(
        MemberRepository repo,
        PasswordEncoder encoder,
        JwtProvider jwt,
        RefreshTokenStore refreshStore
    ) {
        this.repo = repo;
        this.encoder = encoder;
        this.jwt = jwt;
        this.refreshStore = refreshStore;
    }

    public LoginResponse login(LoginRequest req) {
        Optional<Member> existing = repo.findByEmail(req.email());
        Member member;
        boolean newMember;
        if (existing.isEmpty()) {
            member = repo.save(Member.create(
                req.email(),
                encoder.encode(req.password()),
                deriveName(req.email()),
                null
            ));
            newMember = true;
        } else {
            member = existing.get();
            if (!encoder.matches(req.password(), member.getPasswordHash())) {
                throw new BusinessException(AuthErrorCode.INVALID_CREDENTIALS);
            }
            member.markLoggedIn(LocalDateTime.now());
            newMember = false;
        }

        String access = jwt.issueAccess(member.getId());
        String refresh = jwt.issueRefresh(member.getId());
        refreshStore.save(member.getId(), refresh);

        return new LoginResponse(
            member.getId(),
            member.getEmail(),
            member.getName(),
            access,
            refresh,
            newMember
        );
    }

    private String deriveName(String email) {
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }
}
