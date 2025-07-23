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
const commandsPath = path.join(__dirname, 'commands');

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

client.login(process.env.TOKEN);
