// enhanced-code-scraper.js - BEAST MODE EDITION
import { chromium } from 'playwright';
import crypto from 'crypto';

export class EnhancedCodeScraper {
    constructor(config = {}) {
        this.config = {
            // 🚀 BEAST MODE SETTINGS
            headless: config.headless || 'new',
            stealthLevel: config.stealthLevel || 'nuclear',
            fingerprintSpoofing: true,
            humanize: true,
            requestDelay: config.requestDelay || 1000,
            timeout: config.timeout || 30000,
            maxRetries: config.maxRetries || 3,
            
            // 🔌 PROXY SUPPORT
            proxy: config.proxy || null,
            proxyRotation: config.proxyRotation || 'round-robin',
            
            // 🛡️ BLOCKING
            blockTrackers: true,
            blockAds: true,
            
            ...config
        };
        
        this.browser = null;
        this.context = null;
        this.pages = new Map();
        this.retryCount = 0;
        this.blockedCount = 0;
        this.results = [];
        
        // 🎯 FINGERPRINT DATABASE
        this.fingerprintDB = this.generateFingerprintDB();
    }

    // 🔥 INITIALIZE WITH NUCLEAR STEALTH
    async initialize() {
        console.log('🚀 Initializing BEAST MODE scraper...');
        
        if (this.browser) {
            return; // Already initialized
        }
        
        const fingerprint = this.generateNuclearFingerprint();
        
        // 🎭 ULTIMATE BROWSER ARGS
        const args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            `--window-size=${fingerprint.screen.width},${fingerprint.screen.height}`,
            `--user-agent=${fingerprint.userAgent}`,
            `--lang=${fingerprint.locale}`,
            '--ignore-certificate-errors',
            '--ignore-ssl-errors'
        ];

        // Add proxy if available
        if (this.config.proxy) {
            args.push(`--proxy-server=${this.config.proxy}`);
            console.log(`🔌 Using proxy: ${this.config.proxy}`);
        }

        // 🚀 LAUNCH BROWSER
        const launchOptions = {
            headless: this.config.headless,
            args: args,
            ignoreDefaultArgs: ['--enable-automation'],
            timeout: 60000,
            ignoreHTTPSErrors: true
        };

        try {
            this.browser = await chromium.launch(launchOptions);
            
            // 🎭 CREATE CONTEXT WITH STEALTH
            this.context = await this.browser.newContext({
                viewport: {
                    width: fingerprint.screen.width,
                    height: fingerprint.screen.height
                },
                userAgent: fingerprint.userAgent,
                locale: fingerprint.locale,
                timezoneId: fingerprint.timezone,
                geolocation: fingerprint.geolocation,
                permissions: ['geolocation'],
                ignoreHTTPSErrors: true,
                bypassCSP: true,
                javaScriptEnabled: true
            });

            // 🔥 INJECT STEALTH SCRIPT
            await this.context.addInitScript(this.getStealthScript(fingerprint));
            
            // 🛡️ SETUP ADVANCED ROUTING
            await this.setupAdvancedRouting();

            console.log('✅ BEAST MODE scraper initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize scraper:', error);
            throw error;
        }
    }

    // 🎭 GENERATE NUCLEAR FINGERPRINT
    generateNuclearFingerprint() {
        const fingerprints = [
            {
                id: crypto.randomUUID(),
                platform: 'Win32',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                screen: { width: 1920, height: 1080 },
                language: 'en-US',
                locale: 'en-US',
                timezone: 'America/New_York',
                geolocation: { latitude: 40.7128, longitude: -74.0060 }
            },
            {
                id: crypto.randomUUID(),
                platform: 'MacIntel',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                screen: { width: 1440, height: 900 },
                language: 'en-US',
                locale: 'en-US',
                timezone: 'America/Los_Angeles',
                geolocation: { latitude: 34.0522, longitude: -118.2437 }
            }
        ];
        
        return fingerprints[Math.floor(Math.random() * fingerprints.length)];
    }

    // 🛡️ STEALTH SCRIPT
    getStealthScript(fingerprint) {
        return `
            // 🚫 REMOVE AUTOMATION TRACES
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            
            // 🎭 OVERWRITE LANGUAGES
            Object.defineProperty(navigator, 'languages', {
                get: () => ['${fingerprint.language}', 'en']
            });
            
            // 🎭 OVERWRITE PLATFORM
            Object.defineProperty(navigator, 'platform', {
                get: () => '${fingerprint.platform}'
            });
            
            // 🎭 OVERWRITE USER AGENT
            Object.defineProperty(navigator, 'userAgent', {
                get: () => '${fingerprint.userAgent}'
            });
            
            // 🎭 OVERWRITE HARDWARE CONCURRENCY
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => 8
            });
            
            // 🎭 OVERWRITE DEVICE MEMORY
            Object.defineProperty(navigator, 'deviceMemory', {
                get: () => 8
            });
            
            // 🖥️ SPOOF SCREEN PROPERTIES
            Object.defineProperty(screen, 'width', { get: () => ${fingerprint.screen.width} });
            Object.defineProperty(screen, 'height', { get: () => ${fingerprint.screen.height} });
            Object.defineProperty(screen, 'availWidth', { get: () => ${fingerprint.screen.width - 100} });
            Object.defineProperty(screen, 'availHeight', { get: () => ${fingerprint.screen.height - 100} });
            
            // 🌍 SPOOF TIMEZONE
            const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
            Date.prototype.getTimezoneOffset = function() {
                return -300; // EST offset
            };
            
            console.log('✅ Stealth mode activated');
        `;
    }

    // 🌐 SETUP ADVANCED ROUTING
    async setupAdvancedRouting() {
        await this.context.route('**/*', async (route, request) => {
            const url = request.url();
            
            // 🚫 BLOCK TRACKERS & ADS
            if (this.shouldBlock(url)) {
                await route.abort();
                return;
            }
            
            // 🎭 MODIFY HEADERS
            const headers = request.headers();
            this.modifyHeaders(headers);
            
            await route.continue({ headers });
        });
    }

    shouldBlock(url) {
        const blockedDomains = [
            'google-analytics.com',
            'googletagmanager.com',
            'doubleclick.net',
            'facebook.net',
            'scorecardresearch.com'
        ];
        
        for (const domain of blockedDomains) {
            if (url.includes(domain)) {
                return true;
            }
        }
        
        return false;
    }

    modifyHeaders(headers) {
        headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
        headers['Accept-Language'] = 'en-US,en;q=0.9';
        headers['Accept-Encoding'] = 'gzip, deflate, br';
        headers['Upgrade-Insecure-Requests'] = '1';
        headers['Sec-Fetch-Dest'] = 'document';
        headers['Sec-Fetch-Mode'] = 'navigate';
        headers['Sec-Fetch-Site'] = 'none';
        headers['Sec-Fetch-User'] = '?1';
        headers['Cache-Control'] = 'max-age=0';
        headers['DNT'] = '1';
        
        // 🎭 RANDOM REFERER
        const referers = [
            'https://www.google.com/',
            'https://www.bing.com/',
            'https://duckduckgo.com/',
            ''
        ];
        headers['Referer'] = referers[Math.floor(Math.random() * referers.length)];
    }

    // 🔍 GITHUB SCRAPING - BEAST MODE
    async scrapeGitHub(query, options = {}) {
        console.log(`🔍 Scraping GitHub: ${query}`);
        
        await this.initialize();
        const page = await this.context.newPage();
        
        try {
            // 🎭 HUMAN-LIKE BEHAVIOR
            await this.simulateHumanBehavior(page);
            
            // 🔗 BUILD SEARCH URL
            const searchUrl = this.buildGitHubSearchUrl(query, options);
            console.log(`🌐 Navigating to: ${searchUrl}`);
            
            await page.goto(searchUrl, {
                waitUntil: 'networkidle',
                timeout: this.config.timeout
            });
            
            // 🛡️ CHECK FOR BLOCKS
            const isBlocked = await this.checkForBlocks(page);
            if (isBlocked) {
                throw new Error('Blocked by GitHub');
            }
            
            // 📊 EXTRACT RESULTS
            const results = await this.extractGitHubResults(page, options);
            console.log(`✅ Found ${results.length} results`);
            
            // 💾 ENRICH RESULTS
            const enrichedResults = await this.enrichGitHubResults(results, options);
            
            return enrichedResults;
            
        } catch (error) {
            console.error('❌ GitHub scraping failed:', error);
            throw error;
        } finally {
            await page.close();
        }
    }

    buildGitHubSearchUrl(query, options) {
        const params = new URLSearchParams();
        params.append('q', query);
        
        if (options.language) {
            params.append('l', options.language);
        }
        
        if (options.minStars) {
            params.append('stars', `>=${options.minStars}`);
        }
        
        if (options.updatedAfter) {
            params.append('pushed', `>${options.updatedAfter}`);
        }
        
        return `https://github.com/search?${params.toString()}&type=repositories`;
    }

    async extractGitHubResults(page, options) {
        const results = [];
        
        // 🔄 HANDLE PAGINATION
        let hasNextPage = true;
        let pageNum = 1;
        const maxPages = Math.ceil(options.maxResults / 30) || 2;
        
        while (hasNextPage && results.length < options.maxResults && pageNum <= maxPages) {
            console.log(`📄 Processing page ${pageNum}`);
            
            // ⏳ HUMAN-LIKE DELAY
            await this.humanDelay();
            
            // 📝 EXTRACT CURRENT PAGE
            const pageResults = await page.evaluate(() => {
                const items = [];
                const repoElements = document.querySelectorAll('.repo-list-item, .Box-row');
                
                for (const element of repoElements) {
                    const titleElement = element.querySelector('a[data-hydro-click*="REPOSITORY"]');
                    const descriptionElement = element.querySelector('p');
                    const languageElement = element.querySelector('[itemprop="programmingLanguage"]');
                    const starsElement = element.querySelector('a[href*="stargazers"]');
                    
                    if (titleElement) {
                        items.push({
                            title: titleElement.textContent.trim(),
                            url: titleElement.href,
                            description: descriptionElement ? descriptionElement.textContent.trim() : '',
                            language: languageElement ? languageElement.textContent.trim() : null,
                            stars: starsElement ? parseInt(starsElement.textContent.trim().replace(',', '')) : 0
                        });
                    }
                }
                
                return items;
            });
            
            results.push(...pageResults);
            
            // 🔗 CHECK FOR NEXT PAGE
            const nextPageButton = await page.$('.pagination a[rel="next"]');
            if (nextPageButton && pageNum < maxPages) {
                await nextPageButton.click();
                await page.waitForLoadState('networkidle');
                pageNum++;
            } else {
                hasNextPage = false;
            }
        }
        
        return results.slice(0, options.maxResults);
    }

    async enrichGitHubResults(results, options) {
        const enriched = [];
        
        for (const result of results) {
            try {
                // 🎯 GET ADDITIONAL DETAILS
                const details = await this.getRepositoryDetails(result.url);
                
                enriched.push({
                    ...result,
                    ...details,
                    platform: 'github',
                    date: new Date().toISOString(),
                    scraped: true
                });
                
                // ⏳ RATE LIMITING
                await this.humanDelay();
                
            } catch (error) {
                console.warn(`⚠️ Could not enrich ${result.title}:`, error.message);
                enriched.push({
                    ...result,
                    platform: 'github',
                    date: new Date().toISOString(),
                    scraped: false
                });
            }
        }
        
        return enriched;
    }

    async getRepositoryDetails(url) {
        const page = await this.context.newPage();
        
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
            
            return await page.evaluate(() => {
                const details = {};
                
                // 📊 GET README
                const readmeElement = document.querySelector('#readme');
                if (readmeElement) {
                    details.readme = readmeElement.textContent.trim().substring(0, 1000);
                }
                
                // 📁 GET FILE COUNT
                const fileElements = document.querySelectorAll('[role="rowheader"]');
                details.fileCount = fileElements.length;
                
                // 🔄 GET LAST UPDATED
                const updatedElement = document.querySelector('relative-time');
                if (updatedElement) {
                    details.lastUpdated = updatedElement.getAttribute('datetime');
                }
                
                return details;
            });
            
        } finally {
            await page.close();
        }
    }

    // 🔄 GITLAB SCRAPING
    async scrapeGitLab(query, options = {}) {
        console.log(`🔍 Scraping GitLab: ${query}`);
        
        await this.initialize();
        const page = await this.context.newPage();
        
        try {
            const searchUrl = `https://gitlab.com/search?search=${encodeURIComponent(query)}`;
            await page.goto(searchUrl, { waitUntil: 'networkidle' });
            
            await this.humanDelay();
            
            const results = await page.evaluate(() => {
                const items = [];
                const projectElements = document.querySelectorAll('.project-row');
                
                for (const element of projectElements) {
                    const titleElement = element.querySelector('.project-full-name');
                    const descriptionElement = element.querySelector('.description');
                    const starsElement = element.querySelector('.stars-count');
                    
                    if (titleElement) {
                        items.push({
                            title: titleElement.textContent.trim(),
                            url: titleElement.href,
                            description: descriptionElement ? descriptionElement.textContent.trim() : '',
                            stars: starsElement ? parseInt(starsElement.textContent.trim()) : 0,
                            platform: 'gitlab'
                        });
                    }
                }
                
                return items;
            });
            
            return results.slice(0, options.maxResults);
            
        } catch (error) {
            console.error('❌ GitLab scraping failed:', error);
            throw error;
        } finally {
            await page.close();
        }
    }

    // 🔄 BITBUCKET SCRAPING
    async scrapeBitbucket(query, options = {}) {
        console.log(`🔍 Scraping Bitbucket: ${query}`);
        
        await this.initialize();
        const page = await this.context.newPage();
        
        try {
            const searchUrl = `https://bitbucket.org/repo/all?name=${encodeURIComponent(query)}`;
            await page.goto(searchUrl, { waitUntil: 'networkidle' });
            
            await this.humanDelay();
            
            const results = await page.evaluate(() => {
                const items = [];
                const repoElements = document.querySelectorAll('.repo-list-item');
                
                for (const element of repoElements) {
                    const titleElement = element.querySelector('.repo-link');
                    const descriptionElement = element.querySelector('.description');
                    
                    if (titleElement) {
                        items.push({
                            title: titleElement.textContent.trim(),
                            url: titleElement.href,
                            description: descriptionElement ? descriptionElement.textContent.trim() : '',
                            platform: 'bitbucket'
                        });
                    }
                }
                
                return items;
            });
            
            return results.slice(0, options.maxResults);
            
        } catch (error) {
            console.error('❌ Bitbucket scraping failed:', error);
            throw error;
        } finally {
            await page.close();
        }
    }

    // 🔄 STACK OVERFLOW SCRAPING
    async scrapeStackOverflow(query, options = {}) {
        console.log(`🔍 Scraping Stack Overflow: ${query}`);
        
        await this.initialize();
        const page = await this.context.newPage();
        
        try {
            const searchUrl = `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`;
            await page.goto(searchUrl, { waitUntil: 'networkidle' });
            
            await this.humanDelay();
            
            const results = await page.evaluate(() => {
                const items = [];
                const questionElements = document.querySelectorAll('.question-summary');
                
                for (const element of questionElements) {
                    const titleElement = element.querySelector('.question-hyperlink');
                    const votesElement = element.querySelector('.vote-count-post');
                    const answerElement = element.querySelector('.status strong');
                    const tagsElements = element.querySelectorAll('.post-tag');
                    
                    if (titleElement) {
                        items.push({
                            title: titleElement.textContent.trim(),
                            url: titleElement.href,
                            votes: votesElement ? parseInt(votesElement.textContent.trim()) : 0,
                            answers: answerElement ? parseInt(answerElement.textContent.trim()) : 0,
                            tags: Array.from(tagsElements).map(tag => tag.textContent.trim()),
                            platform: 'stackoverflow'
                        });
                    }
                }
                
                return items;
            });
            
            return results.slice(0, options.maxResults);
            
        } catch (error) {
            console.error('❌ Stack Overflow scraping failed:', error);
            throw error;
        } finally {
            await page.close();
        }
    }

    // 🔄 CODE PEN SCRAPING
    async scrapeCodePen(query, options = {}) {
        console.log(`🔍 Scraping CodePen: ${query}`);
        
        await this.initialize();
        const page = await this.context.newPage();
        
        try {
            const searchUrl = `https://codepen.io/search/pens?q=${encodeURIComponent(query)}`;
            await page.goto(searchUrl, { waitUntil: 'networkidle' });
            
            await this.humanDelay();
            
            const results = await page.evaluate(() => {
                const items = [];
                const penElements = document.querySelectorAll('.single-pen');
                
                for (const element of penElements) {
                    const titleElement = element.querySelector('.title a');
                    const authorElement = element.querySelector('.author a');
                    const heartElement = element.querySelector('.heart-count');
                    
                    if (titleElement) {
                        items.push({
                            title: titleElement.textContent.trim(),
                            url: titleElement.href,
                            author: authorElement ? authorElement.textContent.trim() : '',
                            likes: heartElement ? parseInt(heartElement.textContent.trim()) : 0,
                            platform: 'codepen'
                        });
                    }
                }
                
                return items;
            });
            
            return results.slice(0, options.maxResults);
            
        } catch (error) {
            console.error('❌ CodePen scraping failed:', error);
            throw error;
        } finally {
            await page.close();
        }
    }

    // 🔄 MULTI-PLATFORM SCRAPING WITH RETRY
    async scrapeWithRetry(platform, query, options, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt}/${maxRetries} for ${platform}`);
                
                switch (platform) {
                    case 'github':
                        return await this.scrapeGitHub(query, options);
                    case 'gitlab':
                        return await this.scrapeGitLab(query, options);
                    case 'bitbucket':
                        return await this.scrapeBitbucket(query, options);
                    case 'stackoverflow':
                        return await this.scrapeStackOverflow(query, options);
                    case 'codepen':
                        return await this.scrapeCodePen(query, options);
                    default:
                        throw new Error(`Unsupported platform: ${platform}`);
                }
                
            } catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    // 🔄 ROTATE FINGERPRINT ON FAILURE
                    await this.rotateFingerprint();
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
                }
            }
        }
        
        throw lastError;
    }

    // 🎭 HUMAN-LIKE BEHAVIOR
    async simulateHumanBehavior(page) {
        // Random mouse movements
        await page.mouse.move(
            Math.random() * 500,
            Math.random() * 500
        );
        
        // Random scroll
        await page.evaluate(async () => {
            await new Promise(resolve => {
                window.scrollBy(0, Math.random() * 300);
                setTimeout(resolve, 100 + Math.random() * 200);
            });
        });
        
        // Random typing simulation
        await page.keyboard.press('Tab');
    }

    async humanDelay() {
        const delay = this.config.requestDelay + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    async checkForBlocks(page) {
        const content = await page.content();
        const blockedIndicators = [
            'captcha',
            'rate limit',
            'blocked',
            'security check',
            'access denied'
        ];
        
        return blockedIndicators.some(indicator => 
            content.toLowerCase().includes(indicator)
        );
    }

    async rotateFingerprint() {
        console.log('🎭 Rotating fingerprint...');
        
        // Close existing context
        if (this.context) {
            await this.context.close();
        }
        
        // Reinitialize with new fingerprint
        await this.initialize();
    }

    // 📊 GET STATS
    getStats() {
        return {
            requests: this.retryCount,
            blockedAttempts: this.blockedCount,
            resultsFound: this.results.length,
            memoryUsage: process.memoryUsage()
        };
    }

    // 🧹 CLEANUP
    async close() {
        console.log('🧹 Cleaning up scraper...');
        
        for (const page of this.pages.values()) {
            try {
                await page.close();
            } catch (error) {
                console.error('Error closing page:', error);
            }
        }
        this.pages.clear();
        
        if (this.context) {
            await this.context.close();
            this.context = null;
        }
        
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
        
        console.log('✅ Scraper closed');
    }

    // 🎯 HELPER METHODS
    generateFingerprintDB() {
        return {
            userAgents: [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ],
            screenResolutions: [
                { width: 1920, height: 1080 },
                { width: 1366, height: 768 },
                { width: 1440, height: 900 },
                { width: 1536, height: 864 }
            ],
            timezones: [
                'America/New_York',
                'America/Los_Angeles',
                'Europe/London',
                'Europe/Paris',
                'Asia/Tokyo'
            ]
        };
    }
}