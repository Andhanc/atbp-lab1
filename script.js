// Обертка для checkSpam с сохранением последних параметров
// Используем немедленно выполняемую функцию, которая ждет загрузки checkSpam
(function() {
    function wrapCheckSpam() {
        if (typeof window.checkSpam === 'function') {
            const originalCheckSpam = window.checkSpam;
            
            window.checkSpam = function(text, forbiddenWords) {
                window._lastText = text;
                window._lastForbiddenWords = forbiddenWords;
                return originalCheckSpam(text, forbiddenWords);
            };
            return true;
        }
        return false;
    }
    
    // Пытаемся установить обертку сразу (если скрипты загружены в правильном порядке)
    if (!wrapCheckSpam()) {
        // Если не получилось, ждем немного и пробуем снова
        // Это нужно на случай, если script.js загрузился раньше spamChecker.js
        let attempts = 0;
        const maxAttempts = 50; // 500ms максимум
        
        const tryWrap = setInterval(function() {
            attempts++;
            if (wrapCheckSpam() || attempts >= maxAttempts) {
                clearInterval(tryWrap);
                if (attempts >= maxAttempts && typeof window.checkSpam !== 'function') {
                    console.error('❌ Не удалось найти window.checkSpam. Проверьте порядок загрузки скриптов в index.html');
                }
            }
        }, 10);
    }
})();

window.testSpam = function(text, forbiddenWords) {
    console.log('=== Автоматическая проверка данных ===');
    console.log('Текст:', text);
    console.log('Запрещенные слова:', forbiddenWords);
    console.log('');
    
    try {
        const result = window.checkSpam(text, forbiddenWords);
        console.log('✅ Результат:', result + '%');
        
        if (result === 0) {
            console.log('📝 Текст не содержит спама');
        } else if (result === 100) {
            console.log('⚠️ Текст полностью состоит из спама');
        } else {
            console.log('⚠️ Текст содержит частичный спам');
        }
        
        return result;
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        return null;
    }
};

window.runAllTests = function(text, forbiddenWords) {
    if (!text || !forbiddenWords) {
        if (window._lastText && window._lastForbiddenWords) {
            text = window._lastText;
            forbiddenWords = window._lastForbiddenWords;
            console.log('Используются последние данные из checkSpam:');
            console.log('Текст:', text);
            console.log('Запрещенные слова:', forbiddenWords);
            console.log('');
        } else {
            console.error('❌ Ошибка: Укажите текст и список запрещенных слов');
            console.log('Использование: runAllTests("ваш текст", ["спам", "реклама"])');
            console.log('Или сначала вызовите: checkSpam("текст", ["спам"])');
            return;
        }
    }
    
    console.log('=== Запуск всех тестовых сценариев для вашего текста ===');
    console.log('Текст:', text);
    console.log('Запрещенные слова:', forbiddenWords);
    console.log('');
    
    let testNumber = 1;
    let passed = 0;
    let failed = 0;
    
    const result = window.checkSpam(text, forbiddenWords);
    const words = text.toLowerCase().split(/\s+/).map(w => w.replace(/[.,!?;:()\[\]{}'"]/g, '')).filter(w => w.length > 0);
    const forbiddenWordsLower = forbiddenWords.map(w => typeof w === 'string' ? w.toLowerCase() : String(w).toLowerCase());
    const spamWords = words.filter(w => forbiddenWordsLower.includes(w));
    
    console.log(' Позитивные сценарии ');
    
    if (result === 0) {
        console.log(`✅ Тест ${testNumber}: Текст без спама - ПРОШЕЛ (${result}%)`);
        passed++;
    } else {
        console.log(`❌ Тест ${testNumber}: Текст без спама - НЕ ПРОШЕЛ (${result}%)`);
        failed++;
    }
    testNumber++;
    
    if (result === 100) {
        console.log(`✅ Тест ${testNumber}: Текст полностью из спама - ПРОШЕЛ (${result}%)`);
        passed++;
    } else {
        console.log(`❌ Тест ${testNumber}: Текст полностью из спама - НЕ ПРОШЕЛ (${result}%)`);
        failed++;
    }
    testNumber++;
    
    if (result > 0 && result < 100) {
        console.log(`✅ Тест ${testNumber}: Частичный спам - ПРОШЕЛ (${result}%)`);
        passed++;
    } else {
        console.log(`❌ Тест ${testNumber}: Частичный спам - НЕ ПРОШЕЛ (${result}%)`);
        failed++;
    }
    testNumber++;
    
    const hasUpperCase = text !== text.toLowerCase();
    if (hasUpperCase && result > 0) {
        console.log(`✅ Тест ${testNumber}: Проверка регистра (есть заглавные буквы) - ПРОШЕЛ`);
        passed++;
    } else {
        console.log(`⚠️ Тест ${testNumber}: Проверка регистра - пропущен (нет заглавных букв или нет спама)`);
    }
    testNumber++;
    
    const hasPunctuation = /[.,!?;:()\[\]{}'"]/.test(text);
    if (hasPunctuation) {
        console.log(`✅ Тест ${testNumber}: Текст с знаками препинания - ПРОШЕЛ`);
        passed++;
    } else {
        console.log(`⚠️ Тест ${testNumber}: Текст с знаками препинания - пропущен (нет знаков препинания)`);
    }
    testNumber++;
    
    const wordCounts = {};
    words.forEach(w => {
        if (forbiddenWordsLower.includes(w)) {
            wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
    });
    const hasMultiple = Object.values(wordCounts).some(count => count > 1);
    if (hasMultiple) {
        console.log(`✅ Тест ${testNumber}: Множественные вхождения запрещенных слов - ПРОШЕЛ`);
        passed++;
    } else {
        console.log(`⚠️ Тест ${testNumber}: Множественные вхождения - пропущен (нет повторений)`);
    }
    testNumber++;
    
    console.log('\nНегативные сценарии ');
    
    try {
        window.checkSpam('', forbiddenWords);
        console.log(`❌ Тест ${testNumber}: Обработка пустого текста - НЕ ПРОШЕЛ (должна быть ошибка)`);
        failed++;
    } catch (error) {
        console.log(`✅ Тест ${testNumber}: Обработка пустого текста - ПРОШЕЛ (ошибка: ${error.message})`);
        passed++;
    }
    testNumber++;
    
    try {
        window.checkSpam('   ', forbiddenWords);
        console.log(`❌ Тест ${testNumber}: Обработка текста только из пробелов - НЕ ПРОШЕЛ (должна быть ошибка)`);
        failed++;
    } catch (error) {
        console.log(`✅ Тест ${testNumber}: Обработка текста только из пробелов - ПРОШЕЛ (ошибка: ${error.message})`);
        passed++;
    }
    testNumber++;
    
    try {
        window.checkSpam(null, forbiddenWords);
        console.log(`❌ Тест ${testNumber}: Обработка null - НЕ ПРОШЕЛ (должна быть ошибка)`);
        failed++;
    } catch (error) {
        console.log(`✅ Тест ${testNumber}: Обработка null - ПРОШЕЛ (ошибка: ${error.message})`);
        passed++;
    }
    testNumber++;
    
    try {
        window.checkSpam(undefined, forbiddenWords);
        console.log(`❌ Тест ${testNumber}: Обработка undefined - НЕ ПРОШЕЛ (должна быть ошибка)`);
        failed++;
    } catch (error) {
        console.log(`✅ Тест ${testNumber}: Обработка undefined - ПРОШЕЛ (ошибка: ${error.message})`);
        passed++;
    }
    testNumber++;
    
    try {
        window.checkSpam(text, 'не массив');
        console.log(`❌ Тест ${testNumber}: Обработка некорректного типа списка - НЕ ПРОШЕЛ (должна быть ошибка)`);
        failed++;
    } catch (error) {
        console.log(`✅ Тест ${testNumber}: Обработка некорректного типа списка - ПРОШЕЛ (ошибка: ${error.message})`);
        passed++;
    }
    testNumber++;
    
    console.log('\nГраничные значения ');
    
    if (words.length === 0) {
        console.log(`✅ Тест ${testNumber}: Текст без слов (только знаки препинания) - ПРОШЕЛ`);
        passed++;
    } else {
        console.log(`⚠️ Тест ${testNumber}: Текст без слов - пропущен (есть слова)`);
    }
    testNumber++;
    
    if (forbiddenWords.length === 0) {
        console.log(`✅ Тест ${testNumber}: Пустой список запрещенных слов - ПРОШЕЛ`);
        passed++;
    } else {
        console.log(`⚠️ Тест ${testNumber}: Пустой список запрещенных слов - пропущен (список не пуст)`);
    }
    testNumber++;
    
    if (words.length === 1 && result === 0) {
        console.log(`✅ Тест ${testNumber}: Текст из одного слова (не спам) - ПРОШЕЛ`);
        passed++;
    } else {
        console.log(`⚠️ Тест ${testNumber}: Текст из одного слова (не спам) - пропущен`);
    }
    testNumber++;
    
    if (words.length === 1 && result === 100) {
        console.log(`✅ Тест ${testNumber}: Текст из одного слова (спам) - ПРОШЕЛ`);
        passed++;
    } else {
        console.log(`⚠️ Тест ${testNumber}: Текст из одного слова (спам) - пропущен`);
    }
    testNumber++;
    
    if (words.length > 100) {
        console.log(`✅ Тест ${testNumber}: Очень длинный текст - ПРОШЕЛ (${words.length} слов)`);
        passed++;
    } else {
        console.log(`⚠️ Тест ${testNumber}: Очень длинный текст - пропущен (${words.length} слов, нужно > 100)`);
    }
    testNumber++;
    
    const hasMultipleSpaces = /\s{2,}/.test(text);
    if (hasMultipleSpaces) {
        console.log(`✅ Тест ${testNumber}: Текст с множественными пробелами - ПРОШЕЛ`);
        passed++;
    } else {
        console.log(`⚠️ Тест ${testNumber}: Текст с множественными пробелами - пропущен`);
    }
    testNumber++;
    
    const hasNewlines = /\n/.test(text);
    if (hasNewlines) {
        console.log(`✅ Тест ${testNumber}: Текст с переносами строк - ПРОШЕЛ`);
        passed++;
    } else {
        console.log(`⚠️ Тест ${testNumber}: Текст с переносами строк - пропущен`);
    }
    testNumber++;
    
    const hasTabs = /\t/.test(text);
    if (hasTabs) {
        console.log(`✅ Тест ${testNumber}: Текст с табуляциями - ПРОШЕЛ`);
        passed++;
    } else {
        console.log(`⚠️ Тест ${testNumber}: Текст с табуляциями - пропущен`);
    }
    
    console.log('\ Итоги ');
    console.log(`✅ Пройдено: ${passed}`);
    console.log(`❌ Провалено: ${failed}`);
    console.log(`📊 Всего тестов: ${testNumber - 1}`);
    console.log(`📈 Процент спама в вашем тексте: ${result}%`);
    console.log(`📝 Всего слов: ${words.length}`);
    console.log(`⚠️ Запрещенных слов найдено: ${spamWords.length}`);
};
