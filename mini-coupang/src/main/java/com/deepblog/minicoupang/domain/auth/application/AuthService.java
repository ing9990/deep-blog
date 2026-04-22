package com.example.minicoupang.domain.auth.application;

public interface AuthService {

    Long signup(String email, String rawPassword);

    Long login(String email, String rawPassword);
}
