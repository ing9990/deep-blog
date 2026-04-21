package com.deepblog.minicoupang.domain.auth.service;

import com.deepblog.minicoupang.domain.auth.Role;
import com.deepblog.minicoupang.domain.auth.api.dto.LoginRequest;
import com.deepblog.minicoupang.domain.auth.api.dto.LoginResponse;
import com.deepblog.minicoupang.domain.seller.Seller;
import com.deepblog.minicoupang.domain.seller.storage.SellerRepository;
import com.deepblog.minicoupang.domain.user.User;
import com.deepblog.minicoupang.domain.user.storage.UserRepository;
import com.deepblog.minicoupang.global.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * User와 Seller 두 aggregate 모두에게 로그인을 제공한다.
 * 같은 email이 두 테이블에 존재하는 경우는 정책상 허용하지 않는다 (운영 초기 경험).
 * 여기서는 User 우선 조회 → 없으면 Seller 조회.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final SellerRepository sellerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public LoginResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null && passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            String token = jwtProvider.issue(String.valueOf(user.getId()), Role.USER.name());
            return new LoginResponse(token, jwtProvider.ttlSeconds(), Role.USER, user.getId());
        }

        Seller seller = sellerRepository.findByEmail(email).orElse(null);
        if (seller != null && passwordEncoder.matches(request.password(), seller.getPasswordHash())) {
            String token = jwtProvider.issue(String.valueOf(seller.getId()), Role.SELLER.name());
            return new LoginResponse(token, jwtProvider.ttlSeconds(), Role.SELLER, seller.getId());
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
    }
}
