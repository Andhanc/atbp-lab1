const { Given, When, Then } = require('@cucumber/cucumber');
const request = require('supertest');
const app = require('../../server');

let response = null;
let loadedSpamWords = [];

// Сервис доступен
Given('сервис доступен по адресу {string}', async function (path) {
  const res = await request(app).get(path);
  if (res.status !== 200 || res.body.status !== 'online') {
    throw new Error('Сервис недоступен');
  }
});

// Загрузка стоп-листа и сохранение для использования во втором запросе
Given('я загружаю список запрещённых слов с {string} {string}', async function (method, path) {
  if (method !== 'GET') {
    throw new Error('Ожидался GET-запрос');
  }
  const res = await request(app).get(path);
  if (res.status !== 200 || res.body.status !== 'success') {
    throw new Error(`Не удалось загрузить стоп-лист: ${res.body.message || res.status}`);
  }
  loadedSpamWords = res.body.spamWords || [];
});

// Отправка POST с текстом
When('я отправляю запрос {string} на {string} с текстом {string}', async function (method, path, text) {
  if (method !== 'POST') {
    throw new Error('Ожидался POST-запрос');
  }
  response = await request(app)
    .post(path)
    .send({
      text: text,
      spamWords: loadedSpamWords.length > 0 ? loadedSpamWords : undefined,
    });
});

// Отправка POST с пустым текстом
When('я отправляю запрос {string} на {string} с пустым текстом', async function (method, path) {
  if (method !== 'POST') {
    throw new Error('Ожидался POST-запрос');
  }
  response = await request(app)
    .post(path)
    .send({ text: '' });
});

// Проверка статус-кода
Then('API возвращает статус-код {int}', function (code) {
  if (response.status !== code) {
    throw new Error(`Ожидался статус ${code}, получен ${response.status}. Body: ${JSON.stringify(response.body)}`);
  }
});

// Проверка значения поля: число, булево или строка (один шаг для всех)
Then('в ответе поле {string} равно {word}', function (fieldName, expectedWord) {
  const value = response.body[fieldName];
  if (value === undefined) {
    throw new Error(`В ответе отсутствует поле "${fieldName}"`);
  }
  const raw = expectedWord.replace(/^"|"$/g, '');
  const expected = raw === 'true' ? true : raw === 'false' ? false : raw;
  const numExpected = Number(raw);
  const match = typeof value === 'number' && !Number.isNaN(numExpected)
    ? Math.abs(value - numExpected) < 0.01
    : value === expected || String(value) === raw;
  if (!match) {
    throw new Error(`Ожидалось поле "${fieldName}" = ${expected}, получено ${value}`);
  }
});

// Сообщение об ошибке
Then('ответ содержит сообщение об ошибке {string}', function (expectedMessage) {
  if (response.body.message !== expectedMessage && !String(response.body.message).includes(expectedMessage)) {
    throw new Error(`Ожидалось сообщение: "${expectedMessage}", получено: "${response.body.message}"`);
  }
});
