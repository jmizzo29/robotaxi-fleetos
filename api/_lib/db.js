import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
  })
  : null;

export function hasPostgres() {
  return Boolean(pool);
}

let schemaReady;

export async function ensureFleetSchema() {
  if (!pool) return false;
  if (schemaReady) return schemaReady;

  schemaReady = pool.query(`
    create table if not exists fleetos_users (
      id text primary key,
      email text unique,
      name text,
      role text not null default 'owner',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists fleetos_fleets (
      id text primary key,
      owner_user_id text references fleetos_users(id) on delete set null,
      name text not null,
      market text,
      timezone text,
      plan text not null default 'first_tesla_free',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists fleetos_fleet_members (
      fleet_id text not null references fleetos_fleets(id) on delete cascade,
      user_id text not null references fleetos_users(id) on delete cascade,
      role text not null default 'operator',
      created_at timestamptz not null default now(),
      primary key (fleet_id, user_id)
    );

    create table if not exists fleetos_vehicles (
      id text primary key,
      fleet_id text references fleetos_fleets(id) on delete set null,
      vin text unique,
      tesla_vehicle_id text,
      display_name text,
      model text,
      model_year integer,
      trim text,
      color text,
      tag text,
      state text,
      status text,
      battery_level integer,
      latitude double precision,
      longitude double precision,
      heading double precision,
      speed double precision,
      odometer double precision,
      charging_state text,
      software_version text,
      locked boolean,
      service_mode boolean,
      raw jsonb not null default '{}'::jsonb,
      first_seen_at timestamptz not null default now(),
      last_synced_at timestamptz,
      updated_at timestamptz not null default now()
    );

    create table if not exists fleetos_vehicle_assets (
      vehicle_key text primary key,
      vin text,
      fleet_id text references fleetos_fleets(id) on delete set null,
      model text,
      model_year integer,
      trim text,
      color text,
      tag text,
      purchase_date date,
      purchase_year integer,
      price_paid numeric,
      current_balance numeric,
      lender text,
      monthly_payment numeric,
      insurance_renewal date,
      registration_state text,
      record jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists fleetos_telemetry_snapshots (
      id bigserial primary key,
      vehicle_id text references fleetos_vehicles(id) on delete cascade,
      vin text,
      captured_at timestamptz not null default now(),
      state text,
      status text,
      battery_level integer,
      latitude double precision,
      longitude double precision,
      heading double precision,
      speed double precision,
      odometer double precision,
      charging_state text,
      software_version text,
      locked boolean,
      service_mode boolean,
      raw jsonb not null default '{}'::jsonb
    );

    create table if not exists fleetos_maintenance_logs (
      id text primary key,
      vehicle_id text references fleetos_vehicles(id) on delete cascade,
      vin text,
      type text not null default 'inspection',
      title text not null,
      detail text,
      status text not null default 'open',
      priority text not null default 'normal',
      due_at timestamptz,
      completed_at timestamptz,
      cost numeric,
      vendor text,
      odometer double precision,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists fleetos_revenue_records (
      id text primary key,
      fleet_id text references fleetos_fleets(id) on delete set null,
      vehicle_id text references fleetos_vehicles(id) on delete set null,
      vehicle_key text,
      vehicle_label text,
      record_date date,
      source text,
      amount numeric,
      notes text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists fleetos_earnings_estimates (
      id text primary key,
      vehicle_id text references fleetos_vehicles(id) on delete cascade,
      fleet_id text references fleetos_fleets(id) on delete set null,
      estimate_date date not null,
      source text not null default 'FleetOS AI',
      expected_revenue numeric,
      expected_cost numeric,
      confidence numeric,
      assumptions jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists fleetos_memory_events (
      id text primary key,
      fleet_id text references fleetos_fleets(id) on delete set null,
      vehicle_id text references fleetos_vehicles(id) on delete set null,
      type text not null default 'Event',
      title text not null,
      detail text,
      event_timestamp timestamptz not null default now(),
      source text not null default 'FleetOS',
      status text not null default 'recorded',
      rag_ready boolean not null default false,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

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

    create index if not exists idx_fleetos_vehicles_fleet on fleetos_vehicles(fleet_id);
    create index if not exists idx_fleetos_vehicles_vin on fleetos_vehicles(vin);
    create index if not exists idx_fleetos_telemetry_vehicle_time on fleetos_telemetry_snapshots(vehicle_id, captured_at desc);
    create index if not exists idx_fleetos_memory_time on fleetos_memory_events(event_timestamp desc);
    create index if not exists idx_fleetos_revenue_vehicle_date on fleetos_revenue_records(vehicle_key, record_date desc);

    do $$
    begin
      if to_regclass('public.beta_revenue_records') is not null then
        insert into fleetos_revenue_records (id, vehicle_key, vehicle_label, record_date, source, amount, notes, created_at)
        select id, vehicle_key, vehicle_label, record_date, source, amount, notes, created_at
        from beta_revenue_records
        on conflict (id) do nothing;
      end if;
    end $$;
  `).then(() => true);

  return schemaReady;
}

export async function query(sql, params = []) {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured.');
  }
  await ensureFleetSchema();
  return pool.query(sql, params);
}
