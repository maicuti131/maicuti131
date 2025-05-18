const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const users = {
  'mai': '1234',
  'admin': 'admin123'
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('views'));

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  let html = fs.readFileSync(path.join(__dirname, 'views/login.html'), 'utf-8');

  if (users[username] && users[username] === password) {
    res.cookie('user', username, { httpOnly: true });
    res.redirect('/welcome');
  } else {
    html = html.replace('{{error}}', 'Sai tài khoản hoặc mật khẩu 😭');
    res.send(html);
  }
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  let html = fs.readFileSync(path.join(__dirname, 'views/register.html'), 'utf-8');

  if (users[username]) {
    html = html.replace('{{error}}', 'Tên tài khoản đã tồn tại 😥');
    res.send(html);
  } else {
    users[username] = password;
    res.redirect('/login.html');
  }
});

app.get('/welcome', (req, res) => {
  const user = req.cookies.user;
  if (!user) return res.redirect('/login.html');

  let html = fs.readFileSync(path.join(__dirname, 'views/welcome.html'), 'utf-8');
  html = html.replace('{{username}}', user);
  res.send(html);
});

app.listen(3000, () => console.log('🚀 Trang login của Mai cuti chạy ở http://localhost:3000'));
