create table stores (
    id           bigserial    primary key,
    seller_id    bigint       not null references sellers(id),
    name         varchar(100) not null,
    slug         varchar(80)  not null unique,
    description  text,
    logo_image_url   varchar(500),
    cover_image_url  varchar(500),
    status       varchar(32)  not null,
    created_at   timestamp    not null,
    updated_at   timestamp    not null,
    closed_at    timestamp
);

create index idx_stores_seller_id on stores(seller_id);
create index idx_stores_status on stores(status);
