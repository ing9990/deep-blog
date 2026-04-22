alter table members
    add column updated_at timestamp not null default now();
