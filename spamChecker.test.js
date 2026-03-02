const { checkSpam } = require('./spamChecker');

// Мокируем configService
jest.mock('./configService', () => ({
    configService: {
        getBlacklist: jest.fn()
    }
}));

const { configService } = require('./configService');

const COMMON_FORBIDDEN_WORDS = ['спам', 'реклама', 'купить'];
const SINGLE_FORBIDDEN_WORD = ['спам'];

describe('checkSpam', () => {
    describe('Позитивные сценарии', () => {
        test('должен вернуть 0% для текста без спама', () => {
            const text = 'Это обычное сообщение без запрещенных слов';
            expect(checkSpam(text, COMMON_FORBIDDEN_WORDS)).toBe(0);
        });

        test('должен вернуть 100% для текста, состоящего только из спама', () => {
            const text = 'спам реклама купить';
            expect(checkSpam(text, COMMON_FORBIDDEN_WORDS)).toBe(100);
        });

        test('должен вернуть правильный процент для частичного спама', () => {
            const text = 'Это сообщение содержит спам и реклама';
            expect(checkSpam(text, COMMON_FORBIDDEN_WORDS)).toBe(33.33);
        });

        test('должен игнорировать регистр (СПАМ и spam считаются одинаково)', () => {
            const text = 'Это СПАМ сообщение с РЕКЛАМА';
            const forbiddenWords = ['спам', 'реклама'];
            expect(checkSpam(text, forbiddenWords)).toBe(40);
        });

        test('должен обрабатывать текст с знаками препинания', () => {
            const text = 'Привет! Это спам, реклама и купить.';
            expect(checkSpam(text, COMMON_FORBIDDEN_WORDS)).toBe(50);
        });

        test('должен обрабатывать множественные вхождения одного слова', () => {
            const text = 'спам спам спам обычное слово';
            expect(checkSpam(text, SINGLE_FORBIDDEN_WORD)).toBe(60);
        });
    });

    describe('Негативные сценарии', () => {
        test('должен выбросить ошибку для пустого текста', () => {
            const text = '';
            expect(() => checkSpam(text, SINGLE_FORBIDDEN_WORD)).toThrow('Текст не должен быть пустым');
        });

        test('должен выбросить ошибку для текста только из пробелов', () => {
            const text = '   ';
            expect(() => checkSpam(text, SINGLE_FORBIDDEN_WORD)).toThrow('Текст не должен быть пустым');
        });

        test('должен выбросить ошибку для null', () => {
            const text = null;
            expect(() => checkSpam(text, SINGLE_FORBIDDEN_WORD)).toThrow('Текст не должен быть пустым');
        });

        test('должен выбросить ошибку для undefined', () => {
            const text = undefined;
            expect(() => checkSpam(text, SINGLE_FORBIDDEN_WORD)).toThrow('Текст не должен быть пустым');
        });

        test('должен выбросить ошибку если список запрещенных слов не массив', () => {
            const text = 'Обычный текст';
            const forbiddenWords = 'не массив';
            expect(() => checkSpam(text, forbiddenWords)).toThrow('Список запрещенных слов должен быть массивом');
        });
    });

    describe('Граничные значения', () => {
        test('должен вернуть 0% если слов в тексте нет (только знаки препинания)', () => {
            const text = '!!! ??? ...';
            expect(checkSpam(text, SINGLE_FORBIDDEN_WORD)).toBe(0);
        });

        test('должен вернуть 0% если список запрещенных слов пуст', () => {
            const text = 'Это обычное сообщение';
            const forbiddenWords = [];
            expect(checkSpam(text, forbiddenWords)).toBe(0);
        });

        test('должен обрабатывать текст из одного слова (не спам)', () => {
            const text = 'Привет';
            expect(checkSpam(text, SINGLE_FORBIDDEN_WORD)).toBe(0);
        });

        test('должен обрабатывать текст из одного слова (спам)', () => {
            const text = 'спам';
            expect(checkSpam(text, SINGLE_FORBIDDEN_WORD)).toBe(100);
        });

        test('должен обрабатывать очень длинный текст', () => {
            const text = 'Это очень длинный текст '.repeat(100) + 'спам';
            const result = checkSpam(text, SINGLE_FORBIDDEN_WORD);
            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThan(1);
        });

        test('должен обрабатывать текст с множественными пробелами', () => {
            const text = 'Это    сообщение    с    множественными    пробелами    спам';
            expect(checkSpam(text, SINGLE_FORBIDDEN_WORD)).toBe(16.67);
        });

        test('должен обрабатывать текст с переносами строк', () => {
            const text = 'Это\nсообщение\nс\nпереносами\nспам';
            expect(checkSpam(text, SINGLE_FORBIDDEN_WORD)).toBe(20);
        });

        test('должен обрабатывать текст с табуляциями', () => {
            const text = 'Это\tсообщение\tс\tтабуляциями\tспам';
            expect(checkSpam(text, SINGLE_FORBIDDEN_WORD)).toBe(20);
        });
    });

    describe('Интеграция с ConfigService', () => {
        beforeEach(() => {
            // Очищаем моки перед каждым тестом
            jest.clearAllMocks();
            // Сбрасываем кэш в spamChecker
            const { resetBlacklistCache } = require('./spamChecker');
            resetBlacklistCache();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        describe('Загрузка списка из ConfigService', () => {
            test('должен загрузить список из ConfigService и использовать его для проверки', async () => {
                const mockBlacklist = ['спам', 'реклама', 'купить'];
                configService.getBlacklist.mockResolvedValue(mockBlacklist);

                const text = 'Это сообщение содержит спам и реклама';
                const result = await checkSpam(text);

                expect(configService.getBlacklist).toHaveBeenCalledTimes(1);
                expect(result).toBe(33.33);
            });

            test('должен загрузить список только один раз при множественных вызовах', async () => {
                const mockBlacklist = ['спам', 'реклама'];
                configService.getBlacklist.mockResolvedValue(mockBlacklist);

                const text1 = 'Это спам';
                const text2 = 'Это реклама';
                const text3 = 'Это обычный текст';

                const result1 = await checkSpam(text1);
                const result2 = await checkSpam(text2);
                const result3 = await checkSpam(text3);

                // getBlacklist должен быть вызван только один раз благодаря кэшированию
                expect(configService.getBlacklist).toHaveBeenCalledTimes(1);
                expect(result1).toBe(50);
                expect(result2).toBe(50);
                expect(result3).toBe(0);
            });

            test('должен возвращать тот же промис при одновременных вызовах', async () => {
                const { loadBlacklist } = require('./spamChecker');
                const mockBlacklist = ['спам', 'реклама'];
                
                // Создаем промис, который резолвится с задержкой
                let resolvePromise;
                const delayedPromise = new Promise(resolve => {
                    resolvePromise = resolve;
                });
                configService.getBlacklist.mockReturnValue(delayedPromise);

                // Делаем два одновременных вызова до того, как первый завершится
                const promise1 = loadBlacklist();
                const promise2 = loadBlacklist();

                // getBlacklist должен быть вызван только один раз, так как второй вызов использует тот же промис
                expect(configService.getBlacklist).toHaveBeenCalledTimes(1);

                // Резолвим промис
                resolvePromise(mockBlacklist);
                const result1 = await promise1;
                const result2 = await promise2;

                expect(result1).toEqual(mockBlacklist);
                expect(result2).toEqual(mockBlacklist);
            });
        });

        describe('Разные списки слов (Mock)', () => {
            test('должен работать с разными списками слов из ConfigService', async () => {
                const { resetBlacklistCache } = require('./spamChecker');
                
                const mockBlacklist1 = ['спам', 'реклама'];
                configService.getBlacklist.mockResolvedValue(mockBlacklist1);

                const text = 'Это спам сообщение';
                const result1 = await checkSpam(text);

                expect(result1).toBe(33.33);

                // Имитируем другой список
                resetBlacklistCache();
                const mockBlacklist2 = ['вирус', 'троян', 'взлом'];
                configService.getBlacklist.mockResolvedValue(mockBlacklist2);

                const text2 = 'Это вирус и троян';
                const result2 = await checkSpam(text2);

                expect(result2).toBe(50);
            });

            test('должен работать с большим списком запрещенных слов', async () => {
                const largeBlacklist = ['спам', 'реклама', 'купить', 'бесплатно', 'акция', 'скидка', 'выигрыш', 'приз'];
                configService.getBlacklist.mockResolvedValue(largeBlacklist);

                const text = 'Это сообщение содержит спам реклама купить бесплатно';
                const result = await checkSpam(text);

                // 4 запрещенных слова из 7 = 57.14%
                expect(result).toBe(57.14);
            });

            test('должен работать с маленьким списком (одно слово)', async () => {
                const singleWordList = ['спам'];
                configService.getBlacklist.mockResolvedValue(singleWordList);

                const text = 'Это спам сообщение';
                const result = await checkSpam(text);

                expect(result).toBe(33.33);
            });
        });

        describe('Пустой список слов', () => {
            test('должен вернуть 0% если ConfigService вернул пустой список', async () => {
                const emptyBlacklist = [];
                configService.getBlacklist.mockResolvedValue(emptyBlacklist);

                const text = 'Это сообщение содержит любые слова';
                const result = await checkSpam(text);

                expect(configService.getBlacklist).toHaveBeenCalled();
                expect(result).toBe(0);
            });

            test('должен обработать пустой список без ошибок', async () => {
                const emptyBlacklist = [];
                configService.getBlacklist.mockResolvedValue(emptyBlacklist);

                const text = 'спам реклама купить';
                const result = await checkSpam(text);

                expect(result).toBe(0);
            });
        });

        describe('Таймаут при загрузке', () => {
            test('должен обработать таймаут при загрузке словаря', async () => {
                // Имитируем таймаут - промис отклоняется с ошибкой таймаута
                const timeoutError = new Error('Timeout: Превышено время ожидания загрузки словаря');
                configService.getBlacklist.mockRejectedValue(timeoutError);

                const text = 'Это обычное сообщение';

                await expect(checkSpam(text)).rejects.toThrow('Ошибка загрузки списка запрещенных слов: Timeout: Превышено время ожидания загрузки словаря');
            });

            test('должен обработать ошибку сети при загрузке', async () => {
                const networkError = new Error('Network error: Не удалось подключиться к серверу');
                configService.getBlacklist.mockRejectedValue(networkError);

                const text = 'Это обычное сообщение';

                await expect(checkSpam(text)).rejects.toThrow('Ошибка загрузки списка запрещенных слов: Network error: Не удалось подключиться к серверу');
            });

            test('должен обработать ошибку сервера при загрузке', async () => {
                const serverError = new Error('Server error: 500 Internal Server Error');
                configService.getBlacklist.mockRejectedValue(serverError);

                const text = 'Это обычное сообщение';

                await expect(checkSpam(text)).rejects.toThrow('Ошибка загрузки списка запрещенных слов: Server error: 500 Internal Server Error');
            });
        });

        describe('Верификация взаимодействия с ConfigService', () => {
            test('должен вызывать getBlacklist с правильными параметрами', async () => {
                const mockBlacklist = ['спам', 'реклама'];
                configService.getBlacklist.mockResolvedValue(mockBlacklist);

                const text = 'Это спам';
                await checkSpam(text);

                expect(configService.getBlacklist).toHaveBeenCalled();
                expect(configService.getBlacklist).toHaveBeenCalledTimes(1);
            });

            test('не должен вызывать getBlacklist если список передан явно', () => {
                const text = 'Это спам';
                const result = checkSpam(text, ['спам']);

                expect(configService.getBlacklist).not.toHaveBeenCalled();
                expect(result).toBe(50);
            });
        });
    });
});
