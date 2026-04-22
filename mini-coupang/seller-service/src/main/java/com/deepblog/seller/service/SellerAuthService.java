package com.deepblog.seller.service;

import com.deepblog.common.error.BusinessException;
import com.deepblog.seller.common.auth.JwtProvider;
import com.deepblog.seller.common.exception.SellerAuthErrorCode;
import com.deepblog.seller.entity.Seller;
import com.deepblog.seller.entity.SellerStatus;
import com.deepblog.seller.infrastructure.redis.SellerRefreshTokenStore;
import com.deepblog.seller.model.request.SellerLoginRequest;
import com.deepblog.seller.model.request.SellerSignupRequest;
import com.deepblog.seller.model.response.SellerLoginResponse;
import com.deepblog.seller.model.response.SellerSignupResponse;
import com.deepblog.seller.repository.SellerRepository;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class SellerAuthService {

    private static final Set<SellerStatus> BLOCKED_STATUSES =
        Set.of(SellerStatus.SUSPENDED, SellerStatus.WITHDRAWN);

    private final SellerRepository sellerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final SellerRefreshTokenStore refreshTokenStore;

    public SellerSignupResponse signup(SellerSignupRequest request) {
        if (sellerRepository.existsByEmail(request.email())) {
            throw new BusinessException(SellerAuthErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (sellerRepository.existsByBusinessRegistrationNo(request.businessRegistrationNo())) {
            throw new BusinessException(
                SellerAuthErrorCode.BUSINESS_REGISTRATION_NO_ALREADY_EXISTS
            );
        }

        Seller saved = sellerRepository.save(Seller.signUpAutoApproved(
            request.email(),
            passwordEncoder.encode(request.password()),
            request.businessName(),
            request.businessRegistrationNo(),
            request.representativeName(),
            request.contactPhone(),
            request.settlementAccount()
        ));

        return new SellerSignupResponse(
            saved.getId(),
            saved.getEmail(),
            saved.getBusinessName(),
            saved.getStatus().name()
        );
    }

    public SellerLoginResponse login(SellerLoginRequest request) {
        Seller seller = sellerRepository.findByEmail(request.email())
            .orElseThrow(() -> new BusinessException(SellerAuthErrorCode.INVALID_CREDENTIALS));

        verifyPassword(request.password(), seller.getPasswordHash());
        verifyActive(seller.getStatus());

        String access = jwtProvider.issueAccess(seller.getId());
        String refresh = jwtProvider.issueRefresh(seller.getId());
        refreshTokenStore.save(seller.getId(), refresh);

        return new SellerLoginResponse(
            seller.getId(),
            seller.getEmail(),
            seller.getBusinessName(),
            access,
            refresh
        );
    }

    private void verifyPassword(String rawPassword, String storedHash) {
        if (!passwordEncoder.matches(rawPassword, storedHash)) {
            throw new BusinessException(SellerAuthErrorCode.INVALID_CREDENTIALS);
        }
    }

    private void verifyActive(SellerStatus status) {
        if (BLOCKED_STATUSES.contains(status)) {
            throw new BusinessException(SellerAuthErrorCode.SELLER_SUSPENDED);
        }
    }
}
