package com.deepblog.common.event;

public enum EventTopic {
    MEMBER("member"),
    SELLER("seller"),
    PRODUCT("product");

    private final String name;

    EventTopic(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
