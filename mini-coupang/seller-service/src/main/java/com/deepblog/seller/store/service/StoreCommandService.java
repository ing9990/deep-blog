package com.deepblog.seller.store.service;

import com.deepblog.common.error.BusinessException;
import com.deepblog.seller.store.common.exception.StoreErrorCode;
import com.deepblog.seller.store.entity.Store;
import com.deepblog.seller.store.model.request.CreateStoreRequest;
import com.deepblog.seller.store.model.request.UpdateStoreRequest;
import com.deepblog.seller.store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreCommandService {

    private final StoreRepository storeRepository;

    @Transactional
    public Store create(Long sellerId, CreateStoreRequest request) {
        if (storeRepository.existsBySlug(request.slug())) {
            throw new BusinessException(StoreErrorCode.SLUG_ALREADY_EXISTS);
        }
        Store store = Store.openNew(
            sellerId,
            request.name(),
            request.slug(),
            request.description(),
            request.logoImageUrl(),
            request.coverImageUrl()
        );
        try {
            return storeRepository.save(store);
        } catch (DataIntegrityViolationException concurrent) {
            throw new BusinessException(StoreErrorCode.SLUG_ALREADY_EXISTS);
        }
    }

    @Transactional
    public Store update(Long sellerId, Long storeId, UpdateStoreRequest request) {
        Store store = loadOwned(sellerId, storeId);
        if (store.isClosed()) {
            throw new BusinessException(StoreErrorCode.STORE_ALREADY_CLOSED);
        }
        store.update(
            request.name(),
            request.description(),
            request.logoImageUrl(),
            request.coverImageUrl()
        );
        return store;
    }

    @Transactional
    public Store close(Long sellerId, Long storeId) {
        Store store = loadOwned(sellerId, storeId);
        if (store.isClosed()) {
            throw new BusinessException(StoreErrorCode.STORE_ALREADY_CLOSED);
        }
        store.close();
        return store;
    }

    private Store loadOwned(Long sellerId, Long storeId) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new BusinessException(StoreErrorCode.STORE_NOT_FOUND));
        if (!store.isOwnedBy(sellerId)) {
            throw new BusinessException(StoreErrorCode.STORE_FORBIDDEN);
        }
        return store;
    }
}
