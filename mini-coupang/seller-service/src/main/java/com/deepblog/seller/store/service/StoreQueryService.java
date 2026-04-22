package com.deepblog.seller.store.service;

import com.deepblog.common.error.BusinessException;
import com.deepblog.seller.store.common.exception.StoreErrorCode;
import com.deepblog.seller.store.entity.Store;
import com.deepblog.seller.store.repository.StoreRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreQueryService {

    private final StoreRepository storeRepository;

    public List<Store> findMyStores(Long sellerId) {
        return storeRepository.findAllBySellerIdOrderByCreatedAtDesc(sellerId);
    }

    public Store findMyStore(Long sellerId, Long storeId) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new BusinessException(StoreErrorCode.STORE_NOT_FOUND));
        if (!store.isOwnedBy(sellerId)) {
            throw new BusinessException(StoreErrorCode.STORE_FORBIDDEN);
        }
        return store;
    }
}
