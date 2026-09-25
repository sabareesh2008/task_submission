// ===================================================================
// ADMIN & FACULTY DASHBOARD - JAVASCRIPT ANALYTICS & MANAGEMENT
// ===================================================================

let allTasks = [];
let selectedTaskId = null;
let currentTask = null;
let allStudents = [];
let taskSubmissions = [];
let pendingCsvStudents = [];

// Filters state
let currentStatusFilter = 'all'; // 'all' | 'submitted' | 'pending'
let currentSectionFilter = 'all';
let currentDeptFilter = 'all';
let currentSearchQuery = '';

// DOM Elements
const taskSelector = document.getElementById('adminTaskSelector');
const activeTaskTitle = document.getElementById('activeTaskTitle');
const activeTaskBadge = document.getElementById('activeTaskStatusBadge');
const activeTaskDeadlineText = document.getElementById('activeTaskDeadlineText');

const kpiTotalStudents = document.getElementById('kpiTotalStudents');
const kpiSubmittedCount = document.getElementById('kpiSubmittedCount');
const kpiSubmittedPct = document.getElementById('kpiSubmittedPct');
const kpiProgressBar = document.getElementById('kpiProgressBar');
const kpiPendingCount = document.getElementById('kpiPendingCount');
const kpiPendingPct = document.getElementById('kpiPendingPct');
const kpiTotalSections = document.getElementById('kpiTotalSections');

const sectionCardsContainer = document.getElementById('sectionCardsContainer');
const searchInput = document.getElementById('searchInput');
const filterSectionSelect = document.getElementById('filterSectionSelect');
const filterDeptSelect = document.getElementById('filterDeptSelect');
const studentsTableBody = document.getElementById('studentsTableBody');
const filteredResultsCount = document.getElementById('filteredResultsCount');

const tabCountAll = document.getElementById('tabCountAll');
const tabCountSubmitted = document.getElementById('tabCountSubmitted');
const tabCountPending = document.getElementById('tabCountPending');

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  setupAdminBannerStatus();
  await loadDashboard();
  attachAdminEvents();
});

// Setup Connection Status Banner
function setupAdminBannerStatus() {
  const banner = document.getElementById('adminConnectionBanner');
  const bannerText = document.getElementById('adminConnectionText');
  if (DataService.isLive()) {
    banner.classList.add('active-live');
    bannerText.innerHTML = `<span>🟢 Connected to <strong>Supabase Cloud</strong> (Live DB & Storage)</span>`;
  } else {
    banner.classList.remove('active-live');
    bannerText.innerHTML = `<span>⚡ Mode: <strong>Demo / Local Storage</strong>. Test right away or connect your Supabase project.</span>`;
  }
}

// 1. Load All Dashboard Data
async function loadDashboard() {
  try {
    allTasks = await DataService.getAllTasks();
    populateTaskSelector();

    if (allTasks.length > 0) {
      if (!selectedTaskId) {
        const activeOne = allTasks.find(t => t.is_active) || allTasks[0];
        selectedTaskId = activeOne.id;
      }
      currentTask = allTasks.find(t => t.id === selectedTaskId) || allTasks[0];
      updateTaskHeader(currentTask);
    }

    allStudents = await DataService.getAllStudents();
    taskSubmissions = currentTask ? await DataService.getSubmissionsForTask(currentTask.id) : [];

    populateFilterDropdowns();
    computeAnalytics();
    renderFilteredTable();
  } catch (err) {
    console.error('Failed to load dashboard:', err);
    showToast('Error loading dashboard data', true);
  }
}

// 2. Populate Task Selector Dropdown
function populateTaskSelector() {
  taskSelector.innerHTML = '';
  if (allTasks.length === 0) {
    taskSelector.innerHTML = '<option value="">No Tasks Found</option>';
    return;
  }

  allTasks.forEach(task => {
    const opt = document.createElement('option');
    opt.value = task.id;
    opt.textContent = `${task.is_active ? '● [ACTIVE] ' : ''}${task.title}`;
    if (task.id === selectedTaskId) opt.selected = true;
    taskSelector.appendChild(opt);
  });
}

function updateTaskHeader(task) {
  if (!task) return;
  activeTaskTitle.textContent = task.title;
  activeTaskBadge.textContent = task.is_active ? 'Active' : 'Archived';
  activeTaskBadge.className = `badge ${task.is_active ? 'badge-live' : 'badge-closed'}`;

  if (task.deadline) {
    const d = new Date(task.deadline);
    activeTaskDeadlineText.textContent = `Deadline: ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  } else {
    activeTaskDeadlineText.textContent = 'Deadline: Open';
  }
}

// 3. Populate Filter Dropdowns (Departments & Sections)
function populateFilterDropdowns() {
  const sections = new Set();
  const depts = new Set();

  allStudents.forEach(s => {
    if (s.section) sections.add(s.section);
    if (s.department) depts.add(s.department);
  });

  // Sections
  const sortedSec = Array.from(sections).sort();
  filterSectionSelect.innerHTML = '<option value="all">All Sections</option>';
  sortedSec.forEach(sec => {
    const opt = document.createElement('option');
    opt.value = sec;
    opt.textContent = `Section ${sec}`;
    if (currentSectionFilter === sec) opt.selected = true;
    filterSectionSelect.appendChild(opt);
  });

  // Depts
  const sortedDept = Array.from(depts).sort();
  filterDeptSelect.innerHTML = '<option value="all">All Departments</option>';
  sortedDept.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    if (currentDeptFilter === d) opt.selected = true;
    filterDeptSelect.appendChild(opt);
  });
}

// 4. Compute Analytics & Render Section Cards
function computeAnalytics() {
  const total = allStudents.length;
  const submissionMap = new Map();
  taskSubmissions.forEach(sub => submissionMap.set(sub.reg_no.toUpperCase(), sub));

  let submittedCount = 0;
  allStudents.forEach(s => {
    if (submissionMap.has(s.reg_no.toUpperCase())) {
      submittedCount++;
    }
  });

  const pendingCount = total - submittedCount;
  const pctSubmitted = total > 0 ? Math.round((submittedCount / total) * 100) : 0;
  const pctPending = total > 0 ? Math.round((pendingCount / total) * 100) : 0;

  // Update KPI Cards
  kpiTotalStudents.textContent = total;
  kpiSubmittedCount.textContent = submittedCount;
  kpiSubmittedPct.textContent = `${pctSubmitted}%`;
  kpiProgressBar.style.width = `${pctSubmitted}%`;
  kpiPendingCount.textContent = pendingCount;
  kpiPendingPct.textContent = `${pctPending}%`;

  // Tab counters
  tabCountAll.textContent = total;
  tabCountSubmitted.textContent = submittedCount;
  tabCountPending.textContent = pendingCount;

  // Compute Section-wise Breakdown
  const sectionStats = {};
  allStudents.forEach(s => {
    const key = `${s.department}-${s.section}`;
    if (!sectionStats[key]) {
      sectionStats[key] = {
        department: s.department,
        section: s.section,
        total: 0,
        submitted: 0,
        pending: 0
      };
    }
    sectionStats[key].total++;
    if (submissionMap.has(s.reg_no.toUpperCase())) {
      sectionStats[key].submitted++;
    } else {
      sectionStats[key].pending++;
    }
  });

  kpiTotalSections.textContent = Object.keys(sectionStats).length;

  // Render Section Cards
  renderSectionCards(sectionStats);
}

// Render Section Cards
function renderSectionCards(sectionStats) {
  sectionCardsContainer.innerHTML = '';
  const keys = Object.keys(sectionStats).sort();

  if (keys.length === 0) {
    sectionCardsContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">No student sections found. Upload student roster to see section breakdown.</div>';
    return;
  }

  keys.forEach(key => {
    const item = sectionStats[key];
    const pct = item.total > 0 ? Math.round((item.submitted / item.total) * 100) : 0;

    const box = document.createElement('div');
    const isSelected = (currentSectionFilter === item.section && currentDeptFilter === item.department);
    box.className = `section-box ${isSelected ? 'active-filter' : ''}`;
    box.innerHTML = `
      <div class="section-top">
        <span class="section-name">${item.department} - Sec ${item.section}</span>
        <span class="section-percentage ${pct >= 75 ? 'high' : pct <= 40 ? 'low' : ''}">${pct}%</span>
      </div>
      <div class="section-counts">
        <span>Submitted: <strong>${item.submitted}</strong> / ${item.total}</span>
        <span>Pending: <strong style="color: var(--warning-text);">${item.pending}</strong></span>
      </div>
      <div class="section-bar-track">
        <div class="section-bar-thumb" style="width: ${pct}%;"></div>
      </div>
    `;

    // Click section card to quickly filter
    box.addEventListener('click', () => {
      if (currentSectionFilter === item.section && currentDeptFilter === item.department) {
        // Toggle off
        currentSectionFilter = 'all';
        currentDeptFilter = 'all';
      } else {
        currentSectionFilter = item.section;
        currentDeptFilter = item.department;
      }
      filterSectionSelect.value = currentSectionFilter;
      filterDeptSelect.value = currentDeptFilter;
      computeAnalytics();
      renderFilteredTable();
    });

    sectionCardsContainer.appendChild(box);
  });
}

// 5. Render Filtered Submissions Table
function renderFilteredTable() {
  const submissionMap = new Map();
  taskSubmissions.forEach(sub => submissionMap.set(sub.reg_no.toUpperCase(), sub));

  const filtered = allStudents.filter(student => {
    const isSubmitted = submissionMap.has(student.reg_no.toUpperCase());

    // Status filter
    if (currentStatusFilter === 'submitted' && !isSubmitted) return false;
    if (currentStatusFilter === 'pending' && isSubmitted) return false;

    // Section filter
    if (currentSectionFilter !== 'all' && student.section !== currentSectionFilter) return false;

    // Dept filter
    if (currentDeptFilter !== 'all' && student.department !== currentDeptFilter) return false;

    // Search query
    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase();
      const matchReg = student.reg_no.toLowerCase().includes(q);
      const matchName = student.name.toLowerCase().includes(q);
      if (!matchReg && !matchName) return false;
    }

    return true;
  });

  filteredResultsCount.textContent = `Showing ${filtered.length} of ${allStudents.length} records`;

  if (filtered.length === 0) {
    studentsTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          No students match the current filters.
        </td>
      </tr>
    `;
    return;
  }

  studentsTableBody.innerHTML = '';
  filtered.forEach(student => {
    const sub = submissionMap.get(student.reg_no.toUpperCase());
    const isSubmitted = !!sub;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong style="font-family: monospace; font-size: 0.9rem; letter-spacing: 0.05em;">${student.reg_no}</strong>
      </td>
      <td>
        <div class="student-cell">
          <span class="student-name">${student.name}</span>
          <span class="student-email">${student.email || 'No email registered'}</span>
        </div>
      </td>
      <td>
        <span class="badge badge-pill">${student.department} - Sec ${student.section}</span>
      </td>
      <td>
        ${isSubmitted 
          ? `<span class="badge badge-live">✓ Submitted</span>` 
          : `<span class="badge" style="background-color: var(--warning-bg); color: var(--warning-text); border: 1px solid var(--warning-border);">⏳ Pending</span>`
        }
      </td>
      <td>
        ${isSubmitted ? new Date(sub.submitted_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '<span style="color: var(--text-muted);">-</span>'}
      </td>
      <td>
        ${isSubmitted && sub.screenshot_url ? `
          <img src="${sub.screenshot_url}" class="thumbnail-preview" alt="Proof" onclick='openScreenshotModal(${JSON.stringify(student)}, ${JSON.stringify(sub)})'>
        ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">No Proof</span>'}
      </td>
      <td style="text-align: right;">
        ${isSubmitted ? `
          <button class="btn btn-outline btn-sm" onclick='openScreenshotModal(${JSON.stringify(student)}, ${JSON.stringify(sub)})'>
            View Proof
          </button>
        ` : `
          <button class="btn btn-outline btn-sm" onclick='notifySingleStudent("${student.reg_no}", "${student.name}")' title="Copy reminder text for student">
            Copy Alert
          </button>
        `}
      </td>
    `;
    studentsTableBody.appendChild(tr);
  });
}

// 6. WhatsApp Reminder Pending List Generator
function generateWhatsAppPendingText() {
  const submissionMap = new Map();
  taskSubmissions.forEach(sub => submissionMap.set(sub.reg_no.toUpperCase(), sub));

  const pendingList = allStudents.filter(student => {
    if (submissionMap.has(student.reg_no.toUpperCase())) return false;
    if (currentSectionFilter !== 'all' && student.section !== currentSectionFilter) return false;
    if (currentDeptFilter !== 'all' && student.department !== currentDeptFilter) return false;
    return true;
  });

  const sectionLabel = currentSectionFilter !== 'all' ? `Section ${currentSectionFilter}` : 'All Sections';
  const deptLabel = currentDeptFilter !== 'all' ? currentDeptFilter : 'All Departments';
  const taskName = currentTask ? currentTask.title : 'Task Submission';
  const portalUrl = window.location.origin + window.location.pathname.replace('admin.html', 'index.html');

  let text = `📢 *TASK SUBMISSION REMINDER*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📌 *Task:* ${taskName}\n`;
  text += `🎓 *Target:* ${deptLabel} - ${sectionLabel}\n`;
  text += `⚠️ *Pending Count:* ${pendingList.length} Students\n\n`;

  if (pendingList.length === 0) {
    text += `🎉 Awesome! Everyone in this section has submitted their proof!\n`;
  } else {
    text += `*List of Pending Roll Numbers:*\n`;
    pendingList.forEach((s, idx) => {
      text += `${idx + 1}. *${s.reg_no}* - ${s.name}\n`;
    });
    text += `\n👉 *Submit your proof screenshot now:* ${portalUrl}\n`;
  }

  return text;
}

function openPendingCopyDialog() {
  const text = generateWhatsAppPendingText();
  document.getElementById('pendingCopyTextarea').value = text;
  document.getElementById('pendingCopyModal').classList.add('active');
}

function closePendingCopyModal() {
  document.getElementById('pendingCopyModal').classList.remove('active');
}

function copyPendingToClipboard() {
  const textarea = document.getElementById('pendingCopyTextarea');
  textarea.select();
  navigator.clipboard.writeText(textarea.value).then(() => {
    showToast('📋 Pending list copied to clipboard!');
    closePendingCopyModal();
  }).catch(() => {
    document.execCommand('copy');
    showToast('📋 Pending list copied!');
    closePendingCopyModal();
  });
}

function notifySingleStudent(regNo, name) {
  const taskName = currentTask ? currentTask.title : 'Task Submission';
  const text = `Hi ${name} (${regNo}), kindly submit your screenshot proof for "${taskName}" on the submission portal today.`;
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied reminder for ${regNo}`);
  });
}

// 7. Export CSV / Excel Report
function exportCSVReport() {
  const submissionMap = new Map();
  taskSubmissions.forEach(sub => submissionMap.set(sub.reg_no.toUpperCase(), sub));

  const headers = ['Register No', 'Student Name', 'Department', 'Section', 'Email', 'Status', 'Submitted At', 'Screenshot URL', 'Notes'];
  const rows = [headers];

  allStudents.forEach(student => {
    const sub = submissionMap.get(student.reg_no.toUpperCase());
    const isSubmitted = !!sub;
    rows.push([
      `"${student.reg_no}"`,
      `"${student.name}"`,
      `"${student.department}"`,
      `"${student.section}"`,
      `"${student.email || ''}"`,
      `"${isSubmitted ? 'Submitted' : 'Pending'}"`,
      `"${isSubmitted ? new Date(sub.submitted_at).toLocaleString() : ''}"`,
      `"${isSubmitted && sub.screenshot_url ? sub.screenshot_url : ''}"`,
      `"${isSubmitted && sub.notes ? sub.notes.replace(/"/g, '""') : ''}"`
    ]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const filename = `Task_Report_${currentTask ? currentTask.title.replace(/[^a-zA-Z0-9]/g, '_') : 'Export'}.csv`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('📊 Report CSV downloaded successfully');
}

// 8. Bulk Download Screenshots as ZIP
async function downloadProofsZip() {
  if (taskSubmissions.length === 0) {
    alert('No submissions found for this task yet.');
    return;
  }

  showToast('📦 Bundling proof screenshots into ZIP...');
  const zip = new JSZip();
  const studentMap = new Map();
  allStudents.forEach(s => studentMap.set(s.reg_no.toUpperCase(), s));

  let count = 0;
  for (const sub of taskSubmissions) {
    if (!sub.screenshot_url) continue;
    const student = studentMap.get(sub.reg_no.toUpperCase());
    const deptSec = student ? `${student.department}_Sec${student.section}` : 'General';
    const filename = `${deptSec}/${sub.reg_no}_proof.png`;

    try {
      if (sub.screenshot_url.startsWith('data:image')) {
        // Base64 Data URL
        const base64Data = sub.screenshot_url.split(',')[1];
        zip.file(filename, base64Data, { base64: true });
        count++;
      } else {
        // Remote Image URL
        const response = await fetch(sub.screenshot_url);
        const blob = await response.blob();
        zip.file(filename, blob);
        count++;
      }
    } catch (err) {
      console.warn(`Could not fetch proof for ${sub.reg_no}:`, err);
    }
  }

  if (count === 0) {
    alert('No screenshot files could be downloaded.');
    return;
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const taskSlug = currentTask ? currentTask.title.replace(/[^a-zA-Z0-9]/g, '_') : 'Task';
  saveAs(content, `Proofs_${taskSlug}.zip`);
  showToast(`✅ Successfully downloaded ${count} proofs in ZIP!`);
}

// 9. Screenshot Modal Lightbox
function openScreenshotModal(student, sub) {
  document.getElementById('modalStudentTitle').textContent = `${student.name} (${student.reg_no})`;
  document.getElementById('modalStudentMeta').textContent = `${student.department} - Section ${student.section}`;
  document.getElementById('lightboxImg').src = sub.screenshot_url;
  document.getElementById('lightboxNotes').textContent = sub.notes ? `Remarks: "${sub.notes}"` : '';
  document.getElementById('lightboxTimestamp').textContent = `Submitted: ${new Date(sub.submitted_at).toLocaleString()}`;
  document.getElementById('btnDownloadSingleImg').href = sub.screenshot_url;
  document.getElementById('screenshotModal').classList.add('active');
}

function closeScreenshotModal() {
  document.getElementById('screenshotModal').classList.remove('active');
}

// 10. New Task Modal Handlers
function openNewTaskModal() {
  document.getElementById('newTaskModal').classList.add('active');
}

function closeNewTaskModal() {
  document.getElementById('newTaskModal').classList.remove('active');
}

async function handleCreateNewTask(e) {
  e.preventDefault();
  const title = document.getElementById('taskTitleInput').value.trim();
  const description = document.getElementById('taskDescInput').value.trim();
  const deadline = document.getElementById('taskDeadlineInput').value;
  const is_active = document.getElementById('taskSetActiveCheckbox').checked;

  if (!title) {
    alert('Please enter a task title.');
    return;
  }

  try {
    const created = await DataService.createTask({
      title,
      description,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      is_active
    });

    showToast('Task created successfully!');
    closeNewTaskModal();
    selectedTaskId = created.id;
    await loadDashboard();
  } catch (err) {
    alert('Failed to create task: ' + err.message);
  }
}

// 11. Student Roster Modal (CSV & Manual)
function openRosterModal() {
  document.getElementById('rosterModal').classList.add('active');
}

function closeRosterModal() {
  document.getElementById('rosterModal').classList.remove('active');
  pendingCsvStudents = [];
  document.getElementById('csvParsedPreview').style.display = 'none';
}

function downloadSampleCSV() {
  const sample = `reg_no,name,department,section,email\n717822P101,Aarav Sharma,CSE,A,aarav.sharma@college.edu\n717822P102,Abhinav Patel,CSE,A,abhinav.patel@college.edu\n717822P201,Harish Raghavan,CSE,B,harish.r@college.edu`;
  const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'student_roster_template.csv');
}

function handleCsvFileSelect(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    parseStudentCSV(text);
  };
  reader.readAsText(file);
}

function parseStudentCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    alert('CSV must contain a header row and at least one student row.');
    return;
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const regIdx = headers.indexOf('reg_no') >= 0 ? headers.indexOf('reg_no') : headers.indexOf('regno');
  const nameIdx = headers.indexOf('name');
  const deptIdx = headers.indexOf('department') >= 0 ? headers.indexOf('department') : headers.indexOf('dept');
  const secIdx = headers.indexOf('section') >= 0 ? headers.indexOf('section') : headers.indexOf('sec');
  const emailIdx = headers.indexOf('email');

  if (regIdx === -1 || nameIdx === -1 || deptIdx === -1 || secIdx === -1) {
    alert('CSV must contain columns: reg_no, name, department, section');
    return;
  }

  const students = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols[regIdx] && cols[nameIdx]) {
      students.push({
        reg_no: cols[regIdx].toUpperCase(),
        name: cols[nameIdx],
        department: cols[deptIdx] ? cols[deptIdx].toUpperCase() : 'GENERAL',
        section: cols[secIdx] ? cols[secIdx].toUpperCase() : 'A',
        email: emailIdx >= 0 && cols[emailIdx] ? cols[emailIdx] : ''
      });
    }
  }

  pendingCsvStudents = students;
  document.getElementById('csvCountMessage').textContent = `Parsed ${students.length} students from CSV. Ready to save!`;
  document.getElementById('csvParsedPreview').style.display = 'block';
}

async function commitRosterImport() {
  if (pendingCsvStudents.length === 0) return;
  try {
    await DataService.bulkInsertStudents(pendingCsvStudents);
    showToast(`Imported ${pendingCsvStudents.length} students into roster!`);
    closeRosterModal();
    await loadDashboard();
  } catch (err) {
    alert('Import failed: ' + err.message);
  }
}

async function handleManualStudentAdd(e) {
  e.preventDefault();
  const reg_no = document.getElementById('manRegNo').value.trim().toUpperCase();
  const name = document.getElementById('manName').value.trim();
  const department = document.getElementById('manDept').value.trim().toUpperCase();
  const section = document.getElementById('manSec').value.trim().toUpperCase();

  if (!reg_no || !name || !department || !section) {
    alert('Please fill all fields');
    return;
  }

  try {
    await DataService.bulkInsertStudents([{ reg_no, name, department, section }]);
    showToast(`Added ${name} (${reg_no})`);
    document.getElementById('addSingleStudentForm').reset();
    await loadDashboard();
  } catch (err) {
    alert('Failed to add student: ' + err.message);
  }
}

// 12. Attach All Event Listeners
function attachAdminEvents() {
  // Task selector change
  taskSelector.addEventListener('change', async (e) => {
    selectedTaskId = e.target.value;
    currentTask = allTasks.find(t => t.id === selectedTaskId);
    updateTaskHeader(currentTask);
    taskSubmissions = currentTask ? await DataService.getSubmissionsForTask(currentTask.id) : [];
    computeAnalytics();
    renderFilteredTable();
  });

  // Search filter
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.trim();
    renderFilteredTable();
  });

  // Section dropdown filter
  filterSectionSelect.addEventListener('change', (e) => {
    currentSectionFilter = e.target.value;
    computeAnalytics();
    renderFilteredTable();
  });

  // Department dropdown filter
  filterDeptSelect.addEventListener('change', (e) => {
    currentDeptFilter = e.target.value;
    computeAnalytics();
    renderFilteredTable();
  });

  // Filter Status Tabs
  document.querySelectorAll('.filter-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentStatusFilter = btn.getAttribute('data-status');
      renderFilteredTable();
    });
  });

  // Action Buttons
  document.getElementById('btnCopyWhatsAppPending').addEventListener('click', openPendingCopyDialog);
  document.getElementById('btnExportCSV').addEventListener('click', exportCSVReport);
  document.getElementById('btnDownloadZip').addEventListener('click', downloadProofsZip);
  document.getElementById('btnNewTask').addEventListener('click', openNewTaskModal);
  document.getElementById('btnManageStudents').addEventListener('click', openRosterModal);
  document.getElementById('btnOpenConfigAdmin').addEventListener('click', openConfigModal);

  // New Task Form
  document.getElementById('newTaskForm').addEventListener('submit', handleCreateNewTask);

  // CSV Dropzone
  const csvDrop = document.getElementById('csvDropzone');
  const csvInput = document.getElementById('csvFileInput');
  csvDrop.addEventListener('click', () => csvInput.click());
  csvInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleCsvFileSelect(e.target.files[0]);
    }
  });

  document.getElementById('btnCommitImport').addEventListener('click', commitRosterImport);
  document.getElementById('addSingleStudentForm').addEventListener('submit', handleManualStudentAdd);
}

// 13. Toast Notification Helper
function showToast(message, isError = false) {
  const toast = document.getElementById('toastNotification');
  toast.textContent = message;
  toast.className = `toast ${isError ? 'error' : 'success'} show`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
