// src/bot.js

const TelegramBot = require('node-telegram-bot-api');

const geminiService = require('./ai-services/gemini.service.js');

const { processSolverResponse } = require('./solvers/fantasysolver.js');

const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

// AI model configurations
const aiConfigurations = {
    gemini: {
        pro: 'gemini-2.5-pro',
        flash: 'gemini-flash-latest'
    }
};

let currentService = 'gemini';
let currentModel = aiConfigurations.gemini.flash;

// /start
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, `Hello! �\n\nSend me a screenshot and I'll process it using the currently selected AI model.\n\nCurrent service: ${currentService} (${currentModel})`);
});

// Commands to switch models
bot.onText(/\/gemini_pro/, (msg) => {
    currentService = 'gemini';
    currentModel = aiConfigurations.gemini.pro;
    bot.sendMessage(msg.chat.id, 'Switched to Gemini 2.5 Pro');
});
bot.onText(/\/gemini_flash/, (msg) => {
    currentService = 'gemini';
    currentModel = aiConfigurations.gemini.flash;
    bot.sendMessage(msg.chat.id, 'Switched to Gemini 2.5 Flash');
});

// Photo handler
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    try {
        bot.sendChatAction(chatId, 'typing');

        // Get highest resolution photo
        const photo = msg.photo[msg.photo.length - 1];
        const fileStream = await bot.getFileStream(photo.file_id);
        const chunks = [];
        for await (const chunk of fileStream) chunks.push(chunk);
        const imageBuffer = Buffer.concat(chunks);

        let rawResponse;
        if (currentService === 'gemini') {
            rawResponse = await geminiService.identifyCardsFromImage(imageBuffer, currentModel);
        } else {
            throw new Error('Unknown AI service selected');
        }

        // Delegate extraction, parsing, solving & formatting to fantasysolver
        const finalMessage = processSolverResponse(rawResponse);
        bot.sendMessage(chatId, finalMessage, { parse_mode: 'Markdown' });

    } catch (err) {
        console.error('Photo handler error:', err);
        bot.sendMessage(chatId, `Error: ${err.message}`);
    }
});

console.log('🚀 FL Solver Bot running');
