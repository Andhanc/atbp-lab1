const { test, expect } = require('@playwright/test');
const SpamCheckPage = require('./pages/SpamCheckPage');

test.describe('Проверка текста на спам (UI)', () => {
  let spamPage;

  test.beforeEach(async ({ page }) => {
    spamPage = new SpamCheckPage(page);
    await spamPage.navigate();
    await spamPage.waitForSpamWordsLoaded();
  });

  test('позитивный сценарий: текст с известным спамом — процент и выделение', async () => {
    await spamPage.setMessage('купить сейчас выгодно');
    await spamPage.clickCheckSpam();

    await spamPage.expectResultVisible();
    const percent = await spamPage.getSpamPercentText();
    expect(percent).toMatch(/Спам:\s*33\.33%/);

    const html = await spamPage.getHighlightedHtml();
    expect(html).toContain('<strong>');
    expect(html.toLowerCase()).toContain('купить');
  });

  test.describe('разное количество запрещённых слов (data-driven)', () => {
    const cases = [
      {
        name: 'без спама',
        text: 'обычное сообщение без стоп слов',
        expectedPercent: '0%',
      },
      {
        name: 'одно слово из стоп-листа',
        text: 'здесь только спам остальное чисто',
        expectedPercent: '20%',
      },
      {
        name: 'несколько стоп-слов',
        text: 'спам реклама купить срочно',
        expectedPercent: '75%',
      },
    ];

    for (const { name, text, expectedPercent } of cases) {
      test(name, async ({ page }) => {
        const p = new SpamCheckPage(page);
        await p.navigate();
        await p.waitForSpamWordsLoaded();
        await p.setMessage(text);
        await p.clickCheckSpam();
        await p.expectResultVisible();
        const line = await p.getSpamPercentText();
        expect(line).toContain(`Спам: ${expectedPercent}`);
      });
    }
  });

  test('игнорирование регистра: СПАМ и спам дают одинаковый процент', async ({
    page,
  }) => {
    const p = new SpamCheckPage(page);
    await p.navigate();
    await p.waitForSpamWordsLoaded();

    await p.setMessage('Это СПАМ в тексте');
    await p.clickCheckSpam();
    await p.expectResultVisible();
    const upper = await p.getSpamPercentText();

    await p.setMessage('Это спам в тексте');
    await p.clickCheckSpam();
    await p.expectResultVisible();
    const lower = await p.getSpamPercentText();

    expect(upper.replace(/\s+/g, ' ').trim()).toBe(
      lower.replace(/\s+/g, ' ').trim()
    );
  });

  test.describe('негативные сценарии (пустой текст)', () => {
    const emptyCases = [
      { name: 'пустая строка', text: '' },
      { name: 'только пробелы', text: '   \t  ' },
    ];

    for (const { name, text } of emptyCases) {
      test(name, async ({ page }) => {
        const p = new SpamCheckPage(page);
        await p.navigate();
        await p.waitForSpamWordsLoaded();
        await p.setMessage(text);
        await p.clickCheckSpam();
        const err = await p.getErrorText();
        expect(err).toContain('Текст не должен быть пустым');
      });
    }
  });

  test('последовательные действия: список слов загружен, затем проверка сообщения', async ({
    page,
  }) => {
    const p = new SpamCheckPage(page);
    await page.goto('/');
    await expect(page.locator(p.wordsLoadError)).toBeHidden();

    const count = await page.locator(`${p.spamWordsList} li`).count();
    expect(count).toBeGreaterThan(0);

    await p.setMessage('бесплатно предложение');
    await p.clickCheckSpam();
    await p.expectResultVisible();
    expect(await p.getSpamPercentText()).toMatch(/Спам:\s*50%/);
  });
});
