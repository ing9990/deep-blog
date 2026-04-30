package com.deepblog.member.domain;

import static jakarta.persistence.FetchType.LAZY;
import static jakarta.persistence.GenerationType.IDENTITY;
import static lombok.AccessLevel.PRIVATE;
import static lombok.AccessLevel.PROTECTED;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = PROTECTED)
@AllArgsConstructor(access = PRIVATE)
@Builder
@Table(name = "sellers")
public class Seller extends BaseEntity {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    @Column(name = "seller_id")
    private Long id;

    @OneToOne(fetch = LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private Account account;

    @Column(name = "business_name", nullable = false, length = 100, unique = true)
    private String businessName;

    @Column(name = "business_registration_number", nullable = false, length = 10, unique = true)
    private String businessRegistrationNumber;

    @Column(name = "representative_name", nullable = false, length = 50)
    private String representativeName;

    @Column(name = "phone_number", nullable = false, length = 11)
    private String phoneNumber;

    public static Seller create(
        Account account,
        String businessName,
        String businessRegistrationNumber,
        String representativeName,
        String phoneNumber
    ) {
        validateAccount(account);
        validateBusinessName(businessName);
        validateBusinessRegistrationNumber(businessRegistrationNumber);
        validateRepresentativeName(representativeName);
        validatePhoneNumber(phoneNumber);

        return Seller.builder()
            .account(account)
            .businessName(businessName)
            .businessRegistrationNumber(businessRegistrationNumber)
            .representativeName(representativeName)
            .phoneNumber(phoneNumber)
            .build();
    }

    private static void validateAccount(Account account) {
        if (account == null) {
            throw new BusinessException(ErrorCode.INVALID_SELLER, "계정 정보가 올바르지 않습니다.");
        }
    }

    private static void validateBusinessName(String businessName) {
        if (businessName == null || businessName.length() < 2 || businessName.length() > 100) {
            throw new BusinessException(ErrorCode.INVALID_SELLER, "상호명은 2자 이상 100자 이하여야 합니다.");
        }
    }

    private static void validateBusinessRegistrationNumber(String brn) {
        if (brn == null || brn.length() != 10 || !brn.chars().allMatch(Character::isDigit)) {
            throw new BusinessException(ErrorCode.INVALID_SELLER, "사업자등록번호는 숫자 10자리여야 합니다.");
        }
    }

    private static void validateRepresentativeName(String representativeName) {
        if (representativeName == null
            || representativeName.length() < 2
            || representativeName.length() > 50) {
            throw new BusinessException(ErrorCode.INVALID_SELLER, "대표자명은 2자 이상 50자 이하여야 합니다.");
        }
    }

    private static void validatePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 10 || phoneNumber.length() > 11) {
            throw new BusinessException(ErrorCode.INVALID_SELLER, "전화번호는 10자 이상 11자 이하여야 합니다.");
        }
    }
}
