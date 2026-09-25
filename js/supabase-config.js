// ===================================================================
// SUPABASE CLIENT CONFIGURATION & UNIFIED DATA SERVICE
// ===================================================================

// Default Supabase Configuration
// You can enter your credentials here OR via the UI setup modal!
const SUPABASE_CONFIG = {
  // Replace these with your Supabase Project details or use the in-app modal
  url: localStorage.getItem('taskdash_sb_url') || '',
  anonKey: localStorage.getItem('taskdash_sb_key') || '',
  storageBucket: 'proof-screenshots'
};

// Check if credentials are present
function isSupabaseConfigured() {
  return (
    SUPABASE_CONFIG.url &&
    SUPABASE_CONFIG.url.startsWith('https://') &&
    SUPABASE_CONFIG.anonKey &&
    SUPABASE_CONFIG.anonKey.length > 20
  );
}

// Global Supabase client instance
let supabaseClient = null;

if (isSupabaseConfigured() && window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ Supabase Client Initialized Successfully');
  } catch (err) {
    console.warn('⚠️ Could not initialize Supabase client:', err.message);
  }
}

// ===================================================================
// UNIFIED DATA SERVICE
// Handles queries for both Supabase (Live) and MockDB (Demo/Offline)
// ===================================================================
const DataService = {
  isLive() {
    return !!supabaseClient;
  },

  // Save credentials from UI
  saveConfig(url, anonKey) {
    localStorage.setItem('taskdash_sb_url', url.trim());
    localStorage.setItem('taskdash_sb_key', anonKey.trim());
    window.location.reload();
  },

  // Clear credentials
  clearConfig() {
    localStorage.removeItem('taskdash_sb_url');
    localStorage.removeItem('taskdash_sb_key');
    window.location.reload();
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

        if (error) throw error;
        if (data) return data;
      } catch (err) {
        console.warn('Supabase getActiveTask error, falling back to local:', err.message);
      }
    }
    return MockDB.getActiveTask();
  },

  // 2. Get all tasks (for admin selector)
  async getAllTasks() {
    if (this.isLive()) {
      try {
        const { data, error } = await supabaseClient
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase getAllTasks error:', err.message);
      }
    }
    return MockDB.getTasks();
  },

  // 3. Create a new task
  async createTask(taskData) {
    if (this.isLive()) {
      try {
        // If this new task is active, deactivate others
        if (taskData.is_active) {
          await supabaseClient.from('tasks').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
        }

        const { data, error } = await supabaseClient
          .from('tasks')
          .insert([taskData])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase createTask error:', err);
        throw err;
      }
    } else {
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
    }
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

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase setActiveTask error:', err);
        throw err;
      }
    } else {
      const tasks = MockDB.getTasks();
      tasks.forEach(t => t.is_active = (t.id === taskId));
      MockDB.saveTasks(tasks);
      return tasks.find(t => t.id === taskId);
    }
  },

  // 5. Lookup student by Register Number (The Auto-fill engine)
  async getStudentByRegNo(regNo) {
    const cleanRegNo = regNo.trim().toUpperCase();
    if (this.isLive()) {
      try {
        const { data, error } = await supabaseClient
          .from('students')
          .select('*')
          .ilike('reg_no', cleanRegNo)
          .maybeSingle();

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase student lookup error:', err.message);
      }
    }
    const students = MockDB.getStudents();
    return students.find(s => s.reg_no.toUpperCase() === cleanRegNo) || null;
  },

  // 6. Get all students
  async getAllStudents() {
    if (this.isLive()) {
      try {
        const { data, error } = await supabaseClient
          .from('students')
          .select('*')
          .order('reg_no', { ascending: true });

        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase getAllStudents error:', err.message);
      }
    }
    return MockDB.getStudents();
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
    } else {
      const current = MockDB.getStudents();
      const map = new Map();
      current.forEach(s => map.set(s.reg_no.toUpperCase(), s));
      studentsList.forEach(s => map.set(s.reg_no.toUpperCase(), s));
      const updated = Array.from(map.values());
      MockDB.saveStudents(updated);
      return updated;
    }
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
        console.warn('Supabase getExistingSubmission error:', err.message);
      }
    }
    const submissions = MockDB.getSubmissions();
    return submissions.find(s => s.task_id === taskId && s.reg_no.toUpperCase() === cleanRegNo) || null;
  },

  // 9. Upload screenshot file and save submission
  async submitProof(taskId, regNo, file, notes = '') {
    const cleanRegNo = regNo.trim().toUpperCase();
    let screenshotUrl = '';

    if (this.isLive() && file instanceof File) {
      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const filePath = `${taskId}/${cleanRegNo}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseClient
          .storage
          .from(SUPABASE_CONFIG.storageBucket)
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabaseClient
          .storage
          .from(SUPABASE_CONFIG.storageBucket)
          .getPublicUrl(filePath);

        screenshotUrl = publicUrl;

        // Upsert submission record
        const { data, error: dbError } = await supabaseClient
          .from('submissions')
          .upsert([{
            task_id: taskId,
            reg_no: cleanRegNo,
            screenshot_url: screenshotUrl,
            notes: notes,
            submitted_at: new Date().toISOString()
          }], { onConflict: 'task_id,reg_no' })
          .select()
          .single();

        if (dbError) throw dbError;
        return data;
      } catch (err) {
        console.error('Supabase submission failed:', err);
        throw err;
      }
    } else {
      // Local/Demo Mode: Convert File to base64 Data URL or use existing URL
      if (file instanceof File) {
        screenshotUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      } else if (typeof file === 'string') {
        screenshotUrl = file;
      }

      const submissions = MockDB.getSubmissions();
      const existingIdx = submissions.findIndex(s => s.task_id === taskId && s.reg_no.toUpperCase() === cleanRegNo);

      const submissionRecord = {
        id: 'sub-' + Date.now(),
        task_id: taskId,
        reg_no: cleanRegNo,
        screenshot_url: screenshotUrl,
        notes: notes,
        submitted_at: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        submissions[existingIdx] = submissionRecord;
      } else {
        submissions.unshift(submissionRecord);
      }

      MockDB.saveSubmissions(submissions);
      return submissionRecord;
    }
  },

  // 10. Get all submissions for a task
  async getSubmissionsForTask(taskId) {
    if (this.isLive()) {
      try {
        const { data, error } = await supabaseClient
          .from('submissions')
          .select('*')
          .eq('task_id', taskId);

        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase getSubmissionsForTask error:', err.message);
      }
    }
    const submissions = MockDB.getSubmissions();
    return submissions.filter(s => s.task_id === taskId);
  }
};
