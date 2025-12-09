import { EnhancedCodeScraper } from './src/enhanced-code-scraper.js';

async function test() {
  console.log('🧪 Testing GitHub scraper...');
  const scraper = new EnhancedCodeScraper({
    headless: false, // Show browser for debugging
    timeout: 30000
  });
  
  try {
    await scraper.initialize();
    const results = await scraper.scrapeGitHub('react', { maxResults: 2 });
    console.log('✅ Test successful! Found:', results.length, 'results');
    console.log(results);
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await scraper.close();
  }
}

test();