// src/bot.js

const TelegramBot = require('node-telegram-bot-api');

// ...Render fix...
const http = require('http');
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('FL Solver Bot is running!\n');
});

server.listen(PORT, () => {
    console.log(`🌐 HTTP server running on port ${PORT}`);
});
// ...Finish render fix...

const geminiService = require('./ai-services/gemini.service.js');
const mistralService = require('./ai-services/mistral.service.js');
const { processSolverResponse } = require('./solvers/fantasysolver.js');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN is not set!');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// AI model configurations
const aiConfigurations = {
    gemini: {
        pro: 'gemini-2.5-pro',
        flash: 'gemini-2.5-flash'
    },
    mistral: {
        small: 'mistral-small-latest',
        large: 'mistral-large-latest'
    }
};

let currentService = 'gemini';
let currentModel = aiConfigurations.gemini.pro;

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
bot.onText(/\/mistral_small/, (msg) => {
    currentService = 'mistral';
    currentModel = aiConfigurations.mistral.small;
    bot.sendMessage(msg.chat.id, 'Switched to Mistral Small');
});
bot.onText(/\/mistral_large/, (msg) => {
    currentService = 'mistral';
    currentModel = aiConfigurations.mistral.large;
    bot.sendMessage(msg.chat.id, 'Switched to Mistral Large');
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
        } else if (currentService === 'mistral') {
            rawResponse = await mistralService.identifyCardsFromImage(imageBuffer, currentModel);
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

// /solve command for testing raw AI text
bot.onText(/\/solve (.+)/, (msg, match) => {
    try {
        const raw = match[1];
        const finalMessage = processSolverResponse(raw);
        bot.sendMessage(msg.chat.id, finalMessage, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('/solve error:', err);
        bot.sendMessage(msg.chat.id, `Error: ${err.message}`);
    }
});

console.log('🚀 FL Solver Bot running (modular)');
