package com.deepblog.minicoupang.domain.auth.api.dto;

import com.deepblog.minicoupang.domain.auth.Role;

public record LoginResponse(String accessToken, long expiresIn, Role role, Long principalId) {}
