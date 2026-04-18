-- ==============================================================================
-- ResumeAI Supabase Database Schema
-- Run this entire script in your Supabase SQL Editor to initialize the database
-- ==============================================================================

-- 1. Create the 'resumes' table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT,
    resume_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Turn on Row Level Security (RLS) to ensure users can only see their own resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can CREATE (insert) their own resumes
CREATE POLICY "Users can insert their own resumes" 
ON public.resumes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Policy: Users can READ (select) their own resumes
CREATE POLICY "Users can view their own resumes" 
ON public.resumes 
FOR SELECT 
USING (auth.uid() = user_id);

-- 5. Policy: Users can UPDATE their own resumes
CREATE POLICY "Users can update their own resumes" 
ON public.resumes 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 6. Policy: Users can DELETE their own resumes
CREATE POLICY "Users can delete their own resumes" 
ON public.resumes 
FOR DELETE 
USING (auth.uid() = user_id);

-- (Optional) Create an index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS resumes_user_id_idx ON public.resumes(user_id);

-- DONE! Your database is fully secured and ready for the app.
