-- ====================================================================
-- COLLEGE TASK SUBMISSION DASHBOARD - SUPABASE DATABASE SCHEMA
-- ====================================================================
-- Run this entire script in your Supabase Project:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE STUDENTS TABLE (Master Roster)
CREATE TABLE IF NOT EXISTS public.students (
    reg_no VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    department VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    email VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE TASKS TABLE (Assigned Submissions)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE SUBMISSIONS TABLE (Recorded Proofs)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    reg_no VARCHAR(50) NOT NULL REFERENCES public.students(reg_no) ON DELETE CASCADE,
    screenshot_url TEXT NOT NULL,
    notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_task_student UNIQUE(task_id, reg_no)
);

-- 5. INDEXES FOR LIGHTNING FAST LOOKUPS
CREATE INDEX IF NOT EXISTS idx_students_reg_no ON public.students(reg_no);
CREATE INDEX IF NOT EXISTS idx_students_dept_sec ON public.students(department, section);
CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON public.submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_reg_no ON public.submissions(reg_no);

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES (Allow public read/write via Anon Key for easy college portal usage)
DROP POLICY IF EXISTS "Public Read Students" ON public.students;
CREATE POLICY "Public Read Students" ON public.students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert/Update Students" ON public.students;
CREATE POLICY "Public Insert/Update Students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Tasks" ON public.tasks;
CREATE POLICY "Public Read Tasks" ON public.tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Manage Tasks" ON public.tasks;
CREATE POLICY "Public Manage Tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Submissions" ON public.submissions;
CREATE POLICY "Public Read Submissions" ON public.submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Submissions" ON public.submissions;
CREATE POLICY "Public Insert Submissions" ON public.submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Submissions" ON public.submissions;
CREATE POLICY "Public Update Submissions" ON public.submissions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Submissions" ON public.submissions;
CREATE POLICY "Public Delete Submissions" ON public.submissions FOR DELETE USING (true);

-- 8. STORAGE BUCKET CONFIGURATION FOR PROOF SCREENSHOTS
-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-screenshots', 'proof-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the bucket
DROP POLICY IF EXISTS "Public Access Proof Screenshots" ON storage.objects;
CREATE POLICY "Public Access Proof Screenshots" ON storage.objects
FOR SELECT USING (bucket_id = 'proof-screenshots');

DROP POLICY IF EXISTS "Public Upload Proof Screenshots" ON storage.objects;
CREATE POLICY "Public Upload Proof Screenshots" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'proof-screenshots');

DROP POLICY IF EXISTS "Public Delete Proof Screenshots" ON storage.objects;
CREATE POLICY "Public Delete Proof Screenshots" ON storage.objects
FOR DELETE USING (bucket_id = 'proof-screenshots');

-- ====================================================================
-- SAMPLE STARTER DATA (For instant testing)
-- ====================================================================

-- Insert Sample Active Task
INSERT INTO public.tasks (id, title, description, deadline, is_active)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'NPTEL Course Registration & Payment Screenshot Proof',
    'Please register for your allocated NPTEL Swayam course (July-Dec session). Upload the final registered profile/payment receipt screenshot clearly showing your Roll Number and Course Name.',
    NOW() + INTERVAL '5 days',
    true
)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Students Roster (CSE-A, CSE-B, IT-A)
INSERT INTO public.students (reg_no, name, department, section, email)
VALUES
    ('717822P101', 'Aarav Sharma', 'CSE', 'A', 'aarav.sharma@college.edu'),
    ('717822P102', 'Abhinav Patel', 'CSE', 'A', 'abhinav.patel@college.edu'),
    ('717822P103', 'Aditi Rao', 'CSE', 'A', 'aditi.rao@college.edu'),
    ('717822P104', 'Ananya Deshmukh', 'CSE', 'A', 'ananya.d@college.edu'),
    ('717822P105', 'Bhavya Nair', 'CSE', 'A', 'bhavya.nair@college.edu'),
    ('717822P106', 'Chetan Verma', 'CSE', 'A', 'chetan.v@college.edu'),
    ('717822P107', 'Deepika Sundaram', 'CSE', 'A', 'deepika.s@college.edu'),
    ('717822P108', 'Dinesh Kumar', 'CSE', 'A', 'dinesh.k@college.edu'),
    ('717822P109', 'Divya Krishnan', 'CSE', 'A', 'divya.k@college.edu'),
    ('717822P110', 'Gautam Menon', 'CSE', 'A', 'gautam.m@college.edu'),

    ('717822P201', 'Harish Raghavan', 'CSE', 'B', 'harish.r@college.edu'),
    ('717822P202', 'Ishaan Malhotra', 'CSE', 'B', 'ishaan.m@college.edu'),
    ('717822P203', 'Janani Venkatesh', 'CSE', 'B', 'janani.v@college.edu'),
    ('717822P204', 'Karthik Raja', 'CSE', 'B', 'karthik.r@college.edu'),
    ('717822P205', 'Kavya Murugan', 'CSE', 'B', 'kavya.m@college.edu'),
    ('717822P206', 'Manoj Kumar', 'CSE', 'B', 'manoj.k@college.edu'),
    ('717822P207', 'Meera Pillai', 'CSE', 'B', 'meera.p@college.edu'),
    ('717822P208', 'Naveen Prakash', 'CSE', 'B', 'naveen.p@college.edu'),

    ('717822P301', 'Pooja Hegde', 'IT', 'A', 'pooja.h@college.edu'),
    ('717822P302', 'Pranav Anand', 'IT', 'A', 'pranav.a@college.edu'),
    ('717822P303', 'Rahul Subramanian', 'IT', 'A', 'rahul.s@college.edu'),
    ('717822P304', 'Rhea Chakraborty', 'IT', 'A', 'rhea.c@college.edu'),
    ('717822P305', 'Rohan Sengupta', 'IT', 'A', 'rohan.s@college.edu'),
    ('717822P306', 'Sai Vignesh', 'IT', 'A', 'sai.v@college.edu'),
    ('717822P307', 'Sandhya Raman', 'IT', 'A', 'sandhya.r@college.edu'),
    ('717822P308', 'Siddharth Iyer', 'IT', 'A', 'siddharth.i@college.edu')
ON CONFLICT (reg_no) DO NOTHING;

-- Insert a couple of existing sample submissions to show analytics right away
INSERT INTO public.submissions (task_id, reg_no, screenshot_url, notes, submitted_at)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '717822P101', 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80', 'NPTEL Cloud Computing course registration', NOW() - INTERVAL '2 hours'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '717822P103', 'https://images.unsplash.com/photo-1554415707-9e4466bfe053?auto=format&fit=crop&w=800&q=80', 'Payment completed via UPI ref 492019', NOW() - INTERVAL '3 hours'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '717822P104', 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&w=800&q=80', 'Enrolled in Python for Data Science', NOW() - INTERVAL '5 hours'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '717822P201', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80', 'Receipt attached with roll number', NOW() - INTERVAL '1 hour'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '717822P301', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80', 'Deep Learning course proof', NOW() - INTERVAL '30 minutes')
ON CONFLICT (task_id, reg_no) DO NOTHING;
