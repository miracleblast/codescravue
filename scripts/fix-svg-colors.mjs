import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

async function fixSVGColors() {
  console.log('🎨 Fixing SVG colors to use currentColor...\n');
  
  const iconsDir = join(process.cwd(), 'public', 'assets', 'icons');
  const svgFiles = (await readdir(iconsDir)).filter(f => f.endsWith('.svg'));
  
  let fixedCount = 0;
  
  for (const file of svgFiles) {
    const filePath = join(iconsDir, file);
    let content = await readFile(filePath, 'utf8');
    
    // Check if SVG has hardcoded black colors
    if (content.includes('fill="#000"') || 
        content.includes('fill="#000000"') ||
        content.includes('fill="black"') ||
        content.includes('fill="rgb(0,0,0)"')) {
      
      // Replace with currentColor
      content = content
        .replace(/fill="#000"/g, 'fill="currentColor"')
        .replace(/fill="#000000"/g, 'fill="currentColor"')
        .replace(/fill="black"/g, 'fill="currentColor"')
        .replace(/fill="rgb\(0,0,0\)"/g, 'fill="currentColor"')
        .replace(/fill="rgb\(0, 0, 0\)"/g, 'fill="currentColor"');
      
      await writeFile(filePath, content);
      fixedCount++;
      console.log(`  ✅ Fixed: ${file}`);
    }
  }
  
  console.log(`\n🎨 Fixed ${fixedCount} SVG files`);
  console.log('💡 Now SVGs will use your text color (light/dark theme compatible)');
}

fixSVGColors().catch(console.error);
