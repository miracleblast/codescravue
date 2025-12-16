// scripts/check-and-fix-icons.mjs
import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

async function checkAndFixIcons() {
  const iconsDir = join(process.cwd(), 'public/assets/icons');
  const files = (await readdir(iconsDir)).filter(f => f.endsWith('.svg'));
  
  console.log('🔍 Checking icon colors...\n');
  
  let currentColorCount = 0;
  let blackCount = 0;
  let otherCount = 0;
  
  for (const file of files) {
    const filePath = join(iconsDir, file);
    const content = await readFile(filePath, 'utf8');
    
    if (content.includes('fill="currentColor"')) {
      currentColorCount++;
      console.log(`  ✅ ${file}: Already uses currentColor`);
    } else if (content.includes('fill="#000"') || 
               content.includes('fill="#000000"') || 
               content.includes('fill="black"')) {
      blackCount++;
      console.log(`  ⚫ ${file}: Has black fill`);
      
      // Fix it immediately
      let fixed = content
        .replace(/fill="#000000"/g, 'fill="currentColor"')
        .replace(/fill="#000"/g, 'fill="currentColor"')
        .replace(/fill="black"/g, 'fill="currentColor"');
      
      await writeFile(filePath, fixed);
      console.log(`     → Fixed to currentColor`);
    } else {
      otherCount++;
      console.log(`  ❓ ${file}: Other color or no fill`);
      
      // Check if it has a fill attribute at all
      if (content.includes('<path') && !content.includes('fill=')) {
        // Add currentColor to first path
        const fixed = content.replace(/<path([^>]*)>/g, (match, attrs) => {
          if (!attrs.includes('fill=')) {
            return `<path${attrs} fill="currentColor">`;
          }
          return match;
        });
        await writeFile(filePath, fixed);
        console.log(`     → Added currentColor`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 ANALYSIS COMPLETE:');
  console.log(`   currentColor icons: ${currentColorCount}`);
  console.log(`   Black icons fixed: ${blackCount}`);
  console.log(`   Other/unknown: ${otherCount}`);
  console.log(`   Total: ${files.length}`);
  console.log('\n🎯 Next: Apply the CSS fix above!');
}

checkAndFixIcons().catch(console.error);