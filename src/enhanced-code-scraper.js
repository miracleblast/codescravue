// enhanced-code-scraper.js
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

export class EnhancedCodeScraper {
    constructor(config = {}) {
        this.config = {
            headless: true,
            timeout: 30000,
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            ...config
        };
        
        this.browser = null;
        this.context = null;
        this.page = null;
        this.isInitialized = false;
        this.activeScrapers = new Map();
        this.stats = {
            totalRequests: 0,
            successfulScrapes: 0,
            failedScrapes: 0,
            totalResults: 0,
            platforms: {}
        };
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🚀 Initializing Enhanced Code Scraper...');
            
            this.browser = await chromium.launch({
                headless: this.config.headless,
                timeout: this.config.timeout
            });

            this.context = await this.browser.newContext({
                viewport: this.config.viewport,
                userAgent: this.config.userAgent,
                ignoreHTTPSErrors: true,
                javaScriptEnabled: true
            });

            // Set up request interception for better performance
            await this.context.route('**/*', (route) => {
                const resourceType = route.request().resourceType();
                // Block images, fonts, and media for faster scraping
                if (['image', 'font', 'media'].includes(resourceType)) {
                    route.abort();
                } else {
                    route.continue();
                }
            });

            this.page = await this.context.newPage();
            
            // Set default timeouts
            this.page.setDefaultTimeout(this.config.timeout);
            this.page.setDefaultNavigationTimeout(this.config.timeout * 2);

            this.isInitialized = true;
            console.log('✅ Enhanced Code Scraper initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Enhanced Code Scraper:', error);
            throw error;
        }
    }

    // 🎯 GITHUB SCRAPER (Enhanced)
    async scrapeGitHub(query, options = {}) {
        const {
            maxResults = 50,
            language = '',
            includeForks = false,
            includeArchived = false,
            minStars = 0,
            minForks = 0,
            updatedAfter = '',
            fileTypes = ['.js', '.py', '.java']
        } = options;

        console.log(`🔍 Searching GitHub for: "${query}"`);

        try {
            const searchUrl = this.buildGitHubSearchUrl(query, {
                language,
                includeForks,
                includeArchived,
                minStars,
                minForks,
                updatedAfter
            });

            await this.page.goto(searchUrl, { waitUntil: 'networkidle' });
            
            // Wait for results to load
            await this.page.waitForSelector('[data-testid="results-list"] .Box-row', { timeout: 10000 });

            const results = [];
            let hasNextPage = true;
            let pageCount = 0;

            while (results.length < maxResults && hasNextPage && pageCount < 10) {
                const pageResults = await this.extractGitHubResults();
                results.push(...pageResults);

                // Check for next page
                hasNextPage = await this.hasNextGitHubPage();
                if (hasNextPage && results.length < maxResults) {
                    await this.goToNextGitHubPage();
                    pageCount++;
                    await this.randomDelay(1000, 3000);
                }
            }

            // Enrich results with detailed information
            const enrichedResults = await this.enrichGitHubResults(results.slice(0, maxResults), fileTypes);
            
            this.stats.totalResults += enrichedResults.length;
            this.stats.platforms.github = (this.stats.platforms.github || 0) + enrichedResults.length;
            this.stats.successfulScrapes++;

            console.log(`✅ GitHub scraping completed: ${enrichedResults.length} results`);
            return enrichedResults;

        } catch (error) {
            console.error('❌ GitHub scraping failed:', error);
            this.stats.failedScrapes++;
            throw error;
        }
    }

    buildGitHubSearchUrl(query, filters) {
        let searchQuery = query;
        
        // Add language filter
        if (filters.language) {
            searchQuery += ` language:${filters.language}`;
        }
        
        // Add fork filter
        if (!filters.includeForks) {
            searchQuery += ' fork:false';
        }
        
        // Add archived filter
        if (!filters.includeArchived) {
            searchQuery += ' archived:false';
        }
        
        // Add stars filter
        if (filters.minStars > 0) {
            searchQuery += ` stars:>=${filters.minStars}`;
        }
        
        // Add forks filter
        if (filters.minForks > 0) {
            searchQuery += ` forks:>=${filters.minForks}`;
        }
        
        // Add updated filter
        if (filters.updatedAfter) {
            searchQuery += ` pushed:>=${filters.updatedAfter}`;
        }

        const encodedQuery = encodeURIComponent(searchQuery);
        return `https://github.com/search?q=${encodedQuery}&type=repositories`;
    }

    async extractGitHubResults() {
        return await this.page.$$eval('[data-testid="results-list"] .Box-row', (repoElements) => {
            return repoElements.map(repo => {
                const titleElement = repo.querySelector('a[data-hydro-click]');
                const descriptionElement = repo.querySelector('p');
                const metaElements = repo.querySelectorAll('.mr-3');
                
                let stars = 0;
                let forks = 0;
                let language = '';

                metaElements.forEach(meta => {
                    const text = meta.textContent.trim();
                    if (text.includes('k')) {
                        const value = parseFloat(text) * 1000;
                        if (meta.querySelector('svg.octicon-star')) stars = value;
                        if (meta.querySelector('svg.octicon-repo-forked')) forks = value;
                    }
                    if (meta.querySelector('.repo-language-color')) {
                        language = text;
                    }
                });

                return {
                    title: titleElement?.textContent?.trim() || 'Unknown',
                    description: descriptionElement?.textContent?.trim() || '',
                    url: titleElement?.href || '',
                    stars: Math.round(stars),
                    forks: Math.round(forks),
                    language: language,
                    platform: 'github'
                };
            });
        });
    }

    async hasNextGitHubPage() {
        return await this.page.$('.pagination .next_page:not(.disabled)') !== null;
    }

    async goToNextGitHubPage() {
        await this.page.click('.pagination .next_page:not(.disabled)');
        await this.page.waitForSelector('[data-testid="results-list"] .Box-row', { timeout: 10000 });
    }

    async enrichGitHubResults(results, fileTypes) {
        const enrichedResults = [];
        
        for (const result of results) {
            try {
                console.log(`🔍 Enriching GitHub result: ${result.title}`);
                
                await this.page.goto(result.url, { waitUntil: 'networkidle' });
                
                // Get repository size
                const size = await this.page.$eval('[href*="graphs/contributors"] + .text-small', 
                    el => el.textContent.trim().match(/([\d.]+)\s*([KMG]?B)/)).catch(() => null);
                
                // Get README content
                const readme = await this.page.$eval('#readme', el => el.textContent.trim()).catch(() => '');
                
                // Extract code files
                const codeFiles = await this.extractGitHubCodeFiles(fileTypes);
                
                enrichedResults.push({
                    ...result,
                    size: this.parseSize(size ? size[0] : '0 KB'),
                    description: readme || result.description,
                    files: codeFiles,
                    code: codeFiles.length > 0 ? codeFiles[0].content : '',
                    date: new Date().toISOString()
                });

                await this.randomDelay(500, 1500); // Be respectful to GitHub
                
            } catch (error) {
                console.warn(`⚠️ Failed to enrich GitHub result ${result.title}:`, error.message);
                enrichedResults.push(result); // Add basic result anyway
            }
        }
        
        return enrichedResults;
    }

    async extractGitHubCodeFiles(fileTypes) {
        try {
            // Navigate to the code tab
            await this.page.click('#code-tab');
            await this.page.waitForSelector('[aria-label="File Browser"]', { timeout: 5000 });

            const files = await this.page.$$eval('[aria-label="File Browser"] [role="row"]', (rows, fileTypes) => {
                return rows.map(row => {
                    const nameElement = row.querySelector('[role="rowheader"] a');
                    const sizeElement = row.querySelector('[role="gridcell"]:last-child');
                    
                    if (!nameElement) return null;

                    const name = nameElement.textContent.trim();
                    const extension = '.' + name.split('.').pop();
                    
                    // Filter by file types
                    if (!fileTypes.includes(extension)) return null;

                    return {
                        name: name,
                        url: nameElement.href,
                        size: sizeElement?.textContent?.trim() || '0 KB',
                        type: extension
                    };
                }).filter(Boolean);
            }, fileTypes);

            // Get content for each file (limited to first few to be respectful)
            const filesWithContent = [];
            for (const file of files.slice(0, 5)) {
                try {
                    const content = await this.getGitHubFileContent(file.url);
                    filesWithContent.push({
                        ...file,
                        content: content
                    });
                } catch (error) {
                    console.warn(`⚠️ Could not get content for ${file.name}:`, error.message);
                }
            }

            return filesWithContent;
        } catch (error) {
            console.warn('⚠️ Could not extract GitHub code files:', error.message);
            return [];
        }
    }

    async getGitHubFileContent(fileUrl) {
        const page = await this.context.newPage();
        try {
            await page.goto(fileUrl, { waitUntil: 'networkidle' });
            const content = await page.$eval('.blob-wrapper', el => el.textContent.trim());
            return content;
        } finally {
            await page.close();
        }
    }

    // 🦊 GITLAB SCRAPER
    async scrapeGitLab(query, options = {}) {
        const {
            maxResults = 50,
            language = '',
            fileTypes = ['.js', '.py', '.java']
        } = options;

        console.log(`🔍 Searching GitLab for: "${query}"`);

        try {
            const searchUrl = `https://gitlab.com/search?search=${encodeURIComponent(query)}&scope=projects`;
            await this.page.goto(searchUrl, { waitUntil: 'networkidle' });

            const results = [];
            let hasNextPage = true;

            while (results.length < maxResults && hasNextPage) {
                const pageResults = await this.extractGitLabResults();
                results.push(...pageResults);

                hasNextPage = await this.hasNextGitLabPage();
                if (hasNextPage && results.length < maxResults) {
                    await this.goToNextGitLabPage();
                    await this.randomDelay(1000, 3000);
                }
            }

            const enrichedResults = await this.enrichGitLabResults(results.slice(0, maxResults), fileTypes);
            
            this.stats.totalResults += enrichedResults.length;
            this.stats.platforms.gitlab = (this.stats.platforms.gitlab || 0) + enrichedResults.length;
            this.stats.successfulScrapes++;

            console.log(`✅ GitLab scraping completed: ${enrichedResults.length} results`);
            return enrichedResults;

        } catch (error) {
            console.error('❌ GitLab scraping failed:', error);
            this.stats.failedScrapes++;
            throw error;
        }
    }

    async extractGitLabResults() {
        return await this.page.$$eval('.projects-list .project-row', (projectElements) => {
            return projectElements.map(project => {
                const titleElement = project.querySelector('.project-full-name');
                const descriptionElement = project.querySelector('.description');
                const starElement = project.querySelector('.stars-count');
                const languageElement = project.querySelector('.language');
                
                return {
                    title: titleElement?.textContent?.trim() || 'Unknown',
                    description: descriptionElement?.textContent?.trim() || '',
                    url: titleElement?.href || '',
                    stars: parseInt(starElement?.textContent?.replace(/[^\d]/g, '') || '0'),
                    language: languageElement?.textContent?.trim() || '',
                    platform: 'gitlab'
                };
            });
        });
    }

    async hasNextGitLabPage() {
        return await this.page.$('.pagination .next:not(.disabled)') !== null;
    }

    async goToNextGitLabPage() {
        await this.page.click('.pagination .next:not(.disabled)');
        await this.page.waitForSelector('.projects-list .project-row', { timeout: 10000 });
    }

    async enrichGitLabResults(results, fileTypes) {
        const enrichedResults = [];
        
        for (const result of results) {
            try {
                console.log(`🔍 Enriching GitLab result: ${result.title}`);
                
                await this.page.goto(result.url, { waitUntil: 'networkidle' });
                
                // Get additional project info
                const lastActivity = await this.page.$eval('.last-activity', el => el.textContent.trim()).catch(() => '');
                const readme = await this.page.$eval('.readme-holder', el => el.textContent.trim()).catch(() => '');
                
                // Extract code files from the repository
                const codeFiles = await this.extractGitLabCodeFiles(fileTypes);
                
                enrichedResults.push({
                    ...result,
                    description: readme || result.description,
                    files: codeFiles,
                    code: codeFiles.length > 0 ? codeFiles[0].content : '',
                    lastActivity: lastActivity,
                    date: new Date().toISOString()
                });

                await this.randomDelay(500, 1500);
                
            } catch (error) {
                console.warn(`⚠️ Failed to enrich GitLab result ${result.title}:`, error.message);
                enrichedResults.push(result);
            }
        }
        
        return enrichedResults;
    }

    async extractGitLabCodeFiles(fileTypes) {
        try {
            // Navigate to files tab
            await this.page.click('[data-testid="file-tree"]');
            await this.page.waitForSelector('.tree-table', { timeout: 5000 });

            const files = await this.page.$$eval('.tree-table tr', (rows, fileTypes) => {
                return rows.map(row => {
                    const nameElement = row.querySelector('.tree-item-link');
                    const sizeElement = row.querySelector('.file-size');
                    
                    if (!nameElement) return null;

                    const name = nameElement.textContent.trim();
                    const extension = '.' + name.split('.').pop();
                    
                    if (!fileTypes.includes(extension)) return null;

                    return {
                        name: name,
                        url: nameElement.href,
                        size: sizeElement?.textContent?.trim() || '0 KB',
                        type: extension
                    };
                }).filter(Boolean);
            }, fileTypes);

            const filesWithContent = [];
            for (const file of files.slice(0, 5)) {
                try {
                    const content = await this.getGitLabFileContent(file.url);
                    filesWithContent.push({
                        ...file,
                        content: content
                    });
                } catch (error) {
                    console.warn(`⚠️ Could not get content for ${file.name}:`, error.message);
                }
            }

            return filesWithContent;
        } catch (error) {
            console.warn('⚠️ Could not extract GitLab code files:', error.message);
            return [];
        }
    }

    async getGitLabFileContent(fileUrl) {
        const page = await this.context.newPage();
        try {
            await page.goto(fileUrl, { waitUntil: 'networkidle' });
            const content = await page.$eval('.file-content', el => el.textContent.trim());
            return content;
        } finally {
            await page.close();
        }
    }

    // 🎯 MAIN SCRAPING METHOD WITH RETRY LOGIC
    async scrapeWithRetry(platform, query, options = {}, maxRetries = 3) {
        this.stats.totalRequests++;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt}/${maxRetries} for ${platform}...`);
                
                if (!this.isInitialized) {
                    await this.initialize();
                }

                const results = await this[`scrape${this.capitalizeFirst(platform)}`](query, options);
                this.stats.successfulScrapes++;
                
                return results;
                
            } catch (error) {
                console.error(`❌ Attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    this.stats.failedScrapes++;
                    throw error;
                }
                
                // Wait before retry with exponential backoff
                const backoffTime = Math.pow(2, attempt) * 1000;
                console.log(`⏳ Waiting ${backoffTime}ms before retry...`);
                await this.page.waitForTimeout(backoffTime);
                
                // Reinitialize on failure
                await this.close();
                await this.initialize();
            }
        }
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // 🛠️ UTILITY METHODS
    detectCodeLanguage(codeFiles) {
        if (!codeFiles || codeFiles.length === 0) return 'Unknown';
        
        const languages = new Set();
        codeFiles.forEach(file => {
            const ext = file.type.toLowerCase();
            const langMap = {
                '.js': 'JavaScript',
                '.ts': 'TypeScript',
                '.py': 'Python',
                '.java': 'Java',
                '.cpp': 'C++',
                '.cs': 'C#',
                '.php': 'PHP',
                '.rb': 'Ruby',
                '.go': 'Go',
                '.rs': 'Rust',
                '.html': 'HTML',
                '.css': 'CSS',
                '.sql': 'SQL'
            };
            if (langMap[ext]) {
                languages.add(langMap[ext]);
            }
        });
        
        return Array.from(languages).join(' + ') || 'Unknown';
    }

    parseSize(sizeString) {
        if (!sizeString) return 0;
        
        const match = sizeString.match(/([\d.]+)\s*([KMG]?B)/i);
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        
        const multipliers = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024
        };
        
        return Math.round(value * (multipliers[unit] || 1));
    }

    async randomDelay(min, max) {
        const delay = Math.random() * (max - min) + min;
        await this.page.waitForTimeout(delay);
    }

    async close() {
        if (this.context) {
            await this.context.close();
        }
        if (this.browser) {
            await this.browser.close();
        }
        this.isInitialized = false;
        console.log('🔚 Enhanced Code Scraper closed');
    }

    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalRequests > 0 
                ? (this.stats.successfulScrapes / this.stats.totalRequests) * 100 
                : 0
        };
    }
}
