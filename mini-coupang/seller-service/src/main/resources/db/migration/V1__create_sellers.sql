create table sellers (
    id                         bigserial primary key,
    email                      varchar(255) not null unique,
    password_hash              varchar(255) not null,
    business_name              varchar(100) not null,
    business_registration_no   varchar(32)  not null unique,
    representative_name        varchar(100) not null,
    contact_phone              varchar(20)  not null,
    settlement_account         varchar(64),
    status                     varchar(32)  not null,
    created_at                 timestamp    not null default now(),
    approved_at                timestamp,
    updated_at                 timestamp    not null default now()
);
