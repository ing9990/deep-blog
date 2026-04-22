create table seller_products (
    id              bigserial    primary key,
    seller_id       bigint       not null references sellers(id),
    store_id        bigint       not null references stores(id),
    category_id     bigint       not null,
    sku             varchar(64)  not null,
    name            varchar(200) not null,
    price           bigint       not null,
    currency        varchar(3)   not null default 'KRW',
    main_image_url  varchar(500),
    status          varchar(32)  not null,
    created_at      timestamp    not null,
    updated_at      timestamp    not null,
    constraint uk_seller_products_seller_sku unique (seller_id, sku)
);

create index idx_seller_products_store on seller_products(store_id);
create index idx_seller_products_status on seller_products(status);
