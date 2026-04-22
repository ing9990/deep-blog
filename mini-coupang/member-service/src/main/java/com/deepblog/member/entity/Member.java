package com.deepblog.member.entity;

import com.deepblog.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

@Getter
@Entity
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Table(name = "members")
public class Member extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private MemberStatus status;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    public static Member create(String email, String passwordHash, String name, String phone) {
        validateEmail(email);
        validatePasswordHash(passwordHash);
        validateName(name);
        validatePhone(phone);

        return Member.builder()
            .email(email)
            .passwordHash(passwordHash)
            .name(name)
            .phone(phone)
            .status(MemberStatus.ACTIVE)
            .build();
    }

    public void markLoggedIn(LocalDateTime at) {
        if (at == null) {
            throw new IllegalArgumentException("lastLoginAt must not be null");
        }
        this.lastLoginAt = at;
    }

    private static void validateEmail(String email) {
        if (!StringUtils.hasText(email) || email.length() > 255 || !email.contains("@")) {
            throw new IllegalArgumentException("invalid email");
        }
    }

    private static void validatePasswordHash(String passwordHash) {
        if (!StringUtils.hasText(passwordHash) || passwordHash.length() > 255) {
            throw new IllegalArgumentException("invalid password hash");
        }
    }

    private static void validateName(String name) {
        if (!StringUtils.hasText(name) || name.length() > 100) {
            throw new IllegalArgumentException("invalid name");
        }
    }

    private static void validatePhone(String phone) {
        if (phone == null) {
            return;
        }
        if (phone.length() > 20 || !phone.matches("^[0-9-]{9,20}$")) {
            throw new IllegalArgumentException("invalid phone");
        }
    }
}
