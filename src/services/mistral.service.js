// src/services/mistral.service.js

const TelegramBot = require('node-telegram-bot-api');
const { Mistral } = require('@mistralai/mistralai');
const { performance } = require('perf_hooks');
const { solveOptimizedV2, parseCard } = require('../solver/solver.js');

// Initialize Telegram bot
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN is not set!');
    process.exit(1);
}

// Initialize Mistral client
const apiKey = process.env.MISTRAL_API_KEY;
if (!apiKey) {
    console.error('Error: MISTRAL_API_KEY is not set!');
    process.exit(1);
}

const client = new Mistral({ apiKey });
const bot = new TelegramBot(token, { polling: true });

// Simple start command handler
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Hello! Send me an image and I will analyze it using Mistral Vision API.');
});

/**
 * Formats a card string with a colored emoji for its suit.
 * @param {string} cardStr - e.g., "AS", "KH", "TD"
 * @returns {string} - e.g., "A♠️", "K❤️", "T🔷"
 */
function formatCardWithColor(cardStr) {
    if (!cardStr || cardStr.length < 2) return cardStr;
    const rank = cardStr.slice(0, -1);
    const suit = cardStr.slice(-1);
    switch (suit) {
        case '♠': return rank + '♠️';
        case '♥': return rank + '❤️';
        case '♦': return rank + '🔷';
        case '♣': return rank + '🟢';
        default: return cardStr;
    }
}

// --- Reusable Solver Function (copied/adapted from src/index.js) ---
async function runSolverAndReply(chatId, cardString) {
    try {
        const cardCodes = cardString.trim().split(/\s+/);
        const numCards = cardCodes.length;

        if (numCards < 14 || numCards > 17) {
            bot.sendMessage(chatId, `❌ *Error:* I found ${numCards} cards, but I can only solve for 14, 15, 16, or 17. Please try a clearer screenshot.`);
            return;
        }

        const parsedCards = cardCodes.map(parseCard);
        const invalidCards = parsedCards.filter(c => c === null);

        if (invalidCards.length > 0) {
            bot.sendMessage(chatId, `❌ *Error:* I couldn't understand some of the cards identified. The model might have made a mistake. Please try again.`);
            return;
        }

        const startTime = performance.now();
        const { best } = solveOptimizedV2(parsedCards);
        const endTime = performance.now();
        const solveTime = ((endTime - startTime) / 1000).toFixed(3);

        if (!best) {
            bot.sendMessage(chatId, "Couldn't find a valid arrangement. This is unexpected!");
            return;
        }

        const repeatText = best.isRepeat ? '✅ (Repeat Fantasyland EV)' : '';

        const frontFormatted = best.front.map(formatCardWithColor).join(' ');
        const middleFormatted = best.middle.map(formatCardWithColor).join(' ');
        const backFormatted = best.back.map(formatCardWithColor).join(' ');
        const discardsFormatted = best.discards.map(formatCardWithColor).join(' ');

        const resultMessage = `*Optimal Arrangement Found!*\n\n\`${frontFormatted}\`\n\`${middleFormatted}\`\n\`${backFormatted}\`\n\n*Discards:* \`${discardsFormatted}\`\n\n*Score:* ${best.finalEV.toFixed(2)} pts ${repeatText}\n*Time:* ${solveTime} seconds (solver)`;
        bot.sendMessage(chatId, resultMessage, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error("Solver Error:", error);
        bot.sendMessage(chatId, "An unexpected error occurred while solving. Please check the server logs.");
    }
}

// Photo handler
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;

    try {
        // Show "typing" status while processing
        bot.sendChatAction(chatId, 'typing');

        // Get the highest resolution photo
        const photo = msg.photo[msg.photo.length - 1];
        const fileStream = await bot.getFileStream(photo.file_id);

        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of fileStream) {
            chunks.push(chunk);
        }
        const imageBuffer = Buffer.concat(chunks);
        const base64Image = imageBuffer.toString('base64');

        // Call Mistral Vision API
        const response = await client.chat.complete({
            model: "mistral-small-latest",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "You will be analyzing a screenshot of a poker app that shows several playing cards in a row. These cards use 4 colors: Green for clubs, blue for diamonds, red for hearts, and black for spades. Your task is to identify each card's rank and suit, then output them in standard poker notation. Instructions: First, carefully identify each card by writing out the rank, color and suit of one card at a time, starting from the first card on the left. E.g., '1. 10, green, clubs. 2. Q, green, clubs. 3. Q, black, spades. And so on...' Then return the final result formatted as standard poker notation to represent each card like this: e.g., AS for Ace of Spades, KH for King of Hearts, etc, cards separated by single spaces and all enclosed in triple backticks."
                        },
                        {
                            type: "image_url",
                            imageUrl: `data:image/jpeg;base64,${base64Image}`
                        }
                    ]
                }
            ]
        });

        // Send the response back to user (but prefer to extract the triple-backtick block and pass to solver)
        const mistralResponse = response.choices[0].message.content;

        // Try to extract the content between triple backticks
        let extracted = null;
        if (typeof mistralResponse === 'string') {
            const match = mistralResponse.match(/```([\s\S]*?)```/);
            if (match && match[1]) extracted = match[1].trim();
        } else if (Array.isArray(mistralResponse)) {
            // Some SDKs return structured content; join if necessary
            const text = mistralResponse.map(c => (c.text || '')).join('\n');
            const match = text.match(/```([\s\S]*?)```/);
            if (match && match[1]) extracted = match[1].trim();
        }

        if (extracted) {
            // Pass the extracted card string to the solver flow
            await runSolverAndReply(chatId, extracted);
        } else {
            // Fallback: send the raw Mistral response so the user can see it
            await bot.sendMessage(chatId, `Mistral Vision API Response:\n\n${mistralResponse}`);
        }

    } catch (error) {
        console.error('Error:', error);
        await bot.sendMessage(chatId, 'Sorry, an error occurred while processing your image.');
    }
});

console.log('🔮 Mistral Vision Test Bot is running!');

// Handle polling errors
bot.on('polling_error', (error) => {
    console.error('Polling error:', error.code);
});