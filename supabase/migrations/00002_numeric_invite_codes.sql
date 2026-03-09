-- Update invite codes to be 7-digit numeric codes like OTP
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..7 LOOP
    result := result || floor(random() * 10)::text;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
