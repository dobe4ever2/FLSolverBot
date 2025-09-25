// src/services/mistral.service.js

const { Mistral } = require('@mistralai/mistralai');

// Initialize Mistral client
const apiKey = process.env.MISTRAL_API_KEY;
if (!apiKey) {
    console.error('Error: MISTRAL_API_KEY is not set!');
    process.exit(1);
}

const client = new Mistral({ apiKey });

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
                        text: "You will be analyzing a screenshot of a poker app that shows several playing cards in a row. These cards use 4 colors: Green for clubs, blue for diamonds, red for hearts, and black for spades. Your task is to identify each card's rank and suit, then output them in standard poker notation. Instructions: First, carefully identify each card by writing out the rank, color and suit of one card at a time, starting from the first card on the left. E.g., '1. ten, green, clubs. 2. queen, green, clubs. 3. queen, black, spades. And so on...' Then return the final result formatted as standard poker notation to represent each card like this: e.g., AS for Ace of Spades, TC for ten of clubs, etc, cards separated by single spaces and all enclosed in triple backticks.",
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