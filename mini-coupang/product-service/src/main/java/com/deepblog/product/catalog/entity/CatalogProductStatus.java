package com.deepblog.product.catalog.entity;

public enum CatalogProductStatus {

    ON_SALE,
    OUT_OF_STOCK,
    HIDDEN,
    DELETED;

    public boolean isVisible() {
        return this == ON_SALE || this == OUT_OF_STOCK;
    }
}
