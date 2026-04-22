package com.deepblog.seller.product.entity;

public enum ProductStatus {
    ON_SALE,
    HIDDEN,
    DELETED;

    public boolean isMutable() {
        return this != DELETED;
    }

    public boolean isDeleted() {
        return this == DELETED;
    }
}
