-- ============================================================
-- product_categories (카탈로그 분류 트리 마스터)
-- ============================================================
create table product_categories (
    id             bigserial    primary key,
    parent_id      bigint       references product_categories(id),
    name           varchar(100) not null,
    slug           varchar(100) not null unique,
    depth          int          not null default 0,
    path           varchar(500) not null,
    display_order  int          not null default 0,
    status         varchar(32)  not null,
    created_at     timestamp    not null,
    updated_at     timestamp    not null
);

create index idx_category_parent on product_categories(parent_id);
create index idx_category_path on product_categories(path);
create index idx_category_status on product_categories(status);

-- ============================================================
-- catalog_stores (seller-service Store의 전시용 스냅샷)
--   id 는 seller-service stores.id 와 공유
-- ============================================================
create table catalog_stores (
    id                 bigint       primary key,
    seller_id          bigint       not null,
    name               varchar(100) not null,
    slug               varchar(80)  not null unique,
    description        text,
    logo_image_url     varchar(500),
    cover_image_url    varchar(500),
    status             varchar(32)  not null,
    product_count      int          not null default 0,
    popularity_score   double precision not null default 0,
    closed_at          timestamp,
    created_at         timestamp    not null,
    updated_at         timestamp    not null
);

create index idx_catalog_stores_status on catalog_stores(status);
create index idx_catalog_stores_seller on catalog_stores(seller_id);
create index idx_catalog_stores_popularity on catalog_stores(popularity_score desc);

-- ============================================================
-- catalog_products (seller-service Product의 전시용 스냅샷)
--   id 는 seller-service seller_products.id 와 공유
-- ============================================================
create table catalog_products (
    id                 bigint       primary key,
    store_id           bigint       not null,
    store_name         varchar(100) not null,
    seller_id          bigint       not null,
    category_id        bigint       not null references product_categories(id),
    category_path      varchar(500),
    name               varchar(200) not null,
    price              bigint       not null,
    currency           varchar(3)   not null default 'KRW',
    main_image_url     varchar(500),
    short_description  varchar(500),
    status             varchar(32)  not null,
    created_at         timestamp    not null,
    updated_at         timestamp    not null
);

create index idx_catalog_products_store on catalog_products(store_id);
create index idx_catalog_products_category
    on catalog_products(category_id, status, created_at desc);
create index idx_catalog_products_seller on catalog_products(seller_id);

-- ============================================================
-- product_stocks (재고, 낙관적 락으로 동시성 차단)
-- ============================================================
create table product_stocks (
    product_id          bigint primary key references catalog_products(id),
    quantity            int    not null default 0,
    reserved_quantity   int    not null default 0,
    safety_stock        int    not null default 0,
    version             bigint not null default 0,
    updated_at          timestamp not null
);

-- ============================================================
-- processed_events (컨슈머 멱등 테이블)
--   (event_id, event_type) 복합 PK가 멱등을 보장
-- ============================================================
create table processed_events (
    event_id      bigint       not null,
    event_type    varchar(64)  not null,
    processed_at  timestamp    not null default now(),
    primary key (event_id, event_type)
);

-- ============================================================
-- seed: 3-level category tree
-- ============================================================
insert into product_categories
    (id, parent_id, name, slug, depth, path, display_order, status, created_at, updated_at)
values
    (1, null, '패션',        'fashion',          0, '/1/',      1, 'ACTIVE', now(), now()),
    (2, null, '전자제품',    'electronics',      0, '/2/',      2, 'ACTIVE', now(), now()),
    (3, null, '식품',        'food',             0, '/3/',      3, 'ACTIVE', now(), now()),
    (4, 1,    '여성의류',    'womens-clothing',  1, '/1/4/',    1, 'ACTIVE', now(), now()),
    (5, 1,    '남성의류',    'mens-clothing',    1, '/1/5/',    2, 'ACTIVE', now(), now()),
    (6, 4,    '원피스',      'dresses',          2, '/1/4/6/',  1, 'ACTIVE', now(), now()),
    (7, 4,    '여성 티셔츠', 'womens-t-shirts',  2, '/1/4/7/',  2, 'ACTIVE', now(), now()),
    (8, 2,    '노트북',      'laptops',          1, '/2/8/',    1, 'ACTIVE', now(), now()),
    (9, 2,    '스마트폰',    'smartphones',      1, '/2/9/',    2, 'ACTIVE', now(), now());

select setval('product_categories_id_seq', 9, true);
