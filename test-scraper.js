// test-scraper.js
import { EnhancedCodeScraper } from './src/enhanced-code-scraper.js';

async function testAllScrapers() {
  console.log('🚀 Testing all scrapers...');
  
  const scraper = new EnhancedCodeScraper({
    headless: false, // Set to true for production
    timeout: 30000
  });

  try {
    await scraper.initialize();
    
    // Test GitHub
    console.log('\n=== TESTING GITHUB ===');
    const githubResults = await scraper.scrapeGitHub('react', { maxResults: 5 });
    console.log(`GitHub results: ${githubResults.length}`);
    
    // Test GitLab
    console.log('\n=== TESTING GITLAB ===');
    const gitlabResults = await scraper.scrapeGitLab('vue', { maxResults: 3 });
    console.log(`GitLab results: ${gitlabResults.length}`);
    
    // Test Bitbucket
    console.log('\n=== TESTING BITBUCKET ===');
    const bitbucketResults = await scraper.scrapeBitbucket('django', { maxResults: 3 });
    console.log(`Bitbucket results: ${bitbucketResults.length}`);
    
    // Test CodePen
    console.log('\n=== TESTING CODEPEN ===');
    const codepenResults = await scraper.scrapeCodePen('animation', { maxResults: 3 });
    console.log(`CodePen results: ${codepenResults.length}`);
    
    // Test StackOverflow
    console.log('\n=== TESTING STACKOVERFLOW ===');
    const stackResults = await scraper.scrapeStackOverflow('javascript error', { maxResults: 3 });
    console.log(`StackOverflow results: ${stackResults.length}`);
    
    // Get stats
    console.log('\n=== SCRAPER STATS ===');
    console.log(scraper.getStats());
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await scraper.close();
  }
}

// Run tests
testAllScrapers().catch(console.error);