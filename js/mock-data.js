// ===================================================================
// STARTER DATA & OFFLINE/DEMO STORAGE ENGINE
// Provides immediate local testing until live Supabase credentials are set
// ===================================================================

const DEFAULT_MOCK_TASK = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  title: 'NPTEL Course Registration & Payment Screenshot Proof',
  description: 'Please complete your NPTEL Swayam course enrollment for the upcoming session. Upload a clear screenshot of your enrolled course dashboard or payment confirmation receipt showing your Name/Roll Number.',
  deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  is_active: true,
  created_at: new Date().toISOString()
};

const DEFAULT_MOCK_STUDENTS = [
  { reg_no: '717822P101', name: 'Aarav Sharma', department: 'CSE', section: 'A', email: 'aarav.sharma@college.edu' },
  { reg_no: '717822P102', name: 'Abhinav Patel', department: 'CSE', section: 'A', email: 'abhinav.patel@college.edu' },
  { reg_no: '717822P103', name: 'Aditi Rao', department: 'CSE', section: 'A', email: 'aditi.rao@college.edu' },
  { reg_no: '717822P104', name: 'Ananya Deshmukh', department: 'CSE', section: 'A', email: 'ananya.d@college.edu' },
  { reg_no: '717822P105', name: 'Bhavya Nair', department: 'CSE', section: 'A', email: 'bhavya.nair@college.edu' },
  { reg_no: '717822P106', name: 'Chetan Verma', department: 'CSE', section: 'A', email: 'chetan.v@college.edu' },
  { reg_no: '717822P107', name: 'Deepika Sundaram', department: 'CSE', section: 'A', email: 'deepika.s@college.edu' },
  { reg_no: '717822P108', name: 'Dinesh Kumar', department: 'CSE', section: 'A', email: 'dinesh.k@college.edu' },
  { reg_no: '717822P109', name: 'Divya Krishnan', department: 'CSE', section: 'A', email: 'divya.k@college.edu' },
  { reg_no: '717822P110', name: 'Gautam Menon', department: 'CSE', section: 'A', email: 'gautam.m@college.edu' },

  { reg_no: '717822P201', name: 'Harish Raghavan', department: 'CSE', section: 'B', email: 'harish.r@college.edu' },
  { reg_no: '717822P202', name: 'Ishaan Malhotra', department: 'CSE', section: 'B', email: 'ishaan.m@college.edu' },
  { reg_no: '717822P203', name: 'Janani Venkatesh', department: 'CSE', section: 'B', email: 'janani.v@college.edu' },
  { reg_no: '717822P204', name: 'Karthik Raja', department: 'CSE', section: 'B', email: 'karthik.r@college.edu' },
  { reg_no: '717822P205', name: 'Kavya Murugan', department: 'CSE', section: 'B', email: 'kavya.m@college.edu' },
  { reg_no: '717822P206', name: 'Manoj Kumar', department: 'CSE', section: 'B', email: 'manoj.k@college.edu' },
  { reg_no: '717822P207', name: 'Meera Pillai', department: 'CSE', section: 'B', email: 'meera.p@college.edu' },
  { reg_no: '717822P208', name: 'Naveen Prakash', department: 'CSE', section: 'B', email: 'naveen.p@college.edu' },

  { reg_no: '717822P301', name: 'Pooja Hegde', department: 'IT', section: 'A', email: 'pooja.h@college.edu' },
  { reg_no: '717822P302', name: 'Pranav Anand', department: 'IT', section: 'A', email: 'pranav.a@college.edu' },
  { reg_no: '717822P303', name: 'Rahul Subramanian', department: 'IT', section: 'A', email: 'rahul.s@college.edu' },
  { reg_no: '717822P304', name: 'Rhea Chakraborty', department: 'IT', section: 'A', email: 'rhea.c@college.edu' },
  { reg_no: '717822P305', name: 'Rohan Sengupta', department: 'IT', section: 'A', email: 'rohan.s@college.edu' },
  { reg_no: '717822P306', name: 'Sai Vignesh', department: 'IT', section: 'A', email: 'sai.v@college.edu' },
  { reg_no: '717822P307', name: 'Sandhya Raman', department: 'IT', section: 'A', email: 'sandhya.r@college.edu' },
  { reg_no: '717822P308', name: 'Siddharth Iyer', department: 'IT', section: 'A', email: 'siddharth.i@college.edu' }
];

const DEFAULT_MOCK_SUBMISSIONS = [
  {
    id: 'sub-1',
    task_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    reg_no: '717822P101',
    screenshot_url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80',
    notes: 'Registered for Cloud Computing Course',
    submitted_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  },
  {
    id: 'sub-2',
    task_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    reg_no: '717822P103',
    screenshot_url: 'https://images.unsplash.com/photo-1554415707-9e4466bfe053?auto=format&fit=crop&w=800&q=80',
    notes: 'UPI payment receipt attached',
    submitted_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  },
  {
    id: 'sub-3',
    task_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    reg_no: '717822P104',
    screenshot_url: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&w=800&q=80',
    notes: 'Python for Data Science proof',
    submitted_at: new Date(Date.now() - 7 * 3600 * 1000).toISOString()
  },
  {
    id: 'sub-4',
    task_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    reg_no: '717822P201',
    screenshot_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    notes: 'Roll number and course ID verified',
    submitted_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'sub-5',
    task_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    reg_no: '717822P301',
    screenshot_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    notes: 'Deep Learning certification enrollment',
    submitted_at: new Date(Date.now() - 40 * 60 * 1000).toISOString()
  },
  {
    id: 'sub-6',
    task_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    reg_no: '717822P304',
    screenshot_url: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=800&q=80',
    notes: 'Registered with institute roll number',
    submitted_at: new Date(Date.now() - 20 * 60 * 1000).toISOString()
  }
];

// LocalStorage Persistence Wrapper for Demo Mode
const MockDB = {
  init() {
    if (!localStorage.getItem('taskdash_students')) {
      localStorage.setItem('taskdash_students', JSON.stringify(DEFAULT_MOCK_STUDENTS));
    }
    if (!localStorage.getItem('taskdash_tasks')) {
      localStorage.setItem('taskdash_tasks', JSON.stringify([DEFAULT_MOCK_TASK]));
    }
    if (!localStorage.getItem('taskdash_submissions')) {
      localStorage.setItem('taskdash_submissions', JSON.stringify(DEFAULT_MOCK_SUBMISSIONS));
    }
  },

  getStudents() {
    this.init();
    return JSON.parse(localStorage.getItem('taskdash_students') || '[]');
  },

  saveStudents(students) {
    localStorage.setItem('taskdash_students', JSON.stringify(students));
  },

  getTasks() {
    this.init();
    return JSON.parse(localStorage.getItem('taskdash_tasks') || '[]');
  },

  getActiveTask() {
    const tasks = this.getTasks();
    return tasks.find(t => t.is_active) || tasks[0] || null;
  },

  saveTasks(tasks) {
    localStorage.setItem('taskdash_tasks', JSON.stringify(tasks));
  },

  getSubmissions() {
    this.init();
    return JSON.parse(localStorage.getItem('taskdash_submissions') || '[]');
  },

  saveSubmissions(submissions) {
    localStorage.setItem('taskdash_submissions', JSON.stringify(submissions));
  },

  resetDefaults() {
    localStorage.setItem('taskdash_students', JSON.stringify(DEFAULT_MOCK_STUDENTS));
    localStorage.setItem('taskdash_tasks', JSON.stringify([DEFAULT_MOCK_TASK]));
    localStorage.setItem('taskdash_submissions', JSON.stringify(DEFAULT_MOCK_SUBMISSIONS));
  }
};
