CREATE OR REPLACE FUNCTION get_all_madrassahs()
RETURNS TABLE (
  id uuid,
  name text,
  location text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.name,
    m.location
  FROM
    public.madrassahs AS m;
END;
$$; 