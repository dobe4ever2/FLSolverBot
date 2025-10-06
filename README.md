To run the Telegram bot locally in this workspace, use the command:

`node src/bot.js`

# Overview
This is a Telegram bot that solves fantasyland hands for open face chinese poker. Currently it only responds to admin's Telegram ID.

# How it works
1. User sends a screenshot of the poker table to the telegram bot
2. The image is passed to the Gemini Vision-language model to extract the visible cards
3. We pass the cards thru the solver function
4. We format the solution for Telegram
5. Bot sends formated solution back to the user 

## Environment variables stored securely
- TELEGRAM_BOT_TOKEN
- GEMINI_API_KEY



I want to remove the UI where the user needs to select the cards one by one, and make it a chat interface where the user can paste a screenshot of the poker app. The Gemini vision-language model extracts the visible cards & outputs them in the format expected by the solver function. The solution back to the user in the chat.

Here's what im thinking:

`components/fantasyland-solver-app.tsx`:
Keep the logic exactly, remove rendering code.
Rename and move to: services/fl-solver.tsx

`services/geminiService.ts`:
THIS IS THE OFFICIAL API: DO NOT EDIT ANYTHING THAT MIGHT CAUSE API ERRORS! API Key already added and accessible in the code. Install the following dependencies exactly:
`npm install @google/genai mime`
`npm install -D @types/node`

`components/`:
Create the UI components for a chat interface similar to telegram where the user can send images. Add a little 'paste' icon to paste the clipboard with 1 click. 

`app/page.tsx`:
Modify accodringly for updated code 

# The main loop:

Images sent to the chat by users get converted to base64. Run base64 thru Gemini and get output. Run output thru the fl-solver function and get output. Format output nice and readable. Send to user via chat. 

double check that all import statements in all files are updated to work with the new code.

Can u get a first version working so i can send a screenshot and i get the solution?







