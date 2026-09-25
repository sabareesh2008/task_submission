# 🎓 TaskDesk — College Task Submission & Verification Dashboard

A modern, high-speed, and minimalist **Task Submission Dashboard** built with **HTML5, CSS3, JavaScript (ES6+), and Supabase**.

Designed to solve the messy problem of collecting course registrations, aptitude test results, and proof screenshots from college students via WhatsApp groups and unorganized Google forms.

---

## 🌟 Key Features

### 1. 📱 Student Submission Portal (`index.html`)
* **Single Active Task Focus**: Students immediately see the assigned task instructions and deadline countdown.
* **Instant Auto-Fetch**: Student types their **Register Number** (e.g. `717822P101`). Name, Department, and Section auto-populate and lock within milliseconds from the database.
* **Proof Upload & Live Preview**: Drag-and-drop or select screenshots (PNG, JPG, WEBP) with instant client-side thumbnail preview.
* **Smart Duplicate Prevention**: Checks if the student already submitted and informs them if their new upload will update their previous proof.
* **Digital Receipt**: Instant submission confirmation with timestamp and student verification details.

### 2. 📊 Admin & Faculty Analytics Dashboard (`admin.html`)
* **Live KPI Stats**: Total enrolled students, submitted count, pending count, and overall completion percentages.
* **Section-Wise Performance Matrix**: Visual cards and progress bars for each section (e.g., `CSE - Sec A: 90%`, `CSE - Sec B: 63%`). Click any section card to immediately filter the table!
* **⚡ WhatsApp Pending List Generator**:
  * One-click **"📋 Copy Pending Roll Numbers"** formats all missing students into a clean, ready-to-paste WhatsApp reminder message for class groups.
* **Interactive Data Table**:
  * Search by Roll Number or Name.
  * Filter by Status (`All`, `Submitted`, `Pending`), Department, and Section.
* **Screenshot Lightbox**:
  * Click any student's screenshot thumbnail to inspect full-resolution image with student details and remarks.
* **Bulk Export Tools**:
  * 📊 **Export CSV / Excel**: Full report with Roll No, Name, Section, Timestamp, and Proof Links.
  * 📦 **Download Proofs (ZIP)**: Automatically bundles all submitted screenshot proofs into a neatly structured ZIP archive organized by department and section!
* **Roster Management**:
  * Upload student list via CSV in one click.
  * Download sample CSV template.
  * Add individual students manually.

---

## 🎨 Design Philosophy
* **White & Grey Aesthetic**: Clean Swiss/Nordic minimalist color family (`#ffffff`, `#f8fafc`, `#e2e8f0`, `#0f172a`).
* High contrast, legible typography using Inter font.
* Fully responsive across smartphones, tablets, and desktop displays.

---

## ⚡ Quick Start (Ready Out of the Box!)

The dashboard has an integrated **Demo / Local Engine**. You can double-click `index.html` or `admin.html` right now in your browser, and it will run immediately with pre-loaded sample students, active task, and submissions!

---

## ☁️ Connecting Your Supabase Cloud Backend

To connect to your own Supabase project:

### Step 1: Run the Database Schema
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** &rarr; Click **New query**.
3. Copy all the SQL code inside [`supabase_schema.sql`](supabase_schema.sql) and paste it into the editor.
4. Click **Run**. This creates:
   * `students` table
   * `tasks` table
   * `submissions` table
   * `proof-screenshots` storage bucket
   * Row Level Security (RLS) policies
   * Starter sample data

### Step 2: Connect the App
1. In your Supabase Dashboard, go to **Project Settings** &rarr; **API**.
2. Copy your **Project URL** and **Project API Key (anon/public)**.
3. Open either `index.html` or `admin.html` in your browser.
4. Click the **"⚙️ Database Settings"** button in the top navigation bar.
5. Paste your URL and Anon Key, then click **Save & Connect**.
6. The app will immediately switch to your live Supabase cloud database!

---

## 📁 Project Structure

```
├── index.html               # Student submission portal
├── admin.html               # Admin analytics & management dashboard
├── supabase_schema.sql      # Database schema & storage policies
├── css/
│   ├── style.css            # Master white & grey minimalist design system
│   └── admin.css            # Admin dashboard specific layout styles
├── js/
│   ├── mock-data.js         # Offline/demo storage engine & sample roster
│   ├── supabase-config.js   # Supabase client & unified data layer
│   ├── student-app.js       # Student form logic & auto-lookup
│   └── admin-app.js         # Admin KPIs, filters, ZIP/CSV exports
└── README.md                # Project documentation
```

---

## 🚀 Deployment

You can host this project 100% free with zero configuration on:
* **GitHub Pages**: Go to your repository **Settings** &rarr; **Pages** &rarr; Select branch `main` and folder `/ (root)` &rarr; Save!
* **Vercel** or **Netlify**: Simply link your GitHub repo or drag-and-drop this folder.
