create or replace function get_parent_emails_for_student(student_id_in uuid)
returns table (email text) as $$
begin
  return query
  select
    prof.email
  from
    public.parents as p
  join
    public.profiles as prof on p.id = prof.id
  where
    p.student_ids @> array[student_id_in]
    and prof.role = 'parent';
end;
$$ language plpgsql;
