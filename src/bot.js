// src/bot.js

const TelegramBot = require('node-telegram-bot-api');

const geminiService = require('./ai-services/gemini.service.js');
const mistralService = require('./ai-services/mistral.service.js');
const { processSolverResponse } = require('./solvers/fantasysolver.js');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("Error: TELEGRAM_BOT_TOKEN is not set!");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// AI model configurations
const aiConfigurations = {
    gemini: {
        pro_25: 'gemini-2.5-pro',
        flash_latest: 'gemini-flash-latest'
    },
    mistral: {
        small: 'mistral-small-latest',
        large: 'mistral-large-latest'
    }
};

let currentService = 'gemini';
let currentModel = aiConfigurations.gemini.flash_latest;

// /start
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, `Hello! �\n\nSend me a screenshot and I'll process it using the currently selected AI model.\n\nCurrent service: ${currentService} (${currentModel})`);
});

// Commands to switch models
bot.onText(/\/gemini_pro_25/, (msg) => {
    currentService = 'gemini';
    currentModel = aiConfigurations.gemini.pro_25;
    bot.sendMessage(msg.chat.id, 'Switched to Gemini 2.5 Pro');
});
bot.onText(/\/gemini_flash_latest/, (msg) => {
    currentService = 'gemini';
    currentModel = aiConfigurations.gemini.flash_latest;
    bot.sendMessage(msg.chat.id, 'Switched to Gemini Flash Latest');
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

    // Restrict usage to the owner only
    const OWNER_ID = 548104065;
    if (!msg.from || msg.from.id !== OWNER_ID) {
        // Notify owner and forward the incoming message for review
        const senderInfo = msg.from ? `${msg.from.username || msg.from.first_name || ''} (${msg.from.id})` : `unknown (${msg.chat.id})`;
        try {
            await bot.sendMessage(OWNER_ID, `Unauthorized access attempt by ${senderInfo}`);
            await bot.forwardMessage(OWNER_ID, msg.chat.id, msg.message_id);
        } catch (notifyErr) {
            console.error('Failed to notify owner about unauthorized access:', notifyErr);
        }
        return;
    }

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

console.log('🚀 FL Solver Bot running');
