create table members (
    id              bigserial primary key,
    email           varchar(255) not null unique,
    password_hash   varchar(255) not null,
    name            varchar(100) not null,
    phone           varchar(20),
    status          varchar(32)  not null,
    created_at      timestamp    not null default now(),
    last_login_at   timestamp
);
