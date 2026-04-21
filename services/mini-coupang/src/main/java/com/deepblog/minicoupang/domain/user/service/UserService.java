package com.deepblog.minicoupang.domain.user.service;

import com.deepblog.minicoupang.domain.user.User;
import com.deepblog.minicoupang.domain.user.api.dto.CreateUserRequest;
import com.deepblog.minicoupang.domain.user.api.dto.UserResponse;
import com.deepblog.minicoupang.domain.user.storage.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        String hash = passwordEncoder.encode(request.password());
        User user = User.create(request.name(), request.email(), hash);
        try {
            User saved = repository.save(user);
            return UserResponse.from(saved);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "이미 등록된 email: " + request.email(),
                    e);
        }
    }

    public UserResponse findById(Long id) {
        User user = repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id));
        return UserResponse.from(user);
    }
}
