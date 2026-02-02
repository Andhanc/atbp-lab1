function checkSpam(text, forbiddenWords) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Текст не должен быть пустым');
    }

    if (!Array.isArray(forbiddenWords)) {
        throw new Error('Список запрещенных слов должен быть массивом');
    }

    if (forbiddenWords.length === 0) {
        return 0;
    }

    const words = text
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.replace(/[.,!?;:()\[\]{}'"]/g, ''))
        .filter(word => word.length > 0);

    if (words.length === 0) {
        return 0;
    }

    const forbiddenWordsLower = forbiddenWords.map(word => 
        typeof word === 'string' ? word.toLowerCase() : String(word).toLowerCase()
    );

    let spamCount = 0;
    words.forEach(word => {
        if (forbiddenWordsLower.includes(word)) {
            spamCount++;
        }
    });

    const spamPercentage = (spamCount / words.length) * 100;
    
    return Math.round(spamPercentage * 100) / 100;
}

module.exports = { checkSpam };
