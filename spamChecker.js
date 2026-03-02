// Поддержка как Node.js, так и браузера
// В Node.js используем require, в браузере - window.configService
// Не объявляем переменную глобально, чтобы избежать конфликтов

// Кэш для загруженного списка запрещенных слов (загружается один раз)
let cachedBlacklist = null;
let blacklistLoadingPromise = null;

/**
 * Загружает список запрещенных слов из ConfigService один раз
 * @returns {Promise<string[]>} Promise с массивом запрещенных слов
 */
async function loadBlacklist() {
    // Если уже загружается, возвращаем тот же промис
    if (blacklistLoadingPromise) {
        return blacklistLoadingPromise;
    }

    // Если уже загружено, возвращаем из кэша
    if (cachedBlacklist !== null) {
        return Promise.resolve(cachedBlacklist);
    }

    // Загружаем из ConfigService
    let service;
    if (typeof require !== 'undefined') {
        // В Node.js
        const configServiceModule = require('./configService');
        service = configServiceModule.configService;
    } else if (typeof window !== 'undefined') {
        // В браузере
        service = window.configService;
    }
    
    if (!service) {
        throw new Error('ConfigService не доступен. Убедитесь, что configService.js загружен перед spamChecker.js');
    }
    
    blacklistLoadingPromise = service.getBlacklist()
        .then(blacklist => {
            cachedBlacklist = blacklist;
            blacklistLoadingPromise = null;
            return blacklist;
        })
        .catch(error => {
            blacklistLoadingPromise = null;
            throw error;
        });

    return blacklistLoadingPromise;
}

/**
 * Сбрасывает кэш загруженного списка (для тестирования)
 */
function resetBlacklistCache() {
    cachedBlacklist = null;
    blacklistLoadingPromise = null;
}

/**
 * Проверяет текст на спам
 * @param {string} text - Текст для проверки
 * @param {string[]} [forbiddenWords] - Опциональный список запрещенных слов (если не указан, загружается из ConfigService)
 * @returns {number|Promise<number>} Процент спама в тексте (или Promise, если используется ConfigService)
 */
function checkSpam(text, forbiddenWords) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Текст не должен быть пустым');
    }

    // Если список запрещенных слов передан явно, используем его (синхронный режим)
    if (forbiddenWords !== undefined) {
        if (!Array.isArray(forbiddenWords)) {
            throw new Error('Список запрещенных слов должен быть массивом');
        }

        if (forbiddenWords.length === 0) {
            return 0;
        }

        return checkSpamWithWords(text, forbiddenWords);
    }

    // Если список не передан, загружаем из ConfigService (асинхронный режим)
    return loadBlacklist()
        .then(blacklist => {
            if (blacklist.length === 0) {
                return 0;
            }
            return checkSpamWithWords(text, blacklist);
        })
        .catch(error => {
            // Если произошла ошибка при загрузке, выбрасываем её
            throw new Error(`Ошибка загрузки списка запрещенных слов: ${error.message}`);
        });
}

/**
 * Внутренняя функция для проверки текста с заданным списком слов
 * @param {string} text - Текст для проверки
 * @param {string[]} forbiddenWords - Список запрещенных слов
 * @returns {number} Процент спама в тексте
 */
function checkSpamWithWords(text, forbiddenWords) {
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkSpam, loadBlacklist, resetBlacklistCache };
}

// Устанавливаем функции в window для браузера
// Важно: делаем это в конце файла, чтобы все функции были определены
if (typeof window !== 'undefined') {
    // Защита от повторной загрузки скрипта
    if (!window._spamCheckerLoaded) {
        // Устанавливаем функции сразу, даже если configService еще не загружен
        // checkSpam будет работать с явно переданным списком слов
        window.checkSpam = checkSpam;
        window.loadBlacklist = loadBlacklist;
        window.resetBlacklistCache = resetBlacklistCache;
        window._spamCheckerLoaded = true;
        
        // Проверяем, что configService доступен (для отладки)
        if (!window.configService) {
            console.warn('⚠️ configService не найден. Асинхронный режим checkSpam() может не работать.');
        } else {
            console.log('✅ SpamChecker успешно загружен и готов к работе');
        }
    }
}
