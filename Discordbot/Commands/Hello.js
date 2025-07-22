const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Chào bot 👋'),
  async execute(interaction) {
    await interaction.reply('Chào bạn nha! ✨');
  },
};
