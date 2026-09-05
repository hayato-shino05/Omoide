begin;

alter table public.bulletin_posts
  add column if not exists likes integer not null default 0
  constraint bulletin_posts_likes_nonnegative check (likes >= 0);

create or replace function public.increment_bulletin_post_likes(p_post_id bigint)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_likes integer;
begin
  update public.bulletin_posts
  set likes = public.bulletin_posts.likes + 1
  where public.bulletin_posts.id = p_post_id
  returning public.bulletin_posts.likes into new_likes;

  if not found then
    raise exception 'bulletin post not found';
  end if;

  return new_likes;
end;
$$;

revoke execute on function public.increment_bulletin_post_likes(bigint) from public, anon, authenticated, service_role;
grant execute on function public.increment_bulletin_post_likes(bigint) to anon;

commit;
