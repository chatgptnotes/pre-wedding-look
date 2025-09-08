-- Blind Date Style-Off Mini Game Database Schema
-- This creates all the tables needed for the fun styling game

-- Main game sessions table
create table blinddate_sessions (
  id uuid primary key default gen_random_uuid(),
  status text check (status in ('waiting','active','reveal','finished')) default 'waiting',
  is_private boolean default false,
  invite_code text unique,
  created_at timestamptz default now(),
  ended_at timestamptz
);

-- Players in each game session
create table blinddate_participants (
  session_id uuid references blinddate_sessions on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text check (role in ('A','B')),
  joined_at timestamptz default now(),
  is_revealed boolean default false,
  avatar_name text default 'Mystery Person', -- Fun names like "Purple Butterfly", "Golden Star"
  primary key (session_id, user_id)
);

-- Game rounds (Attire, Hair & Accessories, Location & Vibe)
create table blinddate_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references blinddate_sessions on delete cascade,
  round_no int check (round_no between 1 and 3),
  topic text check (topic in ('attire', 'hair', 'location')),
  started_at timestamptz default now(),
  ended_at timestamptz,
  time_limit_seconds int default 180 -- 3 minutes for attire/hair, 2 min for location
);

-- The styling designs created by each player
create table blinddate_designs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references blinddate_sessions on delete cascade,
  round_id uuid references blinddate_rounds on delete cascade,
  designer_user_id uuid references profiles(id) on delete cascade,
  target_role text check (target_role in ('A','B')), -- Who they're styling
  prompt jsonb, -- All the styling choices (outfit, colors, etc.)
  image_url text,
  created_at timestamptz default now()
);

-- Reactions and votes after the big reveal
create table blinddate_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references blinddate_sessions on delete cascade,
  voter_user_id uuid references profiles(id),
  vote text check (vote in ('A', 'B', 'tie')), -- Whose version was better
  reaction text check (reaction in ('heart','fire','laugh','surprise')), -- Emoji reactions
  created_at timestamptz default now()
);

-- Auto-generated share content (for social media)
create table blinddate_shares (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references blinddate_sessions on delete cascade,
  video_url text, -- The auto-generated reel
  caption text, -- Fun caption for sharing
  watermark_position jsonb, -- Where to place PrewedAI logo
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '24 hours') -- Auto-delete in 24h
);

-- Add indexes for better performance
create index idx_blinddate_sessions_status on blinddate_sessions(status);
create index idx_blinddate_sessions_invite_code on blinddate_sessions(invite_code);
create index idx_blinddate_participants_session on blinddate_participants(session_id);
create index idx_blinddate_rounds_session on blinddate_rounds(session_id);
create index idx_blinddate_designs_session on blinddate_designs(session_id);
create index idx_blinddate_designs_round on blinddate_designs(round_id);
create index idx_blinddate_shares_expires on blinddate_shares(expires_at);

-- Security policies (RLS)
alter table blinddate_sessions enable row level security;
alter table blinddate_participants enable row level security;
alter table blinddate_rounds enable row level security;
alter table blinddate_designs enable row level security;
alter table blinddate_feedback enable row level security;
alter table blinddate_shares enable row level security;

-- Players can see sessions they're part of
create policy "Players can view their sessions" on blinddate_sessions
  for select using (
    id in (
      select session_id from blinddate_participants 
      where user_id = auth.uid()
    )
  );

-- Players can join sessions
create policy "Players can join sessions" on blinddate_participants
  for insert with check (user_id = auth.uid());

-- Players can view other participants in their sessions
create policy "Players can view session participants" on blinddate_participants
  for select using (
    session_id in (
      select session_id from blinddate_participants 
      where user_id = auth.uid()
    )
  );

-- Players can view rounds in their sessions
create policy "Players can view session rounds" on blinddate_rounds
  for select using (
    session_id in (
      select session_id from blinddate_participants 
      where user_id = auth.uid()
    )
  );

-- Players can create designs in their sessions
create policy "Players can create designs" on blinddate_designs
  for insert with check (
    designer_user_id = auth.uid() and
    session_id in (
      select session_id from blinddate_participants 
      where user_id = auth.uid()
    )
  );

-- Players can view designs in their sessions (after reveal)
create policy "Players can view revealed designs" on blinddate_designs
  for select using (
    session_id in (
      select bp.session_id from blinddate_participants bp
      join blinddate_sessions bs on bp.session_id = bs.id
      where bp.user_id = auth.uid() and bs.status in ('reveal', 'finished')
    )
  );

-- Players can give feedback
create policy "Players can give feedback" on blinddate_feedback
  for insert with check (
    voter_user_id = auth.uid() and
    session_id in (
      select session_id from blinddate_participants 
      where user_id = auth.uid()
    )
  );

-- Players can view share content for their sessions
create policy "Players can view share content" on blinddate_shares
  for select using (
    session_id in (
      select session_id from blinddate_participants 
      where user_id = auth.uid()
    )
  );

-- Function to generate unique invite codes
create or replace function generate_invite_code() returns text as $$
begin
  return upper(substring(md5(random()::text) from 1 for 6));
end;
$$ language plpgsql;

-- Function to automatically create rounds when session starts
create or replace function create_session_rounds(session_id uuid) returns void as $$
begin
  -- Round 1: Attire (3 minutes)
  insert into blinddate_rounds (session_id, round_no, topic, time_limit_seconds)
  values (session_id, 1, 'attire', 180);
  
  -- Round 2: Hair & Accessories (3 minutes)
  insert into blinddate_rounds (session_id, round_no, topic, time_limit_seconds)
  values (session_id, 2, 'hair', 180);
  
  -- Round 3: Location & Vibe (2 minutes)
  insert into blinddate_rounds (session_id, round_no, topic, time_limit_seconds)
  values (session_id, 3, 'location', 120);
end;
$$ language plpgsql;

-- Function to clean up expired shares (run this with a cron job)
create or replace function cleanup_expired_shares() returns void as $$
begin
  delete from blinddate_shares where expires_at < now();
end;
$$ language plpgsql;
