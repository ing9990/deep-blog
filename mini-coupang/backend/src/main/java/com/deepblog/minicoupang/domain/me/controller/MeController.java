package com.deepblog.minicoupang.domain.me.controller;

import com.deepblog.minicoupang.domain.auth.annotation.LoginRequired;
import com.deepblog.minicoupang.domain.me.application.MeResult;
import com.deepblog.minicoupang.domain.me.application.MeService;
import com.deepblog.minicoupang.domain.me.controller.dto.MeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final MeService meService;

    @GetMapping
    public ResponseEntity<MeResponse> me(@LoginRequired Long accountId) {
        MeResult result = meService.me(accountId);
        return ResponseEntity.ok(MeResponse.from(result));
    }
}
