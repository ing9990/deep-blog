package com.deepblog.product.catalog.service;

import com.deepblog.common.error.BusinessException;
import com.deepblog.product.catalog.common.exception.CatalogErrorCode;
import com.deepblog.product.catalog.entity.CatalogProduct;
import com.deepblog.product.catalog.repository.CatalogProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogProductQueryService {

    private final CatalogProductRepository repository;

    public CatalogProduct get(Long productId) {
        CatalogProduct product = repository.findById(productId)
            .orElseThrow(() -> new BusinessException(CatalogErrorCode.PRODUCT_NOT_FOUND));
        if (!product.isVisible()) {
            throw new BusinessException(CatalogErrorCode.PRODUCT_NOT_FOUND);
        }
        return product;
    }
}
