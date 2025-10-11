// src/utils/parser.js
/**
 * Extracts content enclosed in triple backticks from a string.
 * @param {string} text - The input text from an AI model.
 * @returns {string|null} - The extracted content or null if not found.
 */
function extractTripleBackticks(text) {
    if (!text) return null;
    // Ensure we're working with a string
    const str = String(text);
    const match = str.match(/```([\s\S]*?)```/);
    return match && match[1] ? match[1].trim() : null;
}

function normalizeAIResponse(resp) {
    if (resp == null) return '';
    if (typeof resp === 'string') return resp;
    if (Array.isArray(resp)) {
        // Map common fields
        const parts = resp.map(item => {
            if (!item) return '';
            if (typeof item === 'string') return item;
            if (item.text) return item.text;
            if (item.content) return Array.isArray(item.content) ? item.content.map(c => c.text || c).join('') : String(item.content);
            return JSON.stringify(item);
        });
        return parts.join('\n');
    }
    // Object
    if (typeof resp === 'object') {
        if (resp.text) return resp.text;
        if (resp.content) {
            if (typeof resp.content === 'string') return resp.content;
            if (Array.isArray(resp.content)) return resp.content.map(c => c.text || c).join('\n');
        }
        // Fallback to JSON
        try {
            return JSON.stringify(resp);
        } catch (e) {
            return String(resp);
        }
    }
    return String(resp);
}

module.exports = { extractTripleBackticks, normalizeAIResponse };