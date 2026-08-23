import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,   // or true if you have proper certs
    },
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
      password_hash text,
      email_verified_at timestamptz,
      auth_provider text not null default 'fleetos',
      external_auth_provider text,
      external_auth_id text,
      role text not null default 'owner',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table fleetos_users add column if not exists password_hash text;
    alter table fleetos_users add column if not exists email_verified_at timestamptz;
    alter table fleetos_users add column if not exists auth_provider text not null default 'fleetos';
    alter table fleetos_users add column if not exists external_auth_provider text;
    alter table fleetos_users add column if not exists external_auth_id text;

    create table if not exists fleetos_sessions (
      id text primary key,
      user_id text not null references fleetos_users(id) on delete cascade,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null,
      last_seen_at timestamptz not null default now()
    );

    create table if not exists fleetos_magic_links (
      token_hash text primary key,
      email text not null,
      user_id text references fleetos_users(id) on delete cascade,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null,
      consumed_at timestamptz
    );

    create table if not exists fleetos_billing_entitlements (
      user_id text primary key references fleetos_users(id) on delete cascade,
      plan text not null default 'first_tesla_free',
      status text not null default 'free',
      included_vehicles integer not null default 1,
      paid_vehicle_limit integer not null default 0,
      billing_email text,
      updated_at timestamptz not null default now()
    );

    create table if not exists fleetos_audit_events (
      id bigserial primary key,
      user_id text references fleetos_users(id) on delete set null,
      action text not null,
      resource text,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists fleetos_rate_limit_events (
      id bigserial primary key,
      user_id text references fleetos_users(id) on delete set null,
      vin text not null,
      action text not null,
      status text not null default 'recorded',
      limit_count integer,
      window_seconds integer,
      retry_after_seconds integer,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists fleetos_oauth_states (
      state text primary key,
      session_id text not null references fleetos_sessions(id) on delete cascade,
      redirect_uri text not null,
      return_to text,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null
    );

    create table if not exists fleetos_tesla_connections (
      id text primary key,
      user_id text not null references fleetos_users(id) on delete cascade,
      provider text not null default 'tesla',
      tesla_subject text,
      access_token_enc text,
      refresh_token_enc text not null,
      token_type text,
      scope text,
      expires_at timestamptz,
      connected_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      revoked_at timestamptz,
      unique (user_id, provider)
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
      source text not null default 'ROBOAGENT AI',
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
      source text not null default 'fleetos',
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

    create table if not exists fleetos_owner_alert_prefs (
      user_id text primary key references fleetos_users(id) on delete cascade,
      enabled boolean not null default true,
      updated_at timestamptz not null default now()
    );

    create table if not exists fleetos_push_subscriptions (
      endpoint text primary key,
      user_id text not null references fleetos_users(id) on delete cascade,
      p256dh text not null,
      auth text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists fleetos_owner_alert_sends (
      user_id text not null references fleetos_users(id) on delete cascade,
      vin text not null,
      trigger text not null,
      last_sent_at timestamptz not null default now(),
      last_payload jsonb not null default '{}'::jsonb,
      primary key (user_id, vin, trigger)
    );

    create index if not exists idx_fleetos_push_subscriptions_user on fleetos_push_subscriptions(user_id);
    create index if not exists idx_fleetos_owner_alert_sends_user on fleetos_owner_alert_sends(user_id, last_sent_at desc);

    create index if not exists idx_fleetos_vehicles_fleet on fleetos_vehicles(fleet_id);
    create index if not exists idx_fleetos_vehicles_vin on fleetos_vehicles(vin);
    create index if not exists idx_fleetos_sessions_user on fleetos_sessions(user_id);
    create unique index if not exists idx_fleetos_users_external_auth on fleetos_users(external_auth_provider, external_auth_id) where external_auth_id is not null;
    create index if not exists idx_fleetos_audit_events_user_time on fleetos_audit_events(user_id, created_at desc);
    create index if not exists idx_fleetos_rate_limit_user_vin_action_time on fleetos_rate_limit_events(user_id, vin, action, created_at desc);
    create index if not exists idx_fleetos_magic_links_email on fleetos_magic_links(email);
    create index if not exists idx_fleetos_tesla_connections_user on fleetos_tesla_connections(user_id);
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
