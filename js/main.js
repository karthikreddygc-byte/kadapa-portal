/* Kadapa Smart District Portal - Main JS */

// =============================================
// Language Toggle
// =============================================
const translations = {
  en: {
    "hero-title": "Empowering Citizens Through Digital Governance",
    "hero-sub": "Experience seamless access to government services, district information, and interactive grievance redressal system.",
    "submit-grievance": "Submit Grievance",
    "explore-services": "Explore Services",
  },
  te: {
    "hero-title": "డిజిటల్ పాలన ద్వారా పౌరులను సాధికారత చేయడం",
    "hero-sub": "ప్రభుత్వ సేవలు, జిల్లా సమాచారం మరియు ఫిర్యాదు నివారణ వ్యవస్థకు అవరోధ రహిత యాక్సెస్ అనుభవించండి.",
    "submit-grievance": "ఫిర్యాదు సమర్పించండి",
    "explore-services": "సేవలు అన్వేషించండి",
  }
};

let currentLang = localStorage.getItem('kadapa_lang') || 'en';

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('kadapa_lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
  });
  applyLanguage(currentLang);

  // ─── Shared State ─────────────────────────────────────────────────────────────
function getLoggedInUser() {
    const user = localStorage.getItem('kdp_user');
    return user ? JSON.parse(user) : null;
}

function logout() {
    localStorage.removeItem('kdp_user');
    window.location.href = 'login.html';
}

function checkAuth() {
    if (!getLoggedInUser()) {
        alert('Please login to access this page.');
        window.location.href = 'login.html';
    }
}

// ─── Accessibility: Font Resizer ──────────────────────────────────────────────
  let fontSize = parseInt(localStorage.getItem('kadapa_fs') || 16);
  document.documentElement.style.fontSize = fontSize + 'px';
  document.querySelector('#btn-font-dec')?.addEventListener('click', () => {
    fontSize = Math.max(12, fontSize - 2);
    document.documentElement.style.fontSize = fontSize + 'px';
    localStorage.setItem('kadapa_fs', fontSize);
  });
  document.querySelector('#btn-font-reset')?.addEventListener('click', () => {
    fontSize = 16;
    document.documentElement.style.fontSize = '16px';
    localStorage.setItem('kadapa_fs', 16);
  });
  document.querySelector('#btn-font-inc')?.addEventListener('click', () => {
    fontSize = Math.min(24, fontSize + 2);
    document.documentElement.style.fontSize = fontSize + 'px';
    localStorage.setItem('kadapa_fs', fontSize);
  });

  // Scroll-reveal animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Sticky navbar shadow
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (nav) {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }
  });

  // Active nav link highlight
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href === currentPage) {
      link.classList.add('active');
    }
  });

  // Animate numbers in stats
  document.querySelectorAll('.count-up').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const isFloat = el.dataset.float === 'true';
    const suffix = el.dataset.suffix || '';
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = isFloat ? current.toFixed(1) + suffix : Math.floor(current) + suffix;
      if (current >= target) clearInterval(timer);
    }, 25);
  });
});

// =============================================
// Complaint Utilities
// =============================================
// =============================================
// Complaint Utilities (API with local fallback)
// =============================================
const API_BASE = '/api'; // Use relative path for all environments

async function checkApi() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch (e) { return false; }
}

function generateComplaintId() {
  const prefix = 'KDP';
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${ts}-${rand}`;
}

async function saveComplaint(data) {
  try {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) return result;
  } catch (e) { console.warn('API error, falling back to local storage', e); }

  const complaints = JSON.parse(localStorage.getItem('kadapa_complaints') || '[]');
  complaints.unshift(data);
  localStorage.setItem('kadapa_complaints', JSON.stringify(complaints));
  return { success: true, id: data.id };
}

async function getComplaintById(id) {
  try {
    const res = await fetch(`${API_BASE}/complaints/${id}`);
    const result = await res.json();
    if (result.success) return result.complaint;
  } catch (e) { console.warn('API error, checking local storage'); }

  const complaints = JSON.parse(localStorage.getItem('kadapa_complaints') || '[]');
  return complaints.find(c => c.id === id) || null;
}

async function getAllComplaints(filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/complaints?${query}`);
    const result = await res.json();
    if (result.success) return result.complaints;
  } catch (e) { console.warn('API error, using local storage'); }

  let complaints = JSON.parse(localStorage.getItem('kadapa_complaints') || '[]');
  if (filters.department) complaints = complaints.filter(c => c.department === filters.department);
  if (filters.status) complaints = complaints.filter(c => c.status === filters.status);
  return complaints;
}

async function updateComplaintStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const result = await res.json();
    if (result.success) return true;
  } catch (e) { console.warn('API error, updating local storage'); }

  const complaints = JSON.parse(localStorage.getItem('kadapa_complaints') || '[]');
  const idx = complaints.findIndex(c => c.id === id);
  if (idx !== -1) {
    complaints[idx].status = status;
    complaints[idx].updatedAt = new Date().toISOString();
    localStorage.setItem('kadapa_complaints', JSON.stringify(complaints));
    return true;
  }
  return false;
}

async function getStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    const result = await res.json();
    if (result.success) return result;
  } catch (e) { console.warn('API error, calculating from local storage'); }

  const all = JSON.parse(localStorage.getItem('kadapa_complaints') || '[]');
  return {
    total: all.length,
    registered: all.filter(c => c.status === 'Registered').length,
    inProgress: all.filter(c => c.status === 'In Progress').length,
    resolved: all.filter(c => c.status === 'Resolved').length
  };
}

// Announcements API
async function saveAnnouncement(data) {
  try {
    const res = await fetch(`${API_BASE}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (e) {
    const ann = JSON.parse(localStorage.getItem('kadapa_announcements') || '[]');
    ann.unshift(data);
    localStorage.setItem('kadapa_announcements', JSON.stringify(ann));
    return { success: true };
  }
}

async function getAnnouncements() {
  try {
    const res = await fetch(`${API_BASE}/announcements`);
    const result = await res.json();
    if (result.success) return result.announcements;
  } catch (e) { }
  return JSON.parse(localStorage.getItem('kadapa_announcements') || '[]');
}

async function deleteAnnouncement(id) {
  try {
    await fetch(`${API_BASE}/announcements/${id}`, { method: 'DELETE' });
    return true;
  } catch (e) { return false; }
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// =============================================
// District Data
// =============================================
const mandals = [
"Badvel","B.Kodur","Chakrayapet","Chapad","Chitvel","Duvvur",
"Galiveedu","Gopavaram","Jammalamadugu","Kadapa","Kamalapuram",
"Khajipet","Lakkireddipalle","Lingala","Mydukur","Muddanur",
"Nandalur","Pendlimarri","Proddutur","Pulivendla","Rajampet",
"Rayachoti","Sambepalle","Simhadripuram","Sidhout","Thirupathi",
"Vallur","Vempalle","Vontimitta","Yerraguntla","Proddatur",
"Kalasapadu","Kodur","Pullampet","Bramhamgarimatham","Chavaluru"
];

const departments = [
  { name: "Revenue", icon: "bi-briefcase", desc: "Land records, property tax, revenue issues.", color: "#4361ee" },
  { name: "Municipal", icon: "bi-buildings", desc: "Roads, drains, sanitation, water supply.", color: "#7209b7" },
  { name: "Electricity", icon: "bi-lightning-charge", desc: "Power outages, billing, new connections.", color: "#f7b731" },
  { name: "Water Supply", icon: "bi-droplet", desc: "Safe drinking water, leakage complaints.", color: "#0096c7" },
  { name: "Police", icon: "bi-shield-check", desc: "Law enforcement and safety concerns.", color: "#1d3461" },
  { name: "Health", icon: "bi-heart-pulse", desc: "Primary health, hospitals, vaccination.", color: "#d90429" },
  { name: "Education", icon: "bi-book", desc: "Schools, mid-day meals, scholarships.", color: "#26a96c" }
];
