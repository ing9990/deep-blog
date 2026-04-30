package com.deepblog.member.application;

import com.deepblog.common.exception.BusinessException;
import com.deepblog.common.exception.ErrorCode;
import com.deepblog.member.application.result.MeResult;
import com.deepblog.member.domain.Account;
import com.deepblog.member.repository.AccountRepository;
import com.deepblog.member.repository.MemberRepository;
import com.deepblog.member.repository.SellerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MeService {

    private final AccountRepository accountRepository;
    private final MemberRepository memberRepository;
    private final SellerRepository sellerRepository;

    public MeResult me(Long accountId) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));

        MeResult.MemberInfo memberInfo = memberRepository.findByAccountId(accountId)
            .map(m -> new MeResult.MemberInfo(m.getId(), m.getName(), m.getPhoneNumber(), m.getNickname()))
            .orElse(null);

        MeResult.SellerInfo sellerInfo = sellerRepository.findByAccountId(accountId)
            .map(s -> new MeResult.SellerInfo(s.getId(), s.getBusinessName(),
                s.getBusinessRegistrationNumber(), s.getRepresentativeName(), s.getPhoneNumber()))
            .orElse(null);

        return new MeResult(account.getId(), account.getEmail(), memberInfo, sellerInfo);
    }
}
