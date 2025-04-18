-- Simplify handle_new_user trigger to ONLY populate User_Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert into User_Profiles, including email. All other logic removed.
  BEGIN
      INSERT INTO public."User_Profiles" (id, email)
      VALUES (NEW.id, NEW.email);
      RAISE NOTICE 'Simple Trigger: Inserted new user profile for % with email %', NEW.id, NEW.email;
  EXCEPTION 
      WHEN unique_violation THEN
          RAISE NOTICE 'Simple Trigger: User profile for % already exists.', NEW.id;
      WHEN OTHERS THEN
          -- Log error but do not re-raise to ensure user creation is not blocked by profile insert issue
          RAISE WARNING 'Simple Trigger: Error inserting into User_Profiles for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 