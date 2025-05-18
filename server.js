const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');

const app = express();
const saltRounds = 10;

// Database tạm
const users = {
  'mai': '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4Lp3M/OSLJ9QRa5YQQr6WQJAlL6e', // 1234
  'admin': '$2a$10$J7aYrQ6eE98JYVhOqjQZ.eqbY3uD5L3sLJYrA0XqX9XJtW6X1X1XK' // admin123
};

// Middleware
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'views'))); // Static file từ thư mục views

// Route trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/login.html'));
});

// Trang login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/login.html'));
});

// Xử lý login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let html = fs.readFileSync(path.join(__dirname, 'views/login.html'), 'utf-8');

  if (!username || !password) {
    html = html.replace('{{error}}', '<div class="alert error">Nhập đủ thông tin nhen 😢</div>');
    return res.status(400).send(html);
  }

  if (users[username]) {
    const match = await bcrypt.compare(password, users[username]);
    if (match) {
      res.cookie('user', username, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400000 // 1 ngày
      });
      return res.redirect('/welcome');
    }
  }

  html = html.replace('{{error}}', '<div class="alert error">Sai tài khoản hoặc mật khẩu 😭</div>');
  res.status(401).send(html);
});

// Trang đăng ký
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/register.html'));
});

// Xử lý đăng ký
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  let html = fs.readFileSync(path.join(__dirname, 'views/register.html'), 'utf-8');

  if (!username || !password) {
    html = html.replace('{{error}}', '<div class="alert error">Vui lòng nhập đầy đủ nha 🥺</div>');
    return res.status(400).send(html);
  }

  if (users[username]) {
    html = html.replace('{{error}}', '<div class="alert error">Tài khoản đã tồn tại 😥</div>');
    return res.status(409).send(html);
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);
  users[username] = hashedPassword;
  res.redirect('/login');
});

// Welcome (đã login)
app.get('/welcome', (req, res) => {
  const user = req.cookies.user;
  if (!user) return res.redirect('/login');

  fs.readFile(path.join(__dirname, 'views/welcome.html'), 'utf-8', (err, html) => {
    if (err) return res.status(500).sendFile(path.join(__dirname, 'views/500.html'));
    html = html.replace('{{username}}', user);
    res.send(html);
  });
});

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('user');
  res.redirect('/login');
});

// Trang 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views/404.html'));
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server login của Mai cuti chạy tại http://localhost:${PORT}`);
});
