-- Fix RLS policies for blind date game to allow session creation

-- Allow authenticated users to create sessions
create policy "Authenticated users can create sessions" on blinddate_sessions
  for insert with check (auth.uid() is not null);

-- Allow authenticated users to update their own sessions (for status changes)
create policy "Players can update their sessions" on blinddate_sessions
  for update using (
    id in (
      select session_id from blinddate_participants 
      where user_id = auth.uid()
    )
  );

-- Allow authenticated users to create rounds in their sessions
create policy "Players can create rounds" on blinddate_rounds
  for insert with check (
    session_id in (
      select session_id from blinddate_participants 
      where user_id = auth.uid()
    )
  );

-- Allow players to update rounds in their sessions
create policy "Players can update rounds" on blinddate_rounds
  for update using (
    session_id in (
      select session_id from blinddate_participants 
      where user_id = auth.uid()
    )
  );

-- Allow players to update their participant records
create policy "Players can update their participation" on blinddate_participants
  for update using (user_id = auth.uid());

-- Allow players to view and update designs they created
create policy "Players can update their designs" on blinddate_designs
  for update using (designer_user_id = auth.uid());

-- Allow players to view designs in their sessions during active rounds
create policy "Players can view active designs" on blinddate_designs
  for select using (
    session_id in (
      select bp.session_id from blinddate_participants bp
      join blinddate_sessions bs on bp.session_id = bs.id
      where bp.user_id = auth.uid() and bs.status in ('active', 'reveal', 'finished')
    )
  );

-- Grant service role full access (for edge functions)
grant all on blinddate_sessions to service_role;
grant all on blinddate_participants to service_role;
grant all on blinddate_rounds to service_role;
grant all on blinddate_designs to service_role;
grant all on blinddate_feedback to service_role;
grant all on blinddate_shares to service_role;