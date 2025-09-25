// src/utils/formatter.js
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

module.exports = { formatCardWithColor };