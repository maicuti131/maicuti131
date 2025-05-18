const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('views'));

const users = {
  'mai': '1234',
  'admin': 'admin123'
};

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    res.cookie('user', username, { httpOnly: true });
    res.redirect('/welcome');
  } else {
    res.send('Sai tài khoản hoặc mật khẩu 😭');
  }
});

app.get('/welcome', (req, res) => {
  const user = req.cookies.user;
  if (!user) return res.redirect('/login.html');

  // Simple way: Inject username into HTML (chưa dùng template engine)
  const fs = require('fs');
  let html = fs.readFileSync(path.join(__dirname, 'views/welcome.html'), 'utf-8');
  html = html.replace('{{username}}', user);
  res.send(html);
});

app.listen(3000, () => console.log('Trang login của Mai cuti chạy ở http://localhost:3000'));
