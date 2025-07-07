const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/video-sharing-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Models
const User = require('./models/User');
const Video = require('./models/Video');
const Report = require('./models/Report');
const LiveStream = require('./models/LiveStream');

// Middleware xác thực
const auth = require('./middleware/auth');

// Cấu hình Multer cho upload video
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate
    if (!username || !email || !password) {
      return res.status(400).json({ msg: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'Email đã tồn tại' });
    
    // Hash password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create user
    const newUser = new User({
      username,
      email,
      password: passwordHash,
      role: 'user',
      status: 'active'
    });
    
    const savedUser = await newUser.save();
    res.json(savedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate
    if (!email || !password) {
      return res.status(400).json({ msg: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    // Check user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Tài khoản không tồn tại' });
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Mật khẩu không đúng' });
    
    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret');
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload video
app.post('/api/videos', auth, upload.single('video'), async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const videoPath = req.file.path;
    
    const newVideo = new Video({
      title,
      description,
      tags,
      videoUrl: videoPath,
      user: req.user.id,
      status: 'public'
    });
    
    const savedVideo = await newVideo.save();
    res.json(savedVideo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all videos
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find({ status: 'public' })
      .populate('user', 'username')
      .sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search videos
app.get('/api/videos/search', async (req, res) => {
  try {
    const { query } = req.query;
    const videos = await Video.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ],
      status: 'public'
    }).populate('user', 'username');
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like video
app.post('/api/videos/:id/like', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ msg: 'Video không tồn tại' });
    
    // Check if already liked
    if (video.likes.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Bạn đã like video này' });
    }
    
    video.likes.push(req.user.id);
    await video.save();
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comment on video
app.post('/api/videos/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ msg: 'Video không tồn tại' });
    
    const newComment = {
      text,
      user: req.user.id
    };
    
    video.comments.push(newComment);
    await video.save();
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Report video
app.post('/api/videos/:id/report', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ msg: 'Video không tồn tại' });
    
    const newReport = new Report({
      video: req.params.id,
      reporter: req.user.id,
      reason,
      status: 'pending'
    });
    
    await newReport.save();
    res.json(newReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start live stream
app.post('/api/live/start', auth, async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const newLiveStream = new LiveStream({
      title,
      description,
      streamer: req.user.id,
      status: 'live',
      streamKey: `live_${Date.now()}_${req.user.id}`
    });
    
    await newLiveStream.save();
    res.json(newLiveStream);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
