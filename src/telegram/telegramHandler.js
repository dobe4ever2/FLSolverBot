// // src/telegram/telegramHandler.js
// const TelegramBot = require('node-telegram-bot-api');

// const token = process.env.TELEGRAM_BOT_TOKEN;
// if (!token) {
//     console.error('Error: TELEGRAM_BOT_TOKEN is not set!');
//     process.exit(1);
// }
// const bot = new TelegramBot(token, { polling: true });

// /**
//  * Sends a message via Telegram.
//  * @param {number} chatId - The chat identifier.
//  * @param {string} text - The message text.
//  * @param {object} [options] - Additional Telegram options.
//  */
// function sendMessage(chatId, text, options = {}) {
//     bot.sendMessage(chatId, text, options);
// }

// module.exports = { bot, sendMessage };