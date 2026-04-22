package com.deepblog.product.catalog.entity;

public enum CatalogStoreStatus {

    OPEN,
    SUSPENDED,
    CLOSED;

    public boolean isVisible() {
        return this == OPEN;
    }
}
