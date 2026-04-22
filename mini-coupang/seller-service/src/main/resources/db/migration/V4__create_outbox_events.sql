create table outbox_events (
    id              bigserial    primary key,
    aggregate_type  varchar(64)  not null,
    aggregate_id    varchar(64)  not null,
    event_type      varchar(64)  not null,
    payload         text         not null,
    created_at      timestamp    not null default now(),
    published_at    timestamp
);

create index idx_outbox_unpublished
    on outbox_events (id)
    where published_at is null;
