package com.deepblog.member.controller;

import static org.springframework.http.HttpStatus.CREATED;

import com.deepblog.member.application.AuthService;
import com.deepblog.member.application.MemberSignupService;
import com.deepblog.member.application.SellerSignupService;
import com.deepblog.member.application.result.LoginAsMemberResult;
import com.deepblog.member.application.result.LoginAsSellerResult;
import com.deepblog.member.application.result.MemberSignupResult;
import com.deepblog.member.application.result.SellerSignupResult;
import com.deepblog.member.controller.dto.LoginRequest;
import com.deepblog.member.controller.dto.LoginResponse;
import com.deepblog.member.controller.dto.MemberSignupRequest;
import com.deepblog.member.controller.dto.MemberSignupResponse;
import com.deepblog.member.controller.dto.SellerLoginResponse;
import com.deepblog.member.controller.dto.SellerSignupRequest;
import com.deepblog.member.controller.dto.SellerSignupResponse;
import com.deepblog.member.global.session.SessionKeys;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final MemberSignupService memberSignupService;
    private final SellerSignupService sellerSignupService;

    @PostMapping("/signup/member")
    public ResponseEntity<MemberSignupResponse> signupMember(
        @Valid @RequestBody MemberSignupRequest request
    ) {
        MemberSignupResult result = memberSignupService.signup(request.toCommand());
        return ResponseEntity.status(CREATED).body(MemberSignupResponse.from(result));
    }

    @PostMapping("/signup/seller")
    public ResponseEntity<SellerSignupResponse> signupSeller(
        @Valid @RequestBody SellerSignupRequest request
    ) {
        SellerSignupResult result = sellerSignupService.signup(request.toCommand());
        return ResponseEntity.status(CREATED).body(SellerSignupResponse.from(result));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpSession session
    ) {
        LoginAsMemberResult r = authService.loginAsMember(request.email(), request.password());
        session.setAttribute(SessionKeys.AUTH_ACCOUNT_ID, r.accountId());
        return ResponseEntity.ok(new LoginResponse(r.accountId(), r.memberId()));
    }

    @PostMapping("/login/seller")
    public ResponseEntity<SellerLoginResponse> loginSeller(
        @Valid @RequestBody LoginRequest request,
        HttpSession session
    ) {
        LoginAsSellerResult r = authService.loginAsSeller(request.email(), request.password());
        session.setAttribute(SessionKeys.AUTH_ACCOUNT_ID, r.accountId());
        return ResponseEntity.ok(new SellerLoginResponse(r.accountId(), r.sellerId()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.noContent().build();
    }
}
