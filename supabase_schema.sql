-- ====================================================================
-- SUPABASE TASK SUBMISSION SETUP SCRIPT
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Create the Task Submissions Table (stores screenshot proof details)
CREATE TABLE IF NOT EXISTS public.task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reg_no VARCHAR(50) NOT NULL REFERENCES public.students(reg_no) ON DELETE CASCADE,
    student_name VARCHAR(150),
    department VARCHAR(50),
    section VARCHAR(10),
    screenshot_url TEXT NOT NULL,
    notes TEXT,
    task_id TEXT DEFAULT 'task-live-01',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_task_student_sub UNIQUE(task_id, reg_no)
);

-- 2. Indexes for high performance lookups
CREATE INDEX IF NOT EXISTS idx_task_sub_reg_no ON public.task_submissions(reg_no);
CREATE INDEX IF NOT EXISTS idx_task_sub_task_id ON public.task_submissions(task_id);

-- 3. Row Level Security Policies (Allow Student Submission & Admin Reading)
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Public Read Task Submissions" ON public.task_submissions;
CREATE POLICY "Allow Public Read Task Submissions" 
ON public.task_submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Public Insert Task Submissions" ON public.task_submissions;
CREATE POLICY "Allow Public Insert Task Submissions" 
ON public.task_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Public Update Task Submissions" ON public.task_submissions;
CREATE POLICY "Allow Public Update Task Submissions" 
ON public.task_submissions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow Public Delete Task Submissions" ON public.task_submissions;
CREATE POLICY "Allow Public Delete Task Submissions" 
ON public.task_submissions FOR DELETE USING (true);

-- 4. Create the Storage Bucket for uploaded Screenshot Proof Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-screenshots', 'proof-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage Bucket Policies (Allows students to upload screenshots)
DROP POLICY IF EXISTS "Allow Public View Proof Screenshots" ON storage.objects;
CREATE POLICY "Allow Public View Proof Screenshots" 
ON storage.objects FOR SELECT USING (bucket_id = 'proof-screenshots');

DROP POLICY IF EXISTS "Allow Public Upload Proof Screenshots" ON storage.objects;
CREATE POLICY "Allow Public Upload Proof Screenshots" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'proof-screenshots');

DROP POLICY IF EXISTS "Allow Public Delete Proof Screenshots" ON storage.objects;
CREATE POLICY "Allow Public Delete Proof Screenshots" 
ON storage.objects FOR DELETE USING (bucket_id = 'proof-screenshots');
