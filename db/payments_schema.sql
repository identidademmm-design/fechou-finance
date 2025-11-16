-- ENUM de status
do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('created','processing','authorized','paid','failed','canceled');
  end if;
end$$;

create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  provider text not null,
  provider_payment_id text,
  amount_cents integer not null,
  currency text not null default 'BRL',
  status payment_status not null default 'created',
  raw jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_payments_updated') then
    create trigger trg_payments_updated
    before update on payments
    for each row execute procedure set_updated_at();
  end if;
end$$;

create table if not exists payment_transaction_links (
  payment_id uuid references payments(id) on delete cascade,
  transaction_id uuid references transactions(id) on delete cascade,
  primary key (payment_id, transaction_id)
);
