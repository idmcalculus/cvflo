-- CVFlo Database Schema for Supabase
-- Run this SQL in your Supabase SQL editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cv_data table for storing user CV information
CREATE TABLE IF NOT EXISTS public.cv_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cv_content JSONB NOT NULL,
  template_name TEXT DEFAULT 'classic-0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one CV per user (can be modified for multiple CVs later)
  UNIQUE(user_id)
);

-- Create pdf_generations table for analytics and rate limiting
CREATE TABLE IF NOT EXISTS public.pdf_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for cv_data
CREATE POLICY "Users can view own CV data" ON public.cv_data 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CV data" ON public.cv_data 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CV data" ON public.cv_data 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own CV data" ON public.cv_data 
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for pdf_generations (users can view own generations)
CREATE POLICY "Users can view own PDF generations" ON public.pdf_generations 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PDF generations" ON public.pdf_generations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_cv_data_user_id ON public.cv_data(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_generations_user_id ON public.pdf_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_generations_created_at ON public.pdf_generations(created_at);

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_cv_data_updated_at
  BEFORE UPDATE ON public.cv_data
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create a function to clean up old PDF generation records (for cleanup jobs)
CREATE OR REPLACE FUNCTION public.cleanup_old_pdf_generations(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.pdf_generations 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.cv_data TO authenticated;
GRANT ALL ON public.pdf_generations TO authenticated;

-- Insert some initial data or configurations if needed
-- (This section can be customized based on requirements)

-- Example: Create a function to get user stats (optional)
CREATE OR REPLACE FUNCTION public.get_user_stats(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Only allow users to see their own stats
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT json_build_object(
    'pdf_generations_today', (
      SELECT COUNT(*) FROM public.pdf_generations 
      WHERE user_id = target_user_id 
      AND created_at >= CURRENT_DATE
    ),
    'pdf_generations_this_month', (
      SELECT COUNT(*) FROM public.pdf_generations 
      WHERE user_id = target_user_id 
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    'cv_data_exists', (
      SELECT EXISTS(
        SELECT 1 FROM public.cv_data 
        WHERE user_id = target_user_id
      )
    ),
    'account_created', (
      SELECT created_at FROM public.user_profiles 
      WHERE id = target_user_id
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE public.user_profiles IS 'Extended user profile information';
COMMENT ON TABLE public.cv_data IS 'User CV data storage with versioning support';
COMMENT ON TABLE public.pdf_generations IS 'Analytics and rate limiting for PDF generations';
COMMENT ON FUNCTION public.cleanup_old_pdf_generations IS 'Cleanup function for old PDF generation records';
COMMENT ON FUNCTION public.get_user_stats IS 'Get user statistics (PDF generations, account info, etc.)';

-- Create function to delete user account and all associated data
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS JSON AS $$
DECLARE
  current_user_id UUID;
  deleted_cv_count INTEGER;
  deleted_pdf_count INTEGER;
  deleted_profile_count INTEGER;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Delete user's CV data
  DELETE FROM public.cv_data WHERE user_id = current_user_id;
  GET DIAGNOSTICS deleted_cv_count = ROW_COUNT;

  -- Delete user's PDF generation records
  DELETE FROM public.pdf_generations WHERE user_id = current_user_id;
  GET DIAGNOSTICS deleted_pdf_count = ROW_COUNT;

  -- Delete user's profile data
  DELETE FROM public.user_profiles WHERE id = current_user_id;
  GET DIAGNOSTICS deleted_profile_count = ROW_COUNT;

  -- Delete the actual user from auth.users table
  -- This will also cascade to any other related auth tables
  DELETE FROM auth.users WHERE id = current_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Account deleted successfully',
    'deleted_records', json_build_object(
      'cv_data', deleted_cv_count,
      'pdf_generations', deleted_pdf_count,
      'user_profiles', deleted_profile_count,
      'auth_user', true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.delete_user_account IS 'Permanently delete user account and all associated data including auth record';

-- Note: Remember to set up your Supabase project with:
-- 1. Email/Password authentication enabled
-- 2. Optionally: Social authentication (Google, GitHub, etc.)
-- 3. Configure email templates and SMTP settings
-- 4. Set up proper CORS origins for your domain