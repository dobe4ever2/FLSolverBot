// src/services/gemini.service.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini client
if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY is not set!');
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const temperature = 0;
// const systemInstruction = `Identify the cards in the user's screenshot. Then output the final solution in text format. I.e.: AS KS QS JS TS 9S 8H 7H 6C 5C 4C 3C 2C AD. Where S is for spades, H is for hearts, and so on. Enclose the final solution in triple backticks (\`\`\`)`;

const systemInstruction = `You will be analyzing a screenshot of a poker app that shows several playing cards in a row. These cards use 4 colors: Green for clubs, blue for diamonds, red for hearts, and black for spades. Your task is to identify each card's rank and suit, then output them in standard poker notation. Instructions: First, carefully identify each card by writing out the rank, color and suit of one card at a time, starting from the first card on the left. E.g., '1. 10, green, clubs. 2. Q, green, clubs. 3. Q, black, spades. And so on...' Then return the final result formatted as standard poker notation to represent each card like this: e.g., AS for Ace of Spades, KH for King of Hearts, etc, cards separated by single spaces and all enclosed in triple backticks.`;

/**
 * Identifies cards from an image buffer using Gemini Vision.
 * @param {Buffer} imageBuffer The image data as a buffer.
 * @returns {Promise<string|null>} A string of card codes, or null if parsing fails.
 */
/**
 * Identify cards using a specified Gemini model.
 * @param {Buffer} imageBuffer
 * @param {string} modelName - e.g. 'gemini-2.5-pro' or 'gemini-2.5-flash'
 */
async function identifyCardsFromImage(imageBuffer, modelName = 'gemini-2.5-pro') {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = {
            contents: [{
                role: 'user',
                parts: [{
                    inlineData: {
                        mimeType: 'image/jpeg', // Assuming jpeg, but Gemini is flexible
                        data: imageBuffer.toString("base64"),
                    },
                }],
            }],
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
            generationConfig: {
                temperature: temperature, // You can also just write `temperature,`
            }
        };

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return responseText;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get a valid response from the vision model.");
    }
}

module.exports = { identifyCardsFromImage };
