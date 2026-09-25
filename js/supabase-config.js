// ===================================================================
// SUPABASE CLIENT CONFIGURATION & UNIFIED DATA SERVICE
// Production Cloud Backend Integration
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
    reg_no: String(s.reg_no || s.register_number || '').trim().toUpperCase(),
    name: String(s.name || s.student_name || '').trim(),
    department: String(s.department || '').trim().toUpperCase(),
    section: String(s.section || '').trim().toUpperCase()
  };
}

// Fast client-side image compression (keeps uploads lightning fast & reliable)
async function compressImageForUpload(file) {
  return new Promise((resolve) => {
    // If not an image, return original
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const maxWidth = 1600;
        const maxHeight = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg'
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.82
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

// Default fallback task
const DEFAULT_TASK = {
  id: 'task-live-01',
  title: 'Course Registration & Proof Screenshot Submission',
  description: 'Please upload a clear screenshot of your course enrollment / assessment completion proof showing your Name and Register Number.',
  deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  is_active: true,
  created_at: new Date().toISOString()
};

// ===================================================================
// UNIFIED DATA SERVICE
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
        // Table tasks may not exist, use default
      }
    }
    return DEFAULT_TASK;
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
        // Table tasks may not exist
      }
    }
    return [DEFAULT_TASK];
  },

  // 3. Create a new task
  async createTask(taskData) {
    if (this.isLive()) {
      try {
        const { data, error } = await supabaseClient
          .from('tasks')
          .insert([taskData])
          .select()
          .single();

        if (!error && data) return data;
      } catch (err) {
        console.warn('tasks insert note:', err.message);
      }
    }
    return {
      id: 'task-' + Date.now(),
      ...taskData,
      created_at: new Date().toISOString()
    };
  },

  // 4. Set a task as active
  async setActiveTask(taskId) {
    return DEFAULT_TASK;
  },

  // 5. Lookup student by Register Number (The Auto-fill engine)
  async getStudentByRegNo(regNo) {
    const cleanRegNo = String(regNo || '').trim().toUpperCase();
    if (!cleanRegNo) return null;

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
            // column register_number does not exist
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

  // 6. Get all students from Supabase (372 real students)
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
    const cleanRegNo = String(regNo || '').trim().toUpperCase();
    if (!cleanRegNo) return null;

    if (this.isLive()) {
      try {
        const { data } = await supabaseClient
          .from('task_submissions')
          .select('*')
          .ilike('reg_no', cleanRegNo)
          .maybeSingle();

        if (data) return data;
      } catch (err) {
        // Check submissions fallback
      }
    }
    return null;
  },

  // 9. Upload screenshot file and save submission to Supabase
  async submitProof(taskId, regNo, file, notes = '', studentObj = null) {
    const cleanRegNo = String(regNo || '').trim().toUpperCase();
    const effectiveTaskId = taskId || 'task-live-01';
    let screenshotUrl = '';

    if (!cleanRegNo) {
      throw new Error('Register number is required.');
    }

    // Step A: Compress image for reliable, high-speed upload
    let fileToUpload = file;
    if (file instanceof File) {
      try {
        fileToUpload = await compressImageForUpload(file);
      } catch (compErr) {
        fileToUpload = file;
      }
    }

    // Step B: Upload to Supabase Storage
    if (this.isLive() && fileToUpload instanceof File) {
      try {
        const fileExt = fileToUpload.name.split('.').pop() || 'jpg';
        const sanitizedPath = `proofs/${cleanRegNo}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseClient
          .storage
          .from(SUPABASE_CONFIG.storageBucket)
          .upload(sanitizedPath, fileToUpload, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.warn('Storage upload note:', uploadError.message);
        } else {
          const { data: { publicUrl } } = supabaseClient
            .storage
            .from(SUPABASE_CONFIG.storageBucket)
            .getPublicUrl(sanitizedPath);

          if (publicUrl) {
            screenshotUrl = publicUrl;
          }
        }
      } catch (storageEx) {
        console.warn('Storage exception:', storageEx);
      }
    }

    // Fallback image URL if storage upload failed
    if (!screenshotUrl) {
      if (fileToUpload instanceof File) {
        screenshotUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(fileToUpload);
        });
      } else if (typeof fileToUpload === 'string') {
        screenshotUrl = fileToUpload;
      }
    }

    // Step C: Build database payload
    const submissionPayload = {
      task_id: effectiveTaskId,
      reg_no: cleanRegNo,
      student_name: studentObj ? studentObj.name : '',
      department: studentObj ? studentObj.department : '',
      section: studentObj ? studentObj.section : '',
      screenshot_url: screenshotUrl,
      notes: notes || '',
      submitted_at: new Date().toISOString()
    };

    // Step D: Insert/Upsert into task_submissions table in Supabase
    if (this.isLive()) {
      // 1. Try upsert with onConflict task_id,reg_no
      let { data, error } = await supabaseClient
        .from('task_submissions')
        .upsert([submissionPayload], { onConflict: 'task_id,reg_no' })
        .select()
        .maybeSingle();

      // 2. If error, try plain insert
      if (error) {
        console.warn('task_submissions upsert notice, trying insert:', error.message);
        const insertRes = await supabaseClient
          .from('task_submissions')
          .insert([submissionPayload])
          .select()
          .maybeSingle();

        data = insertRes.data;
        error = insertRes.error;
      }

      if (error) {
        console.error('Database submission failed:', error);
        throw new Error(error.message || 'Could not save submission to database.');
      }

      if (data) {
        console.log('✅ Submission recorded in Supabase:', data);
        return data;
      }
    }

    throw new Error('Supabase client is not connected.');
  },

  // 10. Get all submissions from Supabase task_submissions table
  async getSubmissionsForTask(taskId) {
    if (this.isLive()) {
      try {
        const { data, error } = await supabaseClient
          .from('task_submissions')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map(sub => ({
            ...sub,
            reg_no: String(sub.reg_no || '').trim().toUpperCase()
          }));
        }

        if (error) {
          console.warn('Error fetching task_submissions:', error.message);
        }
      } catch (err) {
        console.warn('getSubmissionsForTask error:', err.message);
      }
    }
    return [];
  }
};
