const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');

const app = express();
const saltRounds = 10;

// Giả lập database (sau có thể thay MongoDB, MySQL, v.v.)
const users = {
  'mai': '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4Lp3M/OSLJ9QRa5YQQr6WQJAlL6e',  // 1234
  'admin': '$2a$10$J7aYrQ6eE98JYVhOqjQZ.eqbY3uD5L3sLJYrA0XqX9XJtW6X1X1XK' // admin123
};

// Middleware
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 🔧 Hàm đọc file + chèn lỗi vào HTML
function renderWithError(filePath, errorHtml = '') {
  let html = '';
  try {
    html = fs.readFileSync(filePath, 'utf-8');
    html = html.replace('{{error}}', errorHtml || '');
  } catch {
    html = `<h1>Trang bị lỗi 😢</h1>`;
  }
  return html;
}

// GET: Trang login
app.get('/login', (req, res) => {
  const html = renderWithError(path.join(__dirname, 'public/login.html'));
  res.send(html);
});

// POST: Xử lý đăng nhập
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const filePath = path.join(__dirname, 'public/login.html');

  if (!username || !password) {
    return res.status(400).send(renderWithError(filePath, '<div class="alert error">Vui lòng nhập đầy đủ thông tin</div>'));
  }

  const hashed = users[username];
  const isMatch = hashed && await bcrypt.compare(password, hashed);

  if (!isMatch) {
    return res.status(401).send(renderWithError(filePath, '<div class="alert error">Sai tài khoản hoặc mật khẩu 😭</div>'));
  }

  res.cookie('user', username, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });
  res.redirect('/welcome');
});

// GET: Trang đăng ký
app.get('/register', (req, res) => {
  const html = renderWithError(path.join(__dirname, 'public/register.html'));
  res.send(html);
});

// POST: Xử lý đăng ký
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const filePath = path.join(__dirname, 'public/register.html');

  if (!username || !password) {
    return res.status(400).send(renderWithError(filePath, '<div class="alert error">Vui lòng nhập đầy đủ thông tin</div>'));
  }

  if (users[username]) {
    return res.status(409).send(renderWithError(filePath, '<div class="alert error">Tên tài khoản đã tồn tại 😥</div>'));
  }

  const hash = await bcrypt.hash(password, saltRounds);
  users[username] = hash;
  res.redirect('/login');
});

// GET: Trang welcome
app.get('/welcome', (req, res) => {
  const user = req.cookies.user;
  if (!user) return res.redirect('/login');

  const filePath = path.join(__dirname, 'public/welcome.html');
  let html = renderWithError(filePath).replace('{{username}}', user);
  res.send(html);
});

// GET: Logout
app.get('/logout', (req, res) => {
  res.clearCookie('user');
  res.redirect('/login');
});

// Fallback 404
app.use((req, res) => {
  try {
    res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
  } catch {
    res.status(404).send('<h1>404 - Không tìm thấy trang 😵</h1>');
  }
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
