package com.deepblog.seller.store.entity;

public enum StoreStatus {

    DRAFT,
    OPEN,
    SUSPENDED,
    CLOSED;

    public boolean isClosed() {
        return this == CLOSED;
    }

    public boolean isMutable() {
        return this == DRAFT || this == OPEN;
    }
}
