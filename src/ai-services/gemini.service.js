// src/ai-services/gemini.service.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini client
if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY is not set!');
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const temperature = 0;

const systemInstruction = `You are analyzing a screenshot of a poker app showing playing cards in a row.

STEP 1 - IDENTIFY EACH CARD:
List each card from left to right, writing out the full rank and suit in words.
Format: "1. [rank], [suit]. 2. [rank], [suit]." etc.

STEP 2 - CONVERT TO STANDARD NOTATION:
Use this exact notation system:
- RANKS: 2 3 4 5 6 7 8 9 T J Q K A
  (T = Ten, J = Jack, Q = Queen, K = King, A = Ace)
- SUITS: C D H S
  (C = Clubs, D = Diamonds, H = Hearts, S = Spades)

CRITICAL: 
- Ten is ALWAYS written as 'T', NEVER as '10'
- Each card is exactly 2 characters: rank + suit

STEP 3 - OUTPUT:
Provide all cards in a single line, separated by single spaces, enclosed in triple backticks.
Example: \`\`\`AS KH TC 9D\`\`\``;

/**
 * Identifies cards from an image buffer using Gemini Vision.
 * @param {Buffer} imageBuffer The image data as a buffer.
 * @returns {Promise<string|null>} A string of card codes, or null if parsing fails.
 */
/**
 * Identify cards using a specified Gemini model.
 * @param {Buffer} imageBuffer
 * @param {string} modelName - e.g. 'gemini-2.5-pro' or 'gemini-flash-latest'
 */
async function identifyCardsFromImage(imageBuffer, modelName = 'gemini-flash-latest') {
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
