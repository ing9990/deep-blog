package com.deepblog.seller.controller;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.seller.model.request.SellerLoginRequest;
import com.deepblog.seller.model.request.SellerSignupRequest;
import com.deepblog.seller.model.response.SellerLoginResponse;
import com.deepblog.seller.model.response.SellerSignupResponse;
import com.deepblog.seller.service.SellerAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seller/auth")
public class SellerAuthController {

    private final SellerAuthService service;

    public SellerAuthController(SellerAuthService service) {
        this.service = service;
    }

    @PostMapping("/signup")
    public ResponseEntity<CommonResponse<SellerSignupResponse>> signup(
        @Valid @RequestBody SellerSignupRequest request
    ) {
        SellerSignupResponse data = service.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(CommonResponse.ok(data));
    }

    @PostMapping("/login")
    public ResponseEntity<CommonResponse<SellerLoginResponse>> login(
        @Valid @RequestBody SellerLoginRequest request
    ) {
        SellerLoginResponse data = service.login(request);
        return ResponseEntity.ok(CommonResponse.ok(data));
    }
}
