/**
 * Автоматическая демонстрация соответствия ТЗ
 * Этот файл автоматически выполняется при загрузке страницы
 * и демонстрирует все требования технического задания
 */

(function() {
    'use strict';

    // Ждем загрузки всех необходимых функций
    function waitForFunctions() {
        if (typeof window.checkSpam === 'function' && 
            typeof window.loadBlacklist === 'function' && 
            typeof window.resetBlacklistCache === 'function' &&
            typeof window.configService !== 'undefined') {
            return true;
        }
        return false;
    }

    // Основная функция демонстрации
    async function runAutoDemo() {
        // Проверяем доступность функций
        if (!waitForFunctions()) {
            console.warn('⏳ Ожидание загрузки функций...');
            setTimeout(runAutoDemo, 100);
            return;
        }

      

        try {
            // ============================================
            // ПУНКТ 1: Загрузка списка один раз из ConfigService
            // ============================================
          

            // 1.1. Загрузка списка
            resetBlacklistCache();
            console.log('⏳ Загружаем список из ConfigService...');
            const list = await loadBlacklist();
            console.log('✅ Список загружен:', list);
            console.log('   Количество слов:', list.length);

            // 1.2. Проверка кэширования
            console.log('\n⏳ Проверяем кэширование (второй вызов)...');
            const list2 = await loadBlacklist();
            const isCached = list === list2;
            console.log('✅ Кэширование работает:', isCached ? 'ДА' : 'НЕТ');
            if (isCached) {
                console.log('   ✅ Список загружается только один раз!');
            }

            // 1.3. Асинхронная проверка с ConfigService
            console.log('\n⏳ Проверяем текст с загрузкой из ConfigService...');
            resetBlacklistCache();
            const result1 = await checkSpamAsync('Это сообщение содержит спам и реклама');
            console.log('✅ Результат проверки:', result1 + '%');
            console.log('   (2 запрещенных слова из 6 = 33.33%)');

            console.log('\n');

        
       

            const originalGetBlacklist = configService.getBlacklist;

            // 2.1. Большой список
            console.log('⏳ Тестируем большой список (6 слов)...');
            configService.getBlacklist = async () => ['спам', 'реклама', 'купить', 'бесплатно', 'акция', 'скидка'];
            resetBlacklistCache();
            const result2 = await checkSpamAsync('спам реклама купить');
            console.log('✅ Большой список:', result2 + '%');
            console.log('   (3 запрещенных слова из 3 = 100%)');

            // 2.2. Маленький список
            console.log('\n⏳ Тестируем маленький список (1 слово)...');
            configService.getBlacklist = async () => ['спам'];
            resetBlacklistCache();
            const result3 = await checkSpamAsync('спам реклама');
            console.log('✅ Маленький список:', result3 + '%');
            console.log('   (1 запрещенное слово из 2 = 50%)');

            // 2.3. Другой список
            console.log('\n⏳ Тестируем другой список (вирус, троян)...');
            configService.getBlacklist = async () => ['вирус', 'троян', 'взлом'];
            resetBlacklistCache();
            const result4 = await checkSpamAsync('Это вирус и троян в системе');
            console.log('✅ Другой список:', result4 + '%');
            console.log('   (2 запрещенных слова из 5 = 40%)');

            // Восстанавливаем оригинальный метод
            configService.getBlacklist = originalGetBlacklist;
            resetBlacklistCache();

            console.log('\n');


            // 3.1. Пустой список
            console.log('⏳ Тестируем пустой список...');
            configService.getBlacklist = async () => [];
            resetBlacklistCache();
            const result5 = await checkSpamAsync('спам реклама купить');
            console.log('✅ Пустой список:', result5 + '%');
            console.log('   Ожидалось: 0% (пустой список = нет запрещенных слов)');
            if (result5 === 0) {
                console.log('   ✅ Тест пройден!');
            }

            // 3.2. Таймаут
            console.log('\n⏳ Тестируем таймаут...');
            configService.getBlacklist = async () => {
                throw new Error('Timeout: Превышено время ожидания загрузки словаря');
            };
            resetBlacklistCache();
            try {
                // Используем silent=true, чтобы не выводить ошибку в консоль (это ожидаемая ошибка)
                await checkSpamAsync('спам', true);
                console.log('❌ Ошибка: должна была быть ошибка таймаута');
            } catch (error) {
                const hasError = error.message.includes('Ошибка загрузки');
                console.log('✅ Таймаут обработан:', hasError ? 'ДА' : 'НЕТ');
                console.log('   Сообщение:', error.message);
                if (hasError) {
                    console.log('   ✅ Тест пройден!');
                }
            }

            // 3.3. Ошибка сети
            console.log('\n⏳ Тестируем ошибку сети...');
            configService.getBlacklist = async () => {
                throw new Error('Network error: Не удалось подключиться к серверу');
            };
            resetBlacklistCache();
            try {
                // Используем silent=true, чтобы не выводить ошибку в консоль (это ожидаемая ошибка)
                await checkSpamAsync('спам', true);
            } catch (error) {
                const hasError = error.message.includes('Ошибка загрузки');
                console.log('✅ Ошибка сети обработана:', hasError ? 'ДА' : 'НЕТ');
                console.log('   Сообщение:', error.message);
                if (hasError) {
                    console.log('   ✅ Тест пройден!');
                }
            }

            // Восстанавливаем оригинальный метод
            configService.getBlacklist = originalGetBlacklist;
            resetBlacklistCache();

            console.log('\n');

  

            // Проверка кэширования (один вызов)
            console.log('⏳ Проверяем, что getBlacklist вызывается только один раз...');
            let callCount = 0;
            configService.getBlacklist = async function() {
                callCount++;
                console.log(`   📞 Вызов getBlacklist() #${callCount}`);
                return originalGetBlacklist.call(this);
            };

            resetBlacklistCache();
            await checkSpamAsync('Это спам');
            await checkSpamAsync('Это реклама');
            await checkSpamAsync('Это обычный текст');

            console.log(`✅ Всего вызовов getBlacklist: ${callCount}`);
            console.log('   Ожидалось: 1 (благодаря кэшированию)');
            if (callCount === 1) {
                console.log('   ✅ Тест пройден!');
            }

            // Проверка, что при явной передаче списка ConfigService не вызывается
            console.log('\n⏳ Проверяем, что при явной передаче списка ConfigService не вызывается...');
            callCount = 0;
            configService.getBlacklist = async function() {
                callCount++;
                return originalGetBlacklist.call(this);
            };

            const result6 = checkSpam('Это спам', ['спам', 'реклама']);
            console.log('✅ Результат:', result6 + '%');
            console.log(`   Вызовов getBlacklist: ${callCount}`);
            console.log('   Ожидалось: 0 (список передан явно)');
            if (callCount === 0) {
                console.log('   ✅ Тест пройден!');
            }

            // Восстанавливаем
            configService.getBlacklist = originalGetBlacklist;
            resetBlacklistCache();

            console.log('\n');

        


        } catch (error) {
            console.error('❌ Ошибка при выполнении демонстрации:', error);
            console.error('   Детали:', error.message);
        }
    }

    // Делаем функцию доступной глобально для повторного запуска
    window.runAutoDemo = runAutoDemo;

    // Запускаем автоматически при загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(runAutoDemo, 500); // Небольшая задержка для загрузки всех скриптов
        });
    } else {
        setTimeout(runAutoDemo, 500);
    }

})();
