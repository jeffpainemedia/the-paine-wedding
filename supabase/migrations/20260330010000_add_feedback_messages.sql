create table if not exists public.feedback_messages (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    reporter_name text,
    reporter_email text,
    category text not null default 'bug' check (category in ('bug', 'content', 'suggestion', 'other')),
    source_page text,
    message text not null,
    status text not null default 'new' check (status in ('new', 'seen', 'closed')),
    admin_notes text,
    metadata jsonb not null default '{}'::jsonb
);

create index if not exists feedback_messages_created_at_idx on public.feedback_messages (created_at desc);
create index if not exists feedback_messages_status_idx on public.feedback_messages (status);

drop trigger if exists set_feedback_messages_updated_at on public.feedback_messages;
create trigger set_feedback_messages_updated_at
before update on public.feedback_messages
for each row
execute function public.update_updated_at_column();

alter table public.feedback_messages enable row level security;

drop policy if exists "feedback_messages_service_role" on public.feedback_messages;
create policy "feedback_messages_service_role"
on public.feedback_messages
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
