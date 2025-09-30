To run the Telegram bot locally in this workspace, use the command:

`node src/bot.js`

# Overview
This is a Telegram bot that solves fantasyland hands for open face chinese poker

# How it works
1. User sends a screenshot of the poker table to the telegram bot
2. The image is passed to the Gemini Vision-language model to extract the visible cards
3. We pass the cards thru the solver function
4. We format the solution for Telegram
5. Bot sends formated solution back to the user 

## Environment variables stored securely
- TELEGRAM_BOT_TOKEN
- GEMINI_API_KEY



