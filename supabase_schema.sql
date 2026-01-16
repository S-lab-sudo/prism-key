-- Create the vault_items table
create table vault_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  label text not null,
  username text,
  value text not null,
  strength text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table vault_items enable row level security;

-- Create Policy: Users can only see their own items
create policy "Users can view own items"
  on vault_items for select
  using (auth.uid() = user_id);

-- Create Policy: Users can insert their own items
create policy "Users can insert own items"
  on vault_items for insert
  with check (auth.uid() = user_id);

-- Create Policy: Users can update their own items
create policy "Users can update own items"
  on vault_items for update
  using (auth.uid() = user_id);

-- Create Policy: Users can delete their own items
create policy "Users can delete own items"
  on vault_items for delete
  using (auth.uid() = user_id);

-- Function to handle user creation (Optional Profile Table Trigger)
-- For this simple app, we might not need a public profiles table yet, 
-- but it's good practice if you want to store extra user metadata later.
