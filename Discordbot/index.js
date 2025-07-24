require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Keep-alive web server để Render không cho sleep
const app = express();
app.get('/', (req, res) => res.send('Bot đang chạy nè!'));
app.listen(process.env.PORT || 3000, () => {
  console.log('✅ Web server đã chạy để giữ bot sống.');
});

// Slash command loader
client.commands = new Collection();

// Đường dẫn tới thư mục lệnh
const commandsPath = path.join(__dirname, 'Commands');

// Lọc tất cả file .js trong thư mục "commands"
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  // Kiểm tra command có đúng định dạng không
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[⚠️] Lệnh ở ${file} không có định dạng hợp lệ.`);
  }
}

// Khi bot online
client.once('ready', () => {
  console.log(`✅ Bot đã online dưới tên ${client.user.tag}`);
});

// Xử lý slash command
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Có lỗi xảy ra khi xử lý lệnh 😢', ephemeral: true });
  }
});

// Xử lý lệnh tiền tố (!)
client.on('messageCreate', message => {
  if (message.content === '!ping') {
    message.reply('Pong!');
  }
});
// !avatar
if (command === 'avatar') {
  const user = message.mentions.users.first() || message.author;
  message.reply(user.displayAvatarURL({ dynamic: true, size: 1024 }));
}

// !ban
if (command === 'ban') {
  if (!message.member.permissions.has('BanMembers')) return message.reply("Không có quyền ban người khác.");
  const member = message.mentions.members.first();
  if (!member) return message.reply("Tag người cần ban!");
  if (!member.bannable) return message.reply("Không thể ban người này.");

  await member.ban();
  message.channel.send(`🔨 Đã ban ${member.user.tag}`);
}

// !unban
if (command === 'unban') {
  if (!message.member.permissions.has('BanMembers')) return message.reply("Không có quyền unban.");
  const userId = args[0];
  if (!userId) return message.reply("Nhập ID người cần unban.");

  try {
    await message.guild.members.unban(userId);
    message.channel.send(`♻️ Đã unban người dùng có ID: ${userId}`);
  } catch (e) {
    message.reply("Không tìm thấy người dùng hoặc lỗi khi unban.");
  }
}

// !uptime
if (command === 'uptime') {
  const totalSeconds = Math.floor(process.uptime());
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  message.reply(`⏱ Bot đã online: ${hours}h ${minutes}m ${seconds}s`);
}

// !emoji
if (command === 'emoji') {
  const cuteEmojis = ['😺', '✨', '🍓', '🌸', '🥺', '🐣', '💫', '🌈', '🎀', '💖'];
  const emoji = cuteEmojis[Math.floor(Math.random() * cuteEmojis.length)];
  message.reply(emoji);
}

// !sayembed <msg>
if (command === 'sayembed') {
  const content = args.join(" ");
  if (!content) return message.reply("Gõ nội dung để gửi trong embed đi bà.");

  message.channel.send({
    embeds: [{
      title: "📢 Lời nhắn từ người bí ẩn",
      description: content,
      color: 0xFFC0CB
    }]
  });
}

// !dailyfact
if (command === 'dailyfact') {
  const facts = [
    "🌙 Mặt trăng đang dần rời xa Trái Đất ~3.8cm mỗi năm!",
    "🐙 Bạch tuộc có 3 trái tim và máu màu xanh!",
    "🔥 Trái tim con tôm đặt trong... đầu nó.",
    "🍌 Chuối là quả mọc từ cỏ lớn chứ không phải cây!",
    "🧠 Não con người tiêu tốn ~20% năng lượng mỗi ngày.",
  ];
  const fact = facts[Math.floor(Math.random() * facts.length)];
  message.reply(fact);
}

// !8ball <câu hỏi>
if (command === '8ball') {
  if (!args[0]) return message.reply("Hỏi gì đi rồi tui bói cho 😆");

  const replies = ['Có chứ!', 'Không nha!', 'Tui hong chắc...', 'Hỏi cái khác đi.', 'Đương nhiên rồi!', 'Hông đâu!', 'Có thể lắm á~'];
  const answer = replies[Math.floor(Math.random() * replies.length)];
  message.reply(`🎱 ${answer}`);
}

client.login(process.env.TOKEN);
