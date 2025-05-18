const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const helmet = require('helmet');

const app = express();
const saltRounds = 10;

// Database mẫu (trong thực tế nên dùng database thật)
const users = {
  'mai': '$2b$10$EXAMPLEHASHEDPASSWORD', // Mật khẩu "1234" đã được hash
  'admin': '$2b$10$EXAMPLEADMINHASHEDPASSWORD' // Mật khẩu "admin123" đã được hash
};

// Middleware bảo mật
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'views'))); // Phục vụ file tĩnh từ thư mục views

// Route chính
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/login.html')); // Mặc định hiển thị trang login
});

// Route cho trang login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/login.html'));
});

// Xử lý đăng nhập
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    let html = fs.readFileSync(path.join(__dirname, 'views/login.html'), 'utf-8');

    if (!username || !password) {
      html = html.replace('{{error}}', 'Vui lòng nhập đầy đủ thông tin');
      return res.status(400).send(html);
    }

    if (users[username]) {
      const match = await bcrypt.compare(password, users[username]);
      if (match) {
        res.cookie('user', username, { 
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000 // 1 ngày
        });
        return res.redirect('/welcome');
      }
    }

    html = html.replace('{{error}}', 'Sai tài khoản hoặc mật khẩu 😭');
    res.status(401).send(html);
  } catch (error) {
    console.error(error);
    res.status(500).send('Đã xảy ra lỗi server');
  }
});

// Route cho trang đăng ký
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/register.html'));
});

// Xử lý đăng ký
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    let html = fs.readFileSync(path.join(__dirname, 'views/register.html'), 'utf-8');

    if (!username || !password) {
      html = html.replace('{{error}}', 'Vui lòng nhập đầy đủ thông tin');
      return res.status(400).send(html);
    }

    if (users[username]) {
      html = html.replace('{{error}}', 'Tên tài khoản đã tồn tại 😥');
      return res.status(409).send(html);
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    users[username] = hashedPassword;
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.status(500).send('Đã xảy ra lỗi server');
  }
});

// Route welcome (yêu cầu đăng nhập)
app.get('/welcome', (req, res) => {
  if (!req.cookies.user) return res.redirect('/login');

  fs.readFile(path.join(__dirname, 'views/welcome.html'), 'utf-8', (err, html) => {
    if (err) return res.status(500).send('Lỗi đọc file');
    html = html.replace('{{username}}', req.cookies.user);
    res.send(html);
  });
});

// Route logout
app.get('/logout', (req, res) => {
  res.clearCookie('user');
  res.redirect('/login');
});

// Xử lý 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views/404.html'));
});

// Khởi động server
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));
