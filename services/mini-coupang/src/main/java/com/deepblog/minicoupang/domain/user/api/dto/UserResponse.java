package com.deepblog.minicoupang.domain.user.api.dto;

import com.deepblog.minicoupang.domain.user.User;

public record UserResponse(Long id, String name, String email) {

    public static UserResponse from(User user) {
        if (user.getId() == null) {
            throw new IllegalStateException("persisted User must have id");
        }
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }
}
