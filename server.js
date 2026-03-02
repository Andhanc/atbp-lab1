// Локальный REST API‑сервер для лабораторной работы №3
// Вариант 14: Проверка текста на спам

const express = require('express');
const { configService } = require('./configService');
const { checkSpam } = require('./spamChecker');

const app = express();
const PORT = 3000;

app.use(express.json());

/**
 * Технический эндпоинт для проверки готовности сервиса
 * GET /api/status
 * Пример ответа:
 * { "status": "online", "timestamp": "..." }
 */
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Вариант 14 — Запрос №1:
 * GET /api/config/spam-words
 * Загружает актуальный стоп‑лист запрещённых слов из ConfigService.
 *
 * Пример ответа:
 * {
 *   "status": "success",
 *   "spamWords": ["спам", "реклама", ...],
 *   "count": 5
 * }
 */
app.get('/api/config/spam-words', async (req, res) => {
  try {
    const spamWords = await configService.getBlacklist();

    res.status(200).json({
      status: 'success',
      spamWords,
      count: Array.isArray(spamWords) ? spamWords.length : 0,
    });
  } catch (error) {
    console.error('[GET /api/config/spam-words] Ошибка:', error);
    res.status(500).json({
      status: 'error',
      message: 'Не удалось загрузить стоп‑лист запрещённых слов',
      details: error.message,
    });
  }
});

/**
 * Вариант 14 — Запрос №2:
 * POST /api/spam/check
 * Тело запроса (JSON):
 * { "text": "Ваш текст для проверки" }
 *
 * Условия по ТЗ:
 *  - вычислить процент спама;
 *  - игнорировать регистр слов;
 *  - при пустом тексте вернуть ошибку (400).
 *
 * Пример успешного ответа:
 * {
 *   "status": "success",
 *   "spamPercentage": 33.33,
 *   "isSpam": true
 * }
 *
 * Пример ошибки (пустой текст):
 * {
 *   "status": "error",
 *   "message": "Текст не должен быть пустым"
 * }
 */
app.post('/api/spam/check', async (req, res) => {
  const { text } = req.body || {};

  // Валидация входных данных (пустой текст → 400)
  if (typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Текст не должен быть пустым',
    });
  }

  try {
    // checkSpam без второго аргумента работает в асинхронном режиме
    // и сам загружает список запрещённых слов из ConfigService
    const spamPercentage = await checkSpam(text);

    res.status(200).json({
      status: 'success',
      spamPercentage,
      isSpam: spamPercentage > 0, // при необходимости можно заменить на порог, например > 30
    });
  } catch (error) {
    console.error('[POST /api/spam/check] Ошибка:', error);

    // Ошибка при загрузке списка запрещённых слов
    if (error.message && error.message.startsWith('Ошибка загрузки списка запрещенных слов')) {
      return res.status(500).json({
        status: 'error',
        message: 'Ошибка при загрузке стоп‑листа',
        details: error.message,
      });
    }

    // Прочие ошибки (дополнительная защита)
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера при проверке текста на спам',
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log('Готов к тестированию API через Postman');
});

