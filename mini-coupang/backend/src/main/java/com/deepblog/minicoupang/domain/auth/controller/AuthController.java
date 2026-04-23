package com.deepblog.minicoupang.domain.auth.controller;

import static org.springframework.http.HttpStatus.CREATED;

import com.deepblog.minicoupang.domain.auth.application.AuthService;
import com.deepblog.minicoupang.domain.auth.context.SessionKeys;
import com.deepblog.minicoupang.domain.auth.controller.dto.LoginRequest;
import com.deepblog.minicoupang.domain.auth.controller.dto.LoginResponse;
import com.deepblog.minicoupang.domain.auth.controller.dto.MemberSignupRequest;
import com.deepblog.minicoupang.domain.auth.controller.dto.MemberSignupResponse;
import com.deepblog.minicoupang.domain.auth.controller.dto.SignupRequest;
import com.deepblog.minicoupang.domain.auth.controller.dto.SignupResponse;
import com.deepblog.minicoupang.domain.member.application.MemberSignupResult;
import com.deepblog.minicoupang.domain.member.application.MemberSignupService;
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

    @PostMapping("/signup/member")
    public ResponseEntity<MemberSignupResponse> signupMember(
        @Valid @RequestBody MemberSignupRequest request
    ) {
        MemberSignupResult result = memberSignupService.signup(request.toCommand());
        return ResponseEntity.status(CREATED).body(MemberSignupResponse.from(result));
    }

    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signup(@Valid @RequestBody SignupRequest request) {
        Long accountId = authService.signup(request.email(), request.password());
        return ResponseEntity.status(CREATED)
            .body(new SignupResponse(accountId, request.email()));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpSession session
    ) {
        Long accountId = authService.login(request.email(), request.password());
        session.setAttribute(SessionKeys.AUTH_ACCOUNT_ID, accountId);
        return ResponseEntity.ok(new LoginResponse(accountId));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.noContent().build();
    }
}
