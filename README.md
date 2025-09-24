To run the Telegram bot locally in this workspace, use the command:

`node src/index.js`

# Overview

This is a Telegram bot that solves fantasyland hands for open face chinese poker

# How it works

1. User sends a screenshot of the poker table showing their cards to the telegram bot
2. The image is passed to a VLM (Vision-language model) via chat completion or similar API with instructions to output the cards in text format
3. We pass the VLM output to the solver
4. The solver calculates the solution
5. Solution is nicely formated & sent back to the user in Telegram as a bot message 

## Environment variables stored securely
- TELEGRAM_BOT_TOKEN
- GEMINI_API_KEY (VLM)
- MISTRAL_API_KEY (VLM)


