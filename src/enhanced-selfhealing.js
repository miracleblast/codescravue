// enhanced-code-scraper.js - SELF-HEALING HUMANITARIAN EDITION
import { chromium } from 'playwright';
import crypto from 'crypto';

export class EnhancedCodeScraper {
    constructor(config = {}) {
        this.config = {
            // 🚀 SELF-HEALING SETTINGS
            headless: config.headless !== false ? 'new' : false,
            selfHealing: true, // Enable AI-like self-healing
            autoSelectorDiscovery: true,
            selectorEvolution: true,
            
            // 🎭 ADVANCED STEALTH
            fingerprintRotation: 'per-request',
            dynamicFingerprinting: true,
            humanEmulation: true,
            
            // ⚡ PERFORMANCE
            concurrentPages: 3,
            requestDelay: 1500,
            timeout: 45000,
            maxRetries: 3,
            
            // 🔧 MAINTENANCE
            autoUpdateSelectors: true,
            communitySelectorSharing: true, // Users share working selectors
            debugMode: config.debugMode || false,
            
            ...config
        };
        
        this.browser = null;
        this.context = null;
        
        // 🧠 SELF-LEARNING DATABASE
        this.selectorDB = this.initializeSelectorDB();
        this.fingerprintDB = this.initializeFingerprintDB();
        this.platformPatterns = this.initializePlatformPatterns();
        
        // 📊 STATISTICS & SELF-IMPROVEMENT
        this.stats = {
            totalRequests: 0,
            successfulScrapes: 0,
            failedScrapes: 0,
            selectorUpdates: 0,
            autoHeals: 0,
            communitySelectorsUsed: 0
        };
        
        // 🔄 COMMUNITY SELECTOR CACHE (Simulated - real would use API)
        this.communitySelectors = this.loadCommunitySelectors();
        
        console.log('🌍 HUMANITARIAN SCRAPER initialized for Chad 🇹🇩');
        console.log('💰 Proceeds fund solar panels & refugee aid');
    }

    // 🧠 INITIALIZE SELF-LEARNING DATABASES
    initializeSelectorDB() {
        return {
            github: {
                // 🔍 MULTI-LAYER SELECTOR SYSTEM
                repository: [
                    // Layer 1: Modern (2024)
                    '[data-testid="results-list"] a',
                    '.search-title a',
                    '.f4 a',
                    // Layer 2: Legacy
                    '.repo-list-item a',
                    '.Box-row a',
                    '.codesearch-results a',
                    // Layer 3: Generic patterns
                    'a[href*="/"][href*="/"][href*="?"]',
                    'article a',
                    'h3 a'
                ],
                code: [
                    '.code-list a',
                    '.blob-wrapper a',
                    '[itemprop="text"] a'
                ],
                user: [
                    '.user-list a',
                    '.team-list a',
                    '[data-hovercard-type="user"]'
                ],
                // 📊 SELECTOR SCORING (self-learning)
                scores: {},
                lastUpdated: Date.now()
            },
            gitlab: {
                project: [
                    '.project-row a',
                    '.project a',
                    '[data-testid="project-row"] a',
                    '.gl-new-card a',
                    '.project-list-item a'
                ],
                code: [
                    '.file-row a',
                    '.blob-content a'
                ]
            },
            bitbucket: {
                repository: [
                    'li[data-repo-id] a',
                    '.repo-list-item a',
                    '.search-result a'
                ]
            },
            stackoverflow: {
                question: [
                    '.question-summary .question-hyperlink',
                    '.s-post-summary .s-link',
                    '.js-post-summary .s-link'
                ]
            },
            codepen: {
                pen: [
                    '.single-pen .title a',
                    '.pen a',
                    '[data-test-id="pen-link"]'
                ]
            }
        };
    }

    // 🌍 INITIALIZE GLOBAL FINGERPRINT DATABASE
    initializeFingerprintDB() {
        return {
            desktop: [
                // Windows
                {
                    id: 'win-chrome-1',
                    platform: 'Win32',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    screen: { width: 1920, height: 1080 },
                    locale: 'en-US',
                    timezone: 'America/New_York',
                    hardwareConcurrency: 8,
                    deviceMemory: 8,
                    webGL: { vendor: 'Google Inc.', renderer: 'ANGLE (NVIDIA)' }
                },
                {
                    id: 'win-firefox-1',
                    platform: 'Win32',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
                    screen: { width: 1920, height: 1080 },
                    locale: 'en-US',
                    timezone: 'America/Chicago',
                    hardwareConcurrency: 12,
                    deviceMemory: 16
                },
                // macOS
                {
                    id: 'mac-chrome-1',
                    platform: 'MacIntel',
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    screen: { width: 1440, height: 900 },
                    locale: 'en-US',
                    timezone: 'America/Los_Angeles',
                    hardwareConcurrency: 8,
                    deviceMemory: 8,
                    webGL: { vendor: 'Apple Inc.', renderer: 'Apple GPU' }
                },
                {
                    id: 'mac-safari-1',
                    platform: 'MacIntel',
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
                    screen: { width: 1440, height: 900 },
                    locale: 'en-US',
                    timezone: 'America/Los_Angeles',
                    hardwareConcurrency: 8,
                    deviceMemory: 8
                },
                // Linux
                {
                    id: 'linux-chrome-1',
                    platform: 'Linux x86_64',
                    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    screen: { width: 1366, height: 768 },
                    locale: 'en-US',
                    timezone: 'Europe/London',
                    hardwareConcurrency: 4,
                    deviceMemory: 4
                },
                {
                    id: 'linux-firefox-1',
                    platform: 'Linux x86_64',
                    userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0',
                    screen: { width: 1366, height: 768 },
                    locale: 'en-US',
                    timezone: 'Europe/Paris',
                    hardwareConcurrency: 6,
                    deviceMemory: 8
                }
            ],
            mobile: [
                // iOS
                {
                    id: 'ios-safari-1',
                    platform: 'iPhone',
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
                    screen: { width: 390, height: 844 },
                    locale: 'en-US',
                    timezone: 'America/New_York',
                    isMobile: true,
                    hasTouch: true
                },
                // Android
                {
                    id: 'android-chrome-1',
                    platform: 'Linux armv8l',
                    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
                    screen: { width: 412, height: 915 },
                    locale: 'en-US',
                    timezone: 'America/Los_Angeles',
                    isMobile: true,
                    hasTouch: true
                }
            ]
        };
    }

    // 🧩 INITIALIZE PLATFORM PATTERNS FOR AUTO-DISCOVERY
    initializePlatformPatterns() {
        return {
            github: {
                urlPatterns: [
                    'github\\.com/[^/]+/[^/]+',
                    'github\\.com/search',
                    'github\\.com/.*/blob/',
                    'github\\.com/.*/tree/'
                ],
                contentPatterns: [
                    'repository', 'star', 'fork', 'commit', 'issue', 'pull'
                ],
                validation: (url, title) => {
                    return url.includes('github.com') && 
                           title.length > 2 &&
                           !url.includes('github.com/about') &&
                           !url.includes('github.com/pricing');
                }
            },
            gitlab: {
                urlPatterns: [
                    'gitlab\\.com/[^/]+/[^/]+',
                    'gitlab\\.com/explore',
                    'gitlab\\.com/.*/-/blob/'
                ],
                contentPatterns: [
                    'project', 'merge', 'pipeline', 'issue', 'snippet'
                ],
                validation: (url, title) => {
                    return url.includes('gitlab.com') && title.length > 2;
                }
            },
            bitbucket: {
                urlPatterns: [
                    'bitbucket\\.org/[^/]+/[^/]+',
                    'bitbucket\\.org/.*/src/'
                ],
                validation: (url, title) => {
                    return url.includes('bitbucket.org') && title.length > 2;
                }
            },
            stackoverflow: {
                urlPatterns: [
                    'stackoverflow\\.com/questions/',
                    'stackoverflow\\.com/a/'
                ],
                validation: (url, title) => {
                    return url.includes('stackoverflow.com') && title.length > 2;
                }
            },
            codepen: {
                urlPatterns: [
                    'codepen\\.io/[^/]+/pen/',
                    'codepen\\.io/pen/'
                ],
                validation: (url, title) => {
                    return url.includes('codepen.io') && title.length > 2;
                }
            }
        };
    }

    // 🔄 LOAD COMMUNITY SELECTORS (Simulated API)
    loadCommunitySelectors() {
        // In reality, this would fetch from your server
        return {
            github: [
                // Users share working selectors
                '.new-repo-selector-2024', // Example community-found selector
                '[data-qa="repo-link"]',
                '.search-result-item h3 a'
            ],
            gitlab: [
                '.new-gitlab-selector',
                '[data-testid="project-card"] a'
            ]
        };
    }

    // 🚀 SELF-HEALING INITIALIZATION
    async initialize() {
        if (this.browser) return;
        
        // 🎭 DYNAMIC FINGERPRINT SELECTION
        const fingerprintType = Math.random() > 0.3 ? 'desktop' : 'mobile';
        const fingerprints = this.fingerprintDB[fingerprintType];
        this.currentFingerprint = fingerprints[Math.floor(Math.random() * fingerprints.length)];
        
        // 🛡️ STEALTH LAUNCH
        const args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            `--window-size=${this.currentFingerprint.screen.width},${this.currentFingerprint.screen.height}`,
            `--user-agent=${this.currentFingerprint.userAgent}`,
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--ignore-certificate-errors'
        ];
        
        if (this.currentFingerprint.isMobile) {
            args.push('--enable-viewport');
        }

        try {
            this.browser = await chromium.launch({
                headless: this.config.headless,
                args,
                timeout: 60000
            });
            
            this.context = await this.browser.newContext({
                viewport: this.currentFingerprint.screen,
                userAgent: this.currentFingerprint.userAgent,
                locale: this.currentFingerprint.locale,
                timezoneId: this.currentFingerprint.timezone,
                isMobile: this.currentFingerprint.isMobile || false,
                hasTouch: this.currentFingerprint.hasTouch || false,
                ignoreHTTPSErrors: true
            });
            
            // 🔥 INJECT SELF-HEALING STEALTH
            await this.context.addInitScript(this.getSelfHealingStealthScript());
            
            console.log(`✅ SELF-HEALING SCRAPER initialized (${fingerprintType} mode)`);
            console.log(`   User-Agent: ${this.currentFingerprint.userAgent.substring(0, 60)}...`);
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }

    // 🧠 SELF-HEALING SCRAPING ENGINE
    async scrapeGitHub(query, options = {}) {
        console.log(`🌍 Scraping GitHub: "${query}"`);
        
        await this.initialize();
        
        // 🎯 4-STEP SELF-HEALING PROCESS
        const strategies = [
            () => this.scrapeWithKnownSelectors('github', query, options),
            () => this.scrapeWithCommunitySelectors('github', query, options),
            () => this.scrapeWithAutoDiscovery('github', query, options),
            () => this.scrapeWithPatternMatching('github', query, options)
        ];
        
        for (let i = 0; i < strategies.length; i++) {
            try {
                console.log(`🔄 Step ${i + 1}/4: Self-healing attempt`);
                const results = await strategies[i]();
                
                if (results && results.length > 0) {
                    console.log(`✅ Step ${i + 1} succeeded: ${results.length} results`);
                    
                    // 🧠 LEARN FROM SUCCESS
                    if (i > 0) { // If not using known selectors
                        await this.learnNewSelectors('github', results);
                        this.stats.autoHeals++;
                    }
                    
                    return this.enrichResults(results, 'github', options);
                }
            } catch (error) {
                console.log(`⚠️ Step ${i + 1} failed: ${error.message}`);
                continue;
            }
        }
        
        throw new Error('All self-healing strategies failed');
    }

    // 🎯 STRATEGY 1: KNOWN SELECTORS
    async scrapeWithKnownSelectors(platform, query, options) {
        const page = await this.context.newPage();
        
        try {
            const url = this.buildSearchUrl(platform, query, options);
            await page.goto(url, { waitUntil: 'networkidle' });
            
            // WAIT FOR CONTENT
            await page.waitForTimeout(3000);
            
            // TRY ALL KNOWN SELECTORS
            const selectors = [
                ...this.selectorDB[platform].repository,
                ...(this.selectorDB[platform].code || []),
                ...(this.selectorDB[platform].user || [])
            ];
            
            for (const selector of selectors) {
                try {
                    const count = await page.$$eval(selector, elements => elements.length);
                    if (count > 0) {
                        console.log(`   Found ${count} elements with: ${selector}`);
                        
                        const results = await page.$$eval(selector, (elements, platform) => {
                            const platformPatterns = {
                                github: url => url.includes('github.com'),
                                gitlab: url => url.includes('gitlab.com'),
                                bitbucket: url => url.includes('bitbucket.org'),
                                stackoverflow: url => url.includes('stackoverflow.com'),
                                codepen: url => url.includes('codepen.io')
                            };
                            
                            return elements
                                .filter(el => el.href && el.textContent.trim())
                                .filter(el => platformPatterns[platform](el.href))
                                .map(el => ({
                                    title: el.textContent.trim(),
                                    url: el.href,
                                    platform: platform
                                }));
                        }, platform);
                        
                        if (results.length > 0) {
                            // UPDATE SELECTOR SCORE
                            this.updateSelectorScore(platform, selector, true);
                            return results;
                        }
                    }
                } catch (error) {
                    // Selector failed, try next
                    this.updateSelectorScore(platform, selector, false);
                    continue;
                }
            }
            
            return [];
            
        } finally {
            await page.close();
        }
    }

    // 🎯 STRATEGY 2: COMMUNITY SELECTORS
    async scrapeWithCommunitySelectors(platform, query, options) {
        const page = await this.context.newPage();
        
        try {
            const url = this.buildSearchUrl(platform, query, options);
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            
            const communitySelectors = this.communitySelectors[platform] || [];
            for (const selector of communitySelectors) {
                try {
                    const results = await page.$$eval(selector, (elements, platform) => {
                        return elements
                            .filter(el => el.href && el.textContent.trim())
                            .map(el => ({
                                title: el.textContent.trim(),
                                url: el.href,
                                platform: platform,
                                source: 'community'
                            }));
                    }, platform);
                    
                    if (results.length > 0) {
                        console.log(`   Community selector worked: ${selector}`);
                        this.stats.communitySelectorsUsed++;
                        
                        // SHARE BACK TO COMMUNITY
                        await this.shareWorkingSelector(platform, selector);
                        return results;
                    }
                } catch (error) {
                    continue;
                }
            }
            
            return [];
            
        } finally {
            await page.close();
        }
    }

    // 🎯 STRATEGY 3: AUTO-DISCOVERY (AI-LIKE)
    async scrapeWithAutoDiscovery(platform, query, options) {
        const page = await this.context.newPage();
        
        try {
            const url = this.buildSearchUrl(platform, query, options);
            await page.goto(url, { waitUntil: 'networkidle' });
            
            // DISCOVER NEW SELECTORS DYNAMICALLY
            const discoveredSelectors = await page.evaluate((platform) => {
                const candidates = [];
                const allElements = document.querySelectorAll('a, h1, h2, h3, h4, article, div[class*="repo"], div[class*="project"]');
                
                for (const element of allElements) {
                    const text = element.textContent.trim();
                    const href = element.href || element.querySelector('a')?.href;
                    
                    if (text && href && text.length > 2 && text.length < 100) {
                        // CHECK IF IT MATCHES PLATFORM PATTERNS
                        const isPlatformLink = {
                            github: () => href.includes('github.com') && !href.includes('github.com/about'),
                            gitlab: () => href.includes('gitlab.com'),
                            bitbucket: () => href.includes('bitbucket.org'),
                            stackoverflow: () => href.includes('stackoverflow.com'),
                            codepen: () => href.includes('codepen.io')
                        }[platform]();
                        
                        if (isPlatformLink) {
                            // GENERATE SELECTOR FOR THIS ELEMENT
                            const selector = this.generateSelector(element);
                            if (selector) {
                                candidates.push({
                                    selector: selector,
                                    text: text,
                                    href: href,
                                    elementName: element.tagName.toLowerCase()
                                });
                            }
                        }
                    }
                }
                
                return candidates.slice(0, 20); // Top 20 candidates
                
            }, platform);
            
            // TEST DISCOVERED SELECTORS
            for (const candidate of discoveredSelectors) {
                try {
                    const results = await page.$$eval(candidate.selector, (elements, platform) => {
                        return elements
                            .filter(el => el.href || el.querySelector('a')?.href)
                            .map(el => {
                                const href = el.href || el.querySelector('a')?.href;
                                const text = el.textContent.trim();
                                return { title: text, url: href, platform: platform };
                            });
                    }, platform);
                    
                    if (results.length >= 3) { // Found at least 3 valid results
                        console.log(`   🔍 Discovered new selector: ${candidate.selector}`);
                        
                        // ADD TO DATABASE
                        this.addNewSelector(platform, candidate.selector);
                        return results;
                    }
                } catch (error) {
                    continue;
                }
            }
            
            return [];
            
        } finally {
            await page.close();
        }
    }

    // 🎯 STRATEGY 4: PATTERN MATCHING (LAST RESORT)
    async scrapeWithPatternMatching(platform, query, options) {
        const page = await this.context.newPage();
        
        try {
            const url = this.buildSearchUrl(platform, query, options);
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            
            // GET ALL TEXT AND LINKS
            const content = await page.content();
            
            // EXTRACT USING REGEX PATTERNS
            const patterns = this.platformPatterns[platform];
            const results = [];
            
            if (patterns.urlPatterns) {
                for (const pattern of patterns.urlPatterns) {
                    const regex = new RegExp(`https?://${pattern}/?[^\\s"'<>]*`, 'gi');
                    const matches = content.match(regex) || [];
                    
                    for (const url of matches) {
                        // EXTRACT TITLE FROM CONTEXT
                        const titleMatch = content.match(new RegExp(`[^>]*${url}[^<]*`, 'i'));
                        let title = 'Unknown';
                        if (titleMatch) {
                            title = titleMatch[0].replace(/<[^>]*>/g, '').trim().substring(0, 100);
                        }
                        
                        if (patterns.validation(url, title)) {
                            results.push({
                                title: title || url.split('/').pop(),
                                url: url,
                                platform: platform,
                                source: 'pattern-matching'
                            });
                        }
                    }
                }
            }
            
            // REMOVE DUPLICATES
            const uniqueResults = [];
            const seenUrls = new Set();
            
            for (const result of results) {
                if (!seenUrls.has(result.url)) {
                    seenUrls.add(result.url);
                    uniqueResults.push(result);
                }
            }
            
            return uniqueResults.slice(0, options.maxResults || 20);
            
        } finally {
            await page.close();
        }
    }

    // 🧠 LEARN FROM SUCCESSFUL SCRAPES
    async learnNewSelectors(platform, results) {
        if (!this.config.autoUpdateSelectors || results.length === 0) return;
        
        console.log(`   🧠 Learning from ${results.length} successful results...`);
        
        // SAMPLE A FEW RESULTS TO LEARN FROM
        const sample = results.slice(0, 3);
        const page = await this.context.newPage();
        
        try {
            for (const result of sample) {
                await page.goto(result.url, { waitUntil: 'domcontentloaded' });
                
                // ANALYZE PAGE STRUCTURE
                const newSelectors = await page.evaluate(() => {
                    const selectors = new Set();
                    
                    // FIND COMMON PATTERNS IN SUCCESSFUL PAGES
                    document.querySelectorAll('a, h1, h2, h3, article').forEach(el => {
                        const classes = el.className;
                        if (classes) {
                            classes.split(' ').forEach(cls => {
                                if (cls.length > 3 && !cls.includes('-')) {
                                    selectors.add(`.${cls}`);
                                }
                            });
                        }
                        
                        const id = el.id;
                        if (id) {
                            selectors.add(`#${id}`);
                        }
                    });
                    
                    return Array.from(selectors);
                });
                
                // ADD NEW SELECTORS TO DATABASE
                newSelectors.forEach(selector => {
                    if (!this.selectorDB[platform].repository.includes(selector)) {
                        this.selectorDB[platform].repository.push(selector);
                        console.log(`   ➕ Added new selector: ${selector}`);
                        this.stats.selectorUpdates++;
                    }
                });
            }
        } catch (error) {
            // Silent fail - learning is optional
        } finally {
            await page.close();
        }
    }

    // 🔄 UPDATE SELECTOR SCORES (SELF-LEARNING)
    updateSelectorScore(platform, selector, success) {
        if (!this.selectorDB[platform].scores) {
            this.selectorDB[platform].scores = {};
        }
        
        if (!this.selectorDB[platform].scores[selector]) {
            this.selectorDB[platform].scores[selector] = { success: 0, failure: 0 };
        }
        
        if (success) {
            this.selectorDB[platform].scores[selector].success++;
        } else {
            this.selectorDB[platform].scores[selector].failure++;
        }
        
        // REORDER SELECTORS BASED ON SUCCESS RATE
        this.optimizeSelectorOrder(platform);
    }

    // 📈 OPTIMIZE SELECTOR ORDER
    optimizeSelectorOrder(platform) {
        const selectors = this.selectorDB[platform].repository;
        const scores = this.selectorDB[platform].scores;
        
        if (!scores || Object.keys(scores).length === 0) return;
        
        selectors.sort((a, b) => {
            const scoreA = scores[a] ? scores[a].success / (scores[a].success + scores[a].failure) : 0;
            const scoreB = scores[b] ? scores[b].success / (scores[b].success + scores[b].failure) : 0;
            return scoreB - scoreA; // Descending order
        });
        
        this.selectorDB[platform].lastUpdated = Date.now();
    }

    // 🤝 SHARE WORKING SELECTORS WITH COMMUNITY
    async shareWorkingSelector(platform, selector) {
        if (!this.config.communitySelectorSharing) return;
        
        // IN REALITY, THIS WOULD POST TO YOUR API
        console.log(`   🤝 Sharing selector with community: ${selector}`);
        
        // SIMULATED API CALL
        try {
            // await fetch('https://your-api.com/selectors/share', {
            //     method: 'POST',
            //     body: JSON.stringify({ platform, selector, app: 'codescraper-chad' })
            // });
        } catch (error) {
            // Silent fail - sharing is optional
        }
    }

    // 🏗️ BUILD SEARCH URLS
    buildSearchUrl(platform, query, options) {
        const encodedQuery = encodeURIComponent(query);
        
        const urls = {
            github: `https://github.com/search?q=${encodedQuery}&type=repositories`,
            gitlab: `https://gitlab.com/explore/projects?search=${encodedQuery}`,
            bitbucket: `https://bitbucket.org/repo/all?name=${encodedQuery}`,
            stackoverflow: `https://stackoverflow.com/search?q=${encodedQuery}`,
            codepen: `https://codepen.io/search/pens?q=${encodedQuery}`
        };
        
        return urls[platform];
    }

    // 💎 ENRICH RESULTS
    async enrichResults(results, platform, options) {
        if (!options.enrich || results.length === 0) {
            return results.map(r => ({
                ...r,
                timestamp: new Date().toISOString(),
                humanitarian: true // 🇹🇩
            }));
        }
        
        const enriched = [];
        for (const result of results.slice(0, 10)) { // Limit enrichment
            try {
                await this.humanDelay();
                
                enriched.push({
                    ...result,
                    enriched: true,
                    timestamp: new Date().toISOString(),
                    humanitarian: true,
                    message: 'Proceeds fund solar panels for Chad 🇹🇩'
                });
            } catch (error) {
                enriched.push({
                    ...result,
                    enriched: false,
                    timestamp: new Date().toISOString(),
                    humanitarian: true
                });
            }
        }
        
        return enriched;
    }

    // 🛡️ SELF-HEALING STEALTH SCRIPT
    getSelfHealingStealthScript() {
        const fp = this.currentFingerprint;
        
        return `
            // 🚫 ULTIMATE STEALTH WITH SELF-HEALING
            (() => {
                // REMOVE AUTOMATION
                Object.defineProperty(navigator, 'webdriver', { get: () => false });
                
                // SPOOF PROPERTIES
                const spoof = {
                    userAgent: '${fp.userAgent}',
                    platform: '${fp.platform}',
                    hardwareConcurrency: ${fp.hardwareConcurrency || 8},
                    deviceMemory: ${fp.deviceMemory || 8}
                };
                
                Object.keys(spoof).forEach(key => {
                    Object.defineProperty(navigator, key, { get: () => spoof[key] });
                });
                
                // HEAL BROKEN SELECTORS
                const originalQuerySelector = Document.prototype.querySelector;
                const originalQuerySelectorAll = Document.prototype.querySelectorAll;
                
                Document.prototype.querySelector = function(selector) {
                    try {
                        return originalQuerySelector.call(this, selector);
                    } catch (error) {
                        // SELF-HEAL: Try alternative selectors
                        const alternatives = {
                            '.repo-list-item': '[data-testid="results-list"] a, .search-title a',
                            '.project-row': '.project a, [data-testid="project-row"]'
                        };
                        
                        if (alternatives[selector]) {
                            return originalQuerySelector.call(this, alternatives[selector]);
                        }
                        return null;
                    }
                };
                
                console.log('✅ Self-healing stealth activated for Chad 🇹🇩');
            })();
        `;
    }

    // ⏳ HUMAN DELAY
    async humanDelay() {
        const delay = this.config.requestDelay + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // 🔄 IMPLEMENT OTHER PLATFORMS USING SAME PATTERN
    async scrapeGitLab(query, options = {}) {
        return this.scrapeWithSelfHealing('gitlab', query, options);
    }
    
    async scrapeBitbucket(query, options = {}) {
        return this.scrapeWithSelfHealing('bitbucket', query, options);
    }
    
    async scrapeStackOverflow(query, options = {}) {
        return this.scrapeWithSelfHealing('stackoverflow', query, options);
    }
    
    async scrapeCodePen(query, options = {}) {
        return this.scrapeWithSelfHealing('codepen', query, options);
    }
    
    async scrapeWithSelfHealing(platform, query, options) {
        console.log(`🌍 Scraping ${platform}: "${query}"`);
        
        await this.initialize();
        
        const strategies = [
            () => this.scrapeWithKnownSelectors(platform, query, options),
            () => this.scrapeWithCommunitySelectors(platform, query, options),
            () => this.scrapeWithAutoDiscovery(platform, query, options)
        ];
        
        for (let i = 0; i < strategies.length; i++) {
            try {
                const results = await strategies[i]();
                if (results && results.length > 0) {
                    return this.enrichResults(results, platform, options);
                }
            } catch (error) {
                continue;
            }
        }
        
        throw new Error(`${platform} scraping failed`);
    }

    // 🔄 RETRY WITH BACKOFF
    async scrapeWithRetry(platform, query, options, maxRetries = 3) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`   🔄 Retry ${attempt}/${maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                }
                
                switch (platform) {
                    case 'github': return await this.scrapeGitHub(query, options);
                    case 'gitlab': return await this.scrapeGitLab(query, options);
                    case 'bitbucket': return await this.scrapeBitbucket(query, options);
                    case 'stackoverflow': return await this.scrapeStackOverflow(query, options);
                    case 'codepen': return await this.scrapeCodePen(query, options);
                    default: throw new Error(`Unknown platform: ${platform}`);
                }
            } catch (error) {
                if (attempt === maxRetries) throw error;
            }
        }
    }

    // 📊 GET STATISTICS
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.successfulScrapes / (this.stats.successfulScrapes + this.stats.failedScrapes) || 0,
            autoHealRate: this.stats.autoHeals / this.stats.totalRequests || 0,
            message: 'Supporting Chad 🇹🇩 - Solar Panels & Refugee Aid'
        };
    }

    // 🧹 CLEANUP
    async close() {
        if (this.context) await this.context.close().catch(() => {});
        if (this.browser) await this.browser.close().catch(() => {});
        console.log('✅ Self-healing scraper closed');
    }
}