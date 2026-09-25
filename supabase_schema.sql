-- ====================================================================
-- SUPABASE SCHEMA UPDATE SCRIPT (NON-DESTRUCTIVE)
-- Preserves your existing 372 students and sets up task submission
-- Run this in your Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. Ensure students table has index
CREATE INDEX IF NOT EXISTS idx_students_reg_no ON public.students(reg_no);

-- 2. Add screenshot proof columns to existing submissions table (safe ALTER)
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS task_id TEXT DEFAULT 'task-live-01';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Create Tasks table if you wish to assign multiple tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & public policies for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Tasks" ON public.tasks;
CREATE POLICY "Public Read Tasks" ON public.tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Manage Tasks" ON public.tasks;
CREATE POLICY "Public Manage Tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- Insert initial active task
INSERT INTO public.tasks (id, title, description, deadline, is_active)
VALUES (
    'task-live-01',
    'NPTEL Course Registration & Payment Screenshot Proof',
    'Please upload your course registration / examination payment proof clearly showing your Name and Register Number.',
    NOW() + INTERVAL '7 days',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Public Storage Bucket for Screenshot Uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-screenshots', 'proof-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public Read Proof Screenshots" ON storage.objects;
CREATE POLICY "Public Read Proof Screenshots" ON storage.objects
FOR SELECT USING (bucket_id = 'proof-screenshots');

DROP POLICY IF EXISTS "Public Upload Proof Screenshots" ON storage.objects;
CREATE POLICY "Public Upload Proof Screenshots" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'proof-screenshots');

-- RLS policies for submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Submissions" ON public.submissions;
CREATE POLICY "Public Read Submissions" ON public.submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Insert Submissions" ON public.submissions;
CREATE POLICY "Public Insert Submissions" ON public.submissions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public Update Submissions" ON public.submissions;
CREATE POLICY "Public Update Submissions" ON public.submissions FOR UPDATE USING (true);
