const { checkSpam } = require('./spamChecker');

describe('checkSpam', () => {
    describe('Позитивные сценарии', () => {
        test('должен вернуть 0% для текста без спама', () => {
            const text = 'Это обычное сообщение без запрещенных слов';
            const forbiddenWords = ['спам', 'реклама', 'купить'];
            expect(checkSpam(text, forbiddenWords)).toBe(0);
        });

        test('должен вернуть 100% для текста, состоящего только из спама', () => {
            const text = 'спам реклама купить';
            const forbiddenWords = ['спам', 'реклама', 'купить'];
            expect(checkSpam(text, forbiddenWords)).toBe(100);
        });

        test('должен вернуть правильный процент для частичного спама', () => {
            const text = 'Это сообщение содержит спам и реклама';
            const forbiddenWords = ['спам', 'реклама', 'купить'];
            expect(checkSpam(text, forbiddenWords)).toBe(33.33);
        });

        test('должен игнорировать регистр (СПАМ и spam считаются одинаково)', () => {
            const text = 'Это СПАМ сообщение с РЕКЛАМА';
            const forbiddenWords = ['спам', 'реклама'];
            expect(checkSpam(text, forbiddenWords)).toBe(40);
        });

        test('должен обрабатывать текст с знаками препинания', () => {
            const text = 'Привет! Это спам, реклама и купить.';
            const forbiddenWords = ['спам', 'реклама', 'купить'];
            expect(checkSpam(text, forbiddenWords)).toBe(50);
        });

        test('должен обрабатывать множественные вхождения одного слова', () => {
            const text = 'спам спам спам обычное слово';
            const forbiddenWords = ['спам'];
            expect(checkSpam(text, forbiddenWords)).toBe(60);
        });
    });

    describe('Негативные сценарии', () => {
        test('должен выбросить ошибку для пустого текста', () => {
            const text = '';
            const forbiddenWords = ['спам'];
            expect(() => checkSpam(text, forbiddenWords)).toThrow('Текст не должен быть пустым');
        });

        test('должен выбросить ошибку для текста только из пробелов', () => {
            const text = '   ';
            const forbiddenWords = ['спам'];
            expect(() => checkSpam(text, forbiddenWords)).toThrow('Текст не должен быть пустым');
        });

        test('должен выбросить ошибку для null', () => {
            const text = null;
            const forbiddenWords = ['спам'];
            expect(() => checkSpam(text, forbiddenWords)).toThrow('Текст не должен быть пустым');
        });

        test('должен выбросить ошибку для undefined', () => {
            const text = undefined;
            const forbiddenWords = ['спам'];
            expect(() => checkSpam(text, forbiddenWords)).toThrow('Текст не должен быть пустым');
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
            const forbiddenWords = ['спам'];
            expect(checkSpam(text, forbiddenWords)).toBe(0);
        });

        test('должен вернуть 0% если список запрещенных слов пуст', () => {
            const text = 'Это обычное сообщение';
            const forbiddenWords = [];
            expect(checkSpam(text, forbiddenWords)).toBe(0);
        });

        test('должен обрабатывать текст из одного слова (не спам)', () => {
            const text = 'Привет';
            const forbiddenWords = ['спам'];
            expect(checkSpam(text, forbiddenWords)).toBe(0);
        });

        test('должен обрабатывать текст из одного слова (спам)', () => {
            const text = 'спам';
            const forbiddenWords = ['спам'];
            expect(checkSpam(text, forbiddenWords)).toBe(100);
        });

        test('должен обрабатывать очень длинный текст', () => {
            const text = 'Это очень длинный текст '.repeat(100) + 'спам';
            const forbiddenWords = ['спам'];
            const result = checkSpam(text, forbiddenWords);
            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThan(1);
        });

        test('должен обрабатывать текст с множественными пробелами', () => {
            const text = 'Это    сообщение    с    множественными    пробелами    спам';
            const forbiddenWords = ['спам'];
            expect(checkSpam(text, forbiddenWords)).toBe(16.67);
        });

        test('должен обрабатывать текст с переносами строк', () => {
            const text = 'Это\nсообщение\nс\nпереносами\nспам';
            const forbiddenWords = ['спам'];
            expect(checkSpam(text, forbiddenWords)).toBe(20);
        });

        test('должен обрабатывать текст с табуляциями', () => {
            const text = 'Это\tсообщение\tс\tтабуляциями\tспам';
            const forbiddenWords = ['спам'];
            expect(checkSpam(text, forbiddenWords)).toBe(20);
        });
    });
});
