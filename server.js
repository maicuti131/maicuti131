const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Load file tĩnh
app.use(express.static(path.join(__dirname, 'views')));
app.use('/css', express.static(path.join(__dirname, 'views/css')));

// Giả lập tài khoản lưu trong RAM
const users = {
  'mai': '1234',
  'admin': 'admin123'
};

// Trang đăng nhập
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/login.html'));
});

// Trang đăng ký
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/register.html'));
});

// Xử lý đăng ký
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.send('Tài khoản đã tồn tại òi 😭 <a href="/register">Thử lại</a>');
  }
  users[username] = password;
  res.send(`<h2>Đăng ký thành công 💖</h2><a href="/">Quay về đăng nhập</a>`);
});

// Xử lý đăng nhập
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    res.cookie('user', username, { httpOnly: true });
    res.redirect('/welcome');
  } else {
    res.send('Sai tài khoản hoặc mật khẩu 😭 <a href="/">Thử lại</a>');
  }
});

// Trang welcome
app.get('/welcome', (req, res) => {
  const user = req.cookies.user;
  if (!user) return res.redirect('/');
  let html = fs.readFileSync(path.join(__dirname, 'views/welcome.html'), 'utf-8');
  html = html.replace('{{username}}', user);
  res.send(html);
});

// Đăng xuất
app.get('/logout', (req, res) => {
  res.clearCookie('user');
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mai login web chạy tại http://localhost:${PORT}`);
});
