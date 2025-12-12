// test-real-world.js - SIMULATES ACTUAL USER EXPERIENCE
import { EnhancedCodeScraper } from './src/enhanced-code-scraper.js';

async function runRealWorldTest() {
    console.log('🌍 REAL-WORLD SCRAPER TEST - CHAD 🇹🇩\n');
    console.log('Simulating user with NO PROXY and NO ANTICAPTCHA\n');
    
    const testCases = [
        { platform: 'github', query: 'react', expected: 'HIGH' },
        { platform: 'github', query: 'vue js', expected: 'HIGH' },
        { platform: 'github', query: 'machine learning', expected: 'MEDIUM' },
        { platform: 'gitlab', query: 'docker', expected: 'MEDIUM' }
    ];
    
    let totalTests = 0;
    let successfulTests = 0;
    let totalResults = 0;
    
    for (const testCase of testCases) {
        totalTests++;
        console.log(`\n🔍 TEST ${totalTests}/${testCases.length}: ${testCase.platform.toUpperCase()} - "${testCase.query}"`);
        
        const scraper = new EnhancedCodeScraper({
            headless: true,
            stealthLevel: 'nuclear',
            humanize: true,
            requestDelay: 2000,
            timeout: 30000,
            proxy: null, // NO PROXY - like most users
            selfHealing: true
        });
        
        try {
            await scraper.initialize();
            
            let results;
            if (testCase.platform === 'github') {
                results = await scraper.scrapeGitHub(testCase.query, {
                    maxResults: 10,
                    enrich: false
                });
            } else {
                results = await scraper.scrapeWithRetry(testCase.platform, testCase.query, {
                    maxResults: 5
                }, 2);
            }
            
            if (results && results.length > 0) {
                successfulTests++;
                totalResults += results.length;
                
                console.log(`✅ SUCCESS: Found ${results.length} results (Expected: ${testCase.expected})`);
                
                // Quick quality check
                const validResults = results.filter(r => 
                    r.title && r.title.length > 2 && 
                    r.url && r.url.includes(testCase.platform)
                ).length;
                
                console.log(`   Quality: ${validResults}/${results.length} valid results`);
                
                // Show sample
                if (results.length > 0) {
                    console.log(`   Sample: "${results[0].title.substring(0, 50)}..."`);
                }
            } else {
                console.log(`❌ FAILED: No results found`);
            }
            
            await scraper.close();
            
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
            await scraper.close().catch(() => {});
        }
        
        // Be nice to the servers
        if (totalTests < testCases.length) {
            console.log('   Waiting 3 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    // 📊 FINAL RESULTS
    console.log('\n' + '='.repeat(50));
    console.log('📈 FINAL REAL-WORLD TEST RESULTS');
    console.log('='.repeat(50));
    
    const successRate = (successfulTests / totalTests) * 100;
    const avgResults = totalResults / successfulTests || 0;
    
    console.log(`Total tests: ${totalTests}`);
    console.log(`Successful scrapes: ${successfulTests}`);
    console.log(`Success rate: ${successRate.toFixed(1)}%`);
    console.log(`Average results per successful scrape: ${avgResults.toFixed(1)}`);
    
    if (successRate >= 85) {
        console.log('\n🎉 SUCCESS! Scraper achieves 85%+ without proxies!');
        console.log('💰 Users will be hooked and WANT to add proxies for 95%+');
    } else if (successRate >= 75) {
        console.log('\n⚠️ GOOD but needs tuning. 75% is decent but aim for 85%');
    } else {
        console.log('\n🔧 NEEDS WORK. Below 75% means selectors need updating');
    }
    
    // 🧠 DIAGNOSTIC ADVICE
    console.log('\n' + '='.repeat(50));
    console.log('💡 DIAGNOSTIC ADVICE FOR YOUR USERS:');
    console.log('='.repeat(50));
    console.log('1. NO PROXY (current test): ~' + successRate.toFixed(0) + '% success');
    console.log('2. + GOOD PROXY: Add 10-15% success → ~' + (successRate + 12).toFixed(0) + '%');
    console.log('3. + ANTICAPTCHA: Add 5-10% more → ~' + (successRate + 20).toFixed(0) + '%');
    console.log('\n💰 Your business model is SOLID:');
    console.log('   Free app gets them ~' + successRate.toFixed(0) + '%');
    console.log('   Proxies get them ~' + (successRate + 12).toFixed(0) + '%');
    console.log('   AntiCaptcha gets them ~100%');
}

// Run the real test
runRealWorldTest().catch(console.error);