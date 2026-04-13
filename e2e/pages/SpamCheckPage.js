class SpamCheckPage {
  constructor(page) {
    this.page = page;
    this.messageInput = '#messageInput';
    this.checkSpamButton = '#checkSpamBtn';
    this.spamWordsList = '#spamWordsList';
    this.errorArea = '#errorArea';
    this.resultArea = '#resultArea';
    this.spamPercentLine = '#spamPercentLine';
    this.highlightedMessage = '#highlightedMessage';
    this.wordsLoadError = '#wordsLoadError';
  }

  async navigate() {
    await this.page.goto('/');
    await this.page.locator(this.spamWordsList).waitFor({ state: 'visible' });
  }

  /** Дождаться загрузки списка слов с сервера (не пустой список). */
  async waitForSpamWordsLoaded() {
    await this.page.locator(`${this.spamWordsList} li`).first().waitFor({
      state: 'visible',
      timeout: 10_000,
    });
  }

  async setMessage(text) {
    await this.page.fill(this.messageInput, text);
  }

  async clearMessage() {
    await this.page.fill(this.messageInput, '');
  }

  async clickCheckSpam() {
    await this.page.click(this.checkSpamButton);
  }

  async getSpamPercentText() {
    return this.page.locator(this.spamPercentLine).textContent();
  }

  async getHighlightedHtml() {
    return this.page.locator(this.highlightedMessage).innerHTML();
  }

  async getErrorText() {
    const err = this.page.locator(this.errorArea);
    await err.waitFor({ state: 'visible' });
    return err.textContent();
  }

  async expectResultVisible() {
    await this.page.locator(this.resultArea).waitFor({ state: 'visible' });
  }
}

module.exports = SpamCheckPage;
