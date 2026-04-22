package com.deepblog.seller.entity;

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
@Table(name = "sellers")
public class Seller extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "business_name", nullable = false, length = 100)
    private String businessName;

    @Column(name = "business_registration_no", nullable = false, unique = true, length = 32)
    private String businessRegistrationNo;

    @Column(name = "representative_name", nullable = false, length = 100)
    private String representativeName;

    @Column(name = "contact_phone", nullable = false, length = 20)
    private String contactPhone;

    @Column(name = "settlement_account", length = 64)
    private String settlementAccount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SellerStatus status;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    public static Seller signUpAutoApproved(
        String email,
        String passwordHash,
        String businessName,
        String businessRegistrationNo,
        String representativeName,
        String contactPhone,
        String settlementAccount
    ) {
        validateEmail(email);
        validatePasswordHash(passwordHash);
        validateBusinessName(businessName);
        validateBusinessRegistrationNo(businessRegistrationNo);
        validateRepresentativeName(representativeName);
        validateContactPhone(contactPhone);
        validateSettlementAccount(settlementAccount);

        return Seller.builder()
            .email(email)
            .passwordHash(passwordHash)
            .businessName(businessName)
            .businessRegistrationNo(businessRegistrationNo)
            .representativeName(representativeName)
            .contactPhone(contactPhone)
            .settlementAccount(settlementAccount)
            .status(SellerStatus.APPROVED)
            .approvedAt(LocalDateTime.now())
            .build();
    }

    public void suspend() {
        this.status = SellerStatus.SUSPENDED;
    }

    public boolean isActive() {
        return status == SellerStatus.APPROVED;
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

    private static void validateBusinessName(String businessName) {
        if (!StringUtils.hasText(businessName) || businessName.length() > 100) {
            throw new IllegalArgumentException("invalid business name");
        }
    }

    private static void validateBusinessRegistrationNo(String no) {
        if (!StringUtils.hasText(no) || !no.matches("^\\d{3}-\\d{2}-\\d{5}$")) {
            throw new IllegalArgumentException("invalid business registration no");
        }
    }

    private static void validateRepresentativeName(String name) {
        if (!StringUtils.hasText(name) || name.length() > 100) {
            throw new IllegalArgumentException("invalid representative name");
        }
    }

    private static void validateContactPhone(String phone) {
        if (!StringUtils.hasText(phone) || !phone.matches("^[0-9-]{9,20}$")) {
            throw new IllegalArgumentException("invalid contact phone");
        }
    }

    private static void validateSettlementAccount(String account) {
        if (account == null) {
            return;
        }
        if (account.length() > 64) {
            throw new IllegalArgumentException("invalid settlement account");
        }
    }
}
