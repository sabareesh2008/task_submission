// ===================================================================
// SUPABASE CLIENT CONFIGURATION & UNIFIED DATA SERVICE
// Live Cloud Backend Integration
// ===================================================================

const SUPABASE_CONFIG = {
  url: 'https://jehhjilmqoljxmsvnwgd.supabase.co',
  anonKey: 'sb_publishable_4x2bY6PkwBmfdIW47ILf3w_L-Q0JoJQ',
  storageBucket: 'proof-screenshots'
};

function isSupabaseConfigured() {
  return (
    Boolean(SUPABASE_CONFIG.url) &&
    SUPABASE_CONFIG.url.startsWith('https://') &&
    Boolean(SUPABASE_CONFIG.anonKey) &&
    SUPABASE_CONFIG.anonKey.length > 10
  );
}

let supabaseClient = null;

if (isSupabaseConfigured() && window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ Supabase Client Initialized with Project:', SUPABASE_CONFIG.url);
  } catch (err) {
    console.warn('⚠️ Could not initialize Supabase client:', err.message);
  }
}

// Normalizes student schema (supports both register_number and reg_no)
function normalizeStudent(s) {
  if (!s) return null;
  return {
    ...s,
    reg_no: s.reg_no || s.register_number || '',
    name: s.name || s.student_name || '',
    department: s.department || '',
    section: s.section || ''
  };
}

// ===================================================================
// UNIFIED DATA SERVICE
// Queries real Supabase Cloud Tables directly
// ===================================================================
const DataService = {
  isLive() {
    return !!supabaseClient;
  },

  // 1. Get the currently active assigned task
  async getActiveTask() {
    if (this.isLive()) {
      try {
        const { data, error } = await supabaseClient
          .from('tasks')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) return data;
      } catch (err) {
        console.warn('tasks table query note:', err.message);
      }
    }
    return MockDB.getActiveTask();
  },

  // 2. Get all tasks
  async getAllTasks() {
    if (this.isLive()) {
      try {
        const { data, error } = await supabaseClient
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('tasks table query note:', err.message);
      }
    }
    return MockDB.getTasks();
  },

  // 3. Create a new task
  async createTask(taskData) {
    if (this.isLive()) {
      try {
        if (taskData.is_active) {
          await supabaseClient
            .from('tasks')
            .update({ is_active: false })
            .neq('id', '00000000-0000-0000-0000-000000000000');
        }

        const { data, error } = await supabaseClient
          .from('tasks')
          .insert([taskData])
          .select()
          .single();

        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase createTask fallback to local:', err.message);
      }
    }
    
    const tasks = MockDB.getTasks();
    if (taskData.is_active) {
      tasks.forEach(t => t.is_active = false);
    }
    const newTask = {
      id: 'task-' + Date.now(),
      ...taskData,
      created_at: new Date().toISOString()
    };
    tasks.unshift(newTask);
    MockDB.saveTasks(tasks);
    return newTask;
  },

  // 4. Set a task as active
  async setActiveTask(taskId) {
    if (this.isLive()) {
      try {
        await supabaseClient.from('tasks').update({ is_active: false }).neq('id', taskId);
        const { data, error } = await supabaseClient
          .from('tasks')
          .update({ is_active: true })
          .eq('id', taskId)
          .select()
          .single();

        if (!error && data) return data;
      } catch (err) {
        console.warn('setActiveTask error:', err.message);
      }
    }
    const tasks = MockDB.getTasks();
    tasks.forEach(t => t.is_active = (t.id === taskId));
    MockDB.saveTasks(tasks);
    return tasks.find(t => t.id === taskId);
  },

  // 5. Lookup student by Register Number (The Auto-fill engine)
  async getStudentByRegNo(regNo) {
    const cleanRegNo = regNo.trim().toUpperCase();
    if (this.isLive()) {
      try {
        // Query by reg_no
        let { data, error } = await supabaseClient
          .from('students')
          .select('*')
          .ilike('reg_no', cleanRegNo)
          .maybeSingle();

        // If not found, try register_number column
        if (!data) {
          try {
            const alt = await supabaseClient
              .from('students')
              .select('*')
              .ilike('register_number', cleanRegNo)
              .maybeSingle();
            if (alt.data) data = alt.data;
          } catch (e) {
            // column register_number may not exist
          }
        }

        if (data) {
          return normalizeStudent(data);
        }
      } catch (err) {
        console.warn('Supabase student lookup error:', err.message);
      }
    }
    return null;
  },

  // 6. Get all students from Supabase
  async getAllStudents() {
    if (this.isLive()) {
      try {
        const { data, error } = await supabaseClient
          .from('students')
          .select('*')
          .order('reg_no', { ascending: true })
          .limit(2000);

        if (!error && data && data.length > 0) {
          return data.map(normalizeStudent);
        }
      } catch (err) {
        console.warn('Supabase getAllStudents error:', err.message);
      }
    }
    return [];
  },

  // 7. Bulk import students (CSV)
  async bulkInsertStudents(studentsList) {
    if (this.isLive()) {
      try {
        const { data, error } = await supabaseClient
          .from('students')
          .upsert(studentsList, { onConflict: 'reg_no' });

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase bulkInsertStudents error:', err);
        throw err;
      }
    }
    return [];
  },

  // 8. Check if student has already submitted for this task
  async getExistingSubmission(taskId, regNo) {
    const cleanRegNo = regNo.trim().toUpperCase();
    if (this.isLive()) {
      try {
        const { data, error } = await supabaseClient
          .from('submissions')
          .select('*')
          .eq('task_id', taskId)
          .ilike('reg_no', cleanRegNo)
          .maybeSingle();

        if (!error && data) return data;
      } catch (err) {
        // column task_id might not exist yet, check local storage
      }
    }
    const submissions = MockDB.getSubmissions();
    return submissions.find(s => s.task_id === taskId && s.reg_no.toUpperCase() === cleanRegNo) || null;
  },

  // 9. Upload screenshot file and save submission
  async submitProof(taskId, regNo, file, notes = '', studentObj = null) {
    const cleanRegNo = regNo.trim().toUpperCase();
    let screenshotUrl = '';

    // Convert file to Base64 or upload to Storage Bucket
    if (file instanceof File) {
      if (this.isLive()) {
        try {
          const fileExt = file.name.split('.').pop() || 'png';
          const filePath = `${taskId}/${cleanRegNo}_${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabaseClient
            .storage
            .from(SUPABASE_CONFIG.storageBucket)
            .upload(filePath, file, { upsert: true });

          if (!uploadError) {
            const { data: { publicUrl } } = supabaseClient
              .storage
              .from(SUPABASE_CONFIG.storageBucket)
              .getPublicUrl(filePath);

            screenshotUrl = publicUrl;
          }
        } catch (uploadEx) {
          console.warn('Storage bucket upload notice:', uploadEx.message);
        }
      }

      if (!screenshotUrl) {
        screenshotUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      }
    } else if (typeof file === 'string') {
      screenshotUrl = file;
    }

    const submissionPayload = {
      task_id: taskId,
      reg_no: cleanRegNo,
      student_name: studentObj ? studentObj.name : '',
      department: studentObj ? studentObj.department : '',
      section: studentObj ? studentObj.section : '',
      screenshot_url: screenshotUrl,
      notes: notes,
      submitted_at: new Date().toISOString()
    };

    if (this.isLive()) {
      try {
        const { data, error } = await supabaseClient
          .from('submissions')
          .insert([submissionPayload])
          .select()
          .single();

        if (!error && data) {
          // Keep synced locally
          const localSubs = MockDB.getSubmissions();
          localSubs.unshift(data);
          MockDB.saveSubmissions(localSubs);
          return data;
        }
      } catch (insertErr) {
        console.warn('submissions insert warning:', insertErr.message);
      }
    }

    // Save locally to ensure proof is registered
    const submissions = MockDB.getSubmissions();
    const existingIdx = submissions.findIndex(s => s.task_id === taskId && s.reg_no.toUpperCase() === cleanRegNo);

    const record = {
      id: 'sub-' + Date.now(),
      ...submissionPayload
    };

    if (existingIdx >= 0) {
      submissions[existingIdx] = record;
    } else {
      submissions.unshift(record);
    }

    MockDB.saveSubmissions(submissions);
    return record;
  },

  // 10. Get all submissions for a task
  async getSubmissionsForTask(taskId) {
    if (this.isLive()) {
      try {
        const { data, error } = await supabaseClient
          .from('submissions')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (!error && data && data.length > 0) {
          // Filter if task_id column exists or return all
          const filtered = data.filter(d => !d.task_id || d.task_id === taskId);
          return filtered.length > 0 ? filtered : data;
        }
      } catch (err) {
        console.warn('getSubmissionsForTask query note:', err.message);
      }
    }
    const submissions = MockDB.getSubmissions();
    return submissions.filter(s => s.task_id === taskId);
  }
};
