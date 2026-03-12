const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Admin Credentials from Environment
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'kadapa@2024';

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve frontend

// ─── Database ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kadapadb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ─── Schemas ──────────────────────────────────────────────────────────────────
const complaintSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  department: String,
  name: String,
  phone: String,
  email: String,
  mandal: String,
  village: String,
  pin: String,
  subject: String,
  desc: String,
  photos: [String],
  status: { type: String, enum: ['Registered', 'In Progress', 'Resolved'], default: 'Registered' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // In production, use bcrypt to hash this!
  createdAt: { type: Date, default: Date.now }
});

const announcementSchema = new mongoose.Schema({
  title: String,
  body: String,
  category: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Complaint = mongoose.model('Complaint', complaintSchema);
const Announcement = mongoose.model('Announcement', announcementSchema);

// ─── Utilities ────────────────────────────────────────────────────────────────
function generateComplaintId() {
  const ts = Date.now().toString().slice(-6);
  const rand = crypto.randomInt(100, 999);
  return `KDP-${ts}-${rand}`;
}

// ─── Routes: Complaints ───────────────────────────────────────────────────────
// Create complaint
app.post('/api/complaints', async (req, res) => {
  try {
    const id = generateComplaintId();
    const complaint = new Complaint({ ...req.body, id });
    await complaint.save();
    res.status(201).json({ success: true, id, message: 'Complaint registered successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Track complaint by ID
app.get('/api/complaints/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ id: req.params.id.toUpperCase() });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all complaints (admin)
app.get('/api/complaints', async (req, res) => {
  try {
    const { department, status, search } = req.query;
    let filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) filter.$or = [{ id: new RegExp(search, 'i') }, { name: new RegExp(search, 'i') }];
    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update status (admin)
app.patch('/api/complaints/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findOneAndUpdate(
      { id: req.params.id.toUpperCase() },
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stats
app.get('/api/stats', async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const registered = await Complaint.countDocuments({ status: 'Registered' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const byDept = await Complaint.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }]);
    res.json({ success: true, total, registered, inProgress, resolved, byDept });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Routes: Announcements ────────────────────────────────────────────────────
app.post('/api/announcements', async (req, res) => {
  try {
    const ann = new Announcement(req.body);
    await ann.save();
    res.status(201).json({ success: true, announcement: ann });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/announcements/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Routes: Authentication ──────────────────────────────────────────────────
// Citizen Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    const existing = await User.findOne({ phone });
    if (existing) return res.status(400).json({ success: false, message: 'Phone number already registered.' });
    
    const user = new User({ name, phone, password });
    await user.save();
    res.status(201).json({ success: true, message: 'Account created!', user: { name, phone } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Citizen Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone, password });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid phone or password.' });
    res.json({ success: true, user: { name: user.name, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Login
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      res.json({ success: true, token: 'admin-session-secure' });
    } else {
      res.status(401).json({ success: false, message: 'Unauthorized credentials.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Kadapa Portal Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin.html`);
});
