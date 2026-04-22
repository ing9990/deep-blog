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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SellerAuthService {

    private final SellerRepository repo;
    private final PasswordEncoder encoder;
    private final JwtProvider jwt;
    private final SellerRefreshTokenStore refreshStore;

    public SellerAuthService(
        SellerRepository repo,
        PasswordEncoder encoder,
        JwtProvider jwt,
        SellerRefreshTokenStore refreshStore
    ) {
        this.repo = repo;
        this.encoder = encoder;
        this.jwt = jwt;
        this.refreshStore = refreshStore;
    }

    public SellerSignupResponse signup(SellerSignupRequest req) {
        if (repo.existsByEmail(req.email())) {
            throw new BusinessException(SellerAuthErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (repo.existsByBusinessRegistrationNo(req.businessRegistrationNo())) {
            throw new BusinessException(SellerAuthErrorCode.BUSINESS_REGISTRATION_NO_ALREADY_EXISTS);
        }

        Seller saved = repo.save(Seller.signUpAutoApproved(
            req.email(),
            encoder.encode(req.password()),
            req.businessName(),
            req.businessRegistrationNo(),
            req.representativeName(),
            req.contactPhone(),
            req.settlementAccount()
        ));

        return new SellerSignupResponse(
            saved.getId(),
            saved.getEmail(),
            saved.getBusinessName(),
            saved.getStatus().name()
        );
    }

    public SellerLoginResponse login(SellerLoginRequest req) {
        Seller seller = repo.findByEmail(req.email())
            .orElseThrow(() -> new BusinessException(SellerAuthErrorCode.INVALID_CREDENTIALS));

        if (!encoder.matches(req.password(), seller.getPasswordHash())) {
            throw new BusinessException(SellerAuthErrorCode.INVALID_CREDENTIALS);
        }
        if (seller.getStatus() == SellerStatus.SUSPENDED
            || seller.getStatus() == SellerStatus.WITHDRAWN) {
            throw new BusinessException(SellerAuthErrorCode.SELLER_SUSPENDED);
        }

        String access = jwt.issueAccess(seller.getId());
        String refresh = jwt.issueRefresh(seller.getId());
        refreshStore.save(seller.getId(), refresh);

        return new SellerLoginResponse(
            seller.getId(),
            seller.getEmail(),
            seller.getBusinessName(),
            access,
            refresh
        );
    }
}
