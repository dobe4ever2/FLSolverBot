// // src/services/mistral.service.js

// const { Mistral } = require('@mistralai/mistralai');

// // Initialize Mistral client
// const apiKey = process.env.MISTRAL_API_KEY;
// if (!apiKey) {
//     console.error('Error: MISTRAL_API_KEY is not set!');
//     process.exit(1);
// }

// const client = new Mistral({ apiKey });

// /**
//  * Identifies cards from an image buffer using Mistral Vision API.
//  * @param {Buffer} imageBuffer - The image data as a buffer.
//  * @param {string} modelName - The model name to use (e.g., "mistral-small-latest" or "mistral-large-latest").
//  * @returns {Promise<string>} Raw response text from the API.
//  */
// async function identifyCardsFromImage(imageBuffer, modelName = "mistral-small-latest") {
//     // Convert image buffer to base64
//     const base64Image = imageBuffer.toString('base64');

//     // Build the payload for the API call
//     const response = await client.chat.complete({
//         model: modelName,
//         messages: [
//             {
//                 role: "user",
//                 content: [
//                     {
//                         type: "text",
//                         text: "You will be analyzing a screenshot of a poker app that shows several playing cards in a row. Your task is to identify each card's rank and suit, one by one starting from the first card on the left. E.g., '1. ten, clubs. 2. queen, clubs. 3. queen, spades. And so on...' then output them in standard poker notation. E.g., TC for ten of clubs, QC for queen of clubs, etc, cards separated by single spaces and all enclosed in triple backticks.",
//                     },
//                     {
//                         type: "image_url",
//                         imageUrl: `data:image/jpeg;base64,${base64Image}`
//                     }
//                 ]
//             }
//         ]
//     });

//     // Return the raw response text
//     return response.choices[0].message.content;
// }

// module.exports = { identifyCardsFromImage };




// src/services/mistral.service.js

const { Mistral } = require('@mistralai/mistralai');

// Initialize Mistral client
const apiKey = process.env.MISTRAL_API_KEY;
if (!apiKey) {
    console.error('Error: MISTRAL_API_KEY is not set!');
    process.exit(1);
}

const client = new Mistral({ apiKey });

// System prompt for card identification
const CARD_IDENTIFICATION_PROMPT = `You are analyzing a screenshot of a poker app showing several playing cards in a row.

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
 * Identifies cards from an image buffer using Mistral Vision API.
 * @param {Buffer} imageBuffer - The image data as a buffer.
 * @param {string} modelName - The model name to use (e.g., "mistral-small-latest" or "mistral-large-latest").
 * @returns {Promise<string>} Raw response text from the API.
 */
async function identifyCardsFromImage(imageBuffer, modelName = "mistral-small-latest") {
    // Convert image buffer to base64
    const base64Image = imageBuffer.toString('base64');

    // Build the payload for the API call
    const response = await client.chat.complete({
        model: modelName,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: CARD_IDENTIFICATION_PROMPT,
                    },
                    {
                        type: "image_url",
                        imageUrl: `data:image/jpeg;base64,${base64Image}`
                    }
                ]
            }
        ]
    });

    // Return the raw response text
    return response.choices[0].message.content;
}

module.exports = { identifyCardsFromImage };