// ConfigService - сервис для загрузки списка запрещенных слов
class ConfigService {
    constructor() {
        this.cache = null;
        this.loadingPromise = null;
    }

    /**
     * Загружает список запрещенных слов из внешнего источника
     * @returns {Promise<string[]>} Promise с массивом запрещенных слов
     */
    async getBlacklist() {
        // Если уже загружается, возвращаем тот же промис
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        // Если уже загружено, возвращаем из кэша
        if (this.cache !== null) {
            return Promise.resolve(this.cache);
        }

        // Имитация загрузки из внешней базы данных или API
        this.loadingPromise = new Promise((resolve, reject) => {
            // Имитация сетевой задержки
            setTimeout(() => {
                // В реальном приложении здесь был бы запрос к API/БД
                const blacklist = ['спам', 'реклама', 'купить', 'бесплатно', 'акция'];
                this.cache = blacklist;
                this.loadingPromise = null;
                resolve(blacklist);
            }, 100);
        });

        return this.loadingPromise;
    }

    /**
     * Сбрасывает кэш (для тестирования)
     */
    resetCache() {
        this.cache = null;
        this.loadingPromise = null;
    }
}

// Создаем singleton экземпляр
const configService = new ConfigService();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConfigService, configService };
}

if (typeof window !== 'undefined') {
    window.ConfigService = ConfigService;
    window.configService = configService;
}
