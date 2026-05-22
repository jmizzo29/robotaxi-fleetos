create table if not exists beta_feedback (
  id text primary key,
  type text not null default 'feedback',
  rating integer,
  title text not null,
  detail text not null,
  route text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists beta_leads (
  id text primary key,
  name text,
  email text not null,
  tesla_count text,
  use_case text,
  plan text,
  created_at timestamptz not null default now()
);

create table if not exists beta_revenue_records (
  id text primary key,
  vehicle_key text,
  vehicle_label text,
  record_date date,
  source text,
  amount numeric,
  notes text,
  created_at timestamptz not null default now()
);
