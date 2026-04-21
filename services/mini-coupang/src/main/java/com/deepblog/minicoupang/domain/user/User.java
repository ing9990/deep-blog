package com.deepblog.minicoupang.domain.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * User aggregate root (구매자/주문자).
 * Seller와 동일한 UserOrder 패턴을 따른다.
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(toBuilder = true)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, unique = true, length = 200)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Version
    private Long version;

    /**
     * 사용자 생성 팩토리. passwordHash는 호출부가 인코딩 후 전달한다.
     */
    public static User create(String name, String email, String passwordHash) {
        validateName(name);
        validateEmail(email);
        validatePasswordHash(passwordHash);
        return User.builder()
                .name(name.trim())
                .email(email.trim().toLowerCase())
                .passwordHash(passwordHash)
                .build();
    }

    public void rename(String newName) {
        validateName(newName);
        this.name = newName.trim();
    }

    private static void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name must not be blank");
        }
    }

    private static void validateEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("email must not be blank");
        }
    }

    private static void validatePasswordHash(String hash) {
        if (hash == null || hash.isBlank()) {
            throw new IllegalArgumentException("passwordHash must not be blank");
        }
    }
}
