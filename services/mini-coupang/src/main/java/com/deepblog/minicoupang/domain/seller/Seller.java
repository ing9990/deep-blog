package com.deepblog.minicoupang.domain.seller;

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
 * Seller aggregate root.
 *
 * 소스 패턴(woowahan-eats UserOrder 기반):
 * - @NoArgsConstructor(PROTECTED): JPA 요구사항을 충족하되 외부 new 차단.
 * - @AllArgsConstructor(PRIVATE): @Builder가 내부적으로 사용.
 * - @Builder(toBuilder = true): toBuilder로 불변식 유지하며 파생 인스턴스 생성.
 * - 필드 전체 private + @Getter만 노출. Setter는 금지.
 * - 상태 변경은 반드시 도메인 메서드 경유(rename 등). 직접 필드 접근 X.
 */
@Entity
@Table(name = "sellers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(toBuilder = true)
public class Seller {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seller_id")
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, unique = true, length = 200)
    private String email;

    @Version
    private Long version;

    /**
     * 판매자 생성 팩토리. email은 lowercase로 정규화.
     */
    public static Seller create(String name, String email) {
        validateName(name);
        validateEmail(email);
        return Seller.builder()
                .name(name.trim())
                .email(email.trim().toLowerCase())
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
}
