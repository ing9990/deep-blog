package com.deepblog.member.controller;

import com.deepblog.common.response.CommonResponse;
import com.deepblog.member.model.request.LoginRequest;
import com.deepblog.member.model.response.LoginResponse;
import com.deepblog.member.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public ResponseEntity<CommonResponse<LoginResponse>> login(
        @Valid @RequestBody LoginRequest request
    ) {
        LoginResponse data = service.login(request);
        HttpStatus status = data.newMember() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(CommonResponse.ok(data));
    }
}
