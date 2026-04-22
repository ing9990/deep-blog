package com.deepblog.minicoupang.domain.auth.application;

public interface AuthService {

    Long signup(String email, String rawPassword);

    Long login(String email, String rawPassword);
}
