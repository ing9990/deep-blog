package com.deepblog.minicoupang.domain.member.domain;

import com.deepblog.minicoupang.domain.auth.domain.Account;
import com.deepblog.minicoupang.domain.common.BaseEntity;
import com.deepblog.minicoupang.domain.member.exception.InvalidMemberException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
@Table(name = "members")
public class Member extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private Account account;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "phone_number", nullable = false, length = 11, unique = true)
    private String phoneNumber;

    @Column(name = "nickname", length = 30)
    private String nickname;

    public static Member create(
        Account account,
        String name,
        String phoneNumber,
        String nickname
    ) {
        validateAccount(account);
        validateName(name);
        validatePhoneNumber(phoneNumber);
        validateNickname(nickname);

        return Member.builder()
            .account(account)
            .name(name)
            .phoneNumber(phoneNumber)
            .nickname(nickname)
            .build();
    }

    private static void validateAccount(Account account) {
        if (account == null) {
            throw new InvalidMemberException("계정 정보가 올바르지 않습니다.");
        }
    }

    private static void validateName(String name) {
        if (name == null || name.length() < 2 || name.length() > 50) {
            throw new InvalidMemberException("이름은 2자 이상 50자 이하여야 합니다.");
        }
    }

    private static void validatePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 10 || phoneNumber.length() > 11) {
            throw new InvalidMemberException("전화번호는 10자 이상 11자 이하여야 합니다.");
        }
    }

    private static void validateNickname(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            return;
        }
        if (nickname.length() < 2 || nickname.length() > 30) {
            throw new InvalidMemberException("닉네임은 2자 이상 30자 이하여야 합니다.");
        }
    }
}
