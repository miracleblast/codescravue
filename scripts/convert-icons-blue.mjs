// scripts/convert-icons-blue.mjs
import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

async function convertIconsToBlue() {
  const iconsDir = join(process.cwd(), 'public/assets/icons');
  const files = (await readdir(iconsDir)).filter(f => f.endsWith('.svg'));
  
  console.log(`Found ${files.length} SVG files\n`);
  
  // Your theme color
  const THEME_BLUE = '#2563EB';
  
  // Navigation icons that should stay white (for blue backgrounds)
  const WHITE_NAV_ICONS = [
    'material-symbols-code',           // Logo
    'majesticons-dashboard-line',      // Dashboard
    'material-symbols-download',       // Download App
    'iconamoon-cloud-download-light',  // Code Scraper
    'material-symbols-code-blocks',    // Code Editor
    'solar-folder-with-files-linear',  // Storage
    'material-symbols-security',       // Proxy Management
    'material-symbols-person',         // Account Management
    'material-symbols-settings'        // Settings
  ];
  
  // VS Code and other brand icons to keep original colors
  const BRAND_ICONS = [
    'vscode-icons',
    'logos-',
    'devicon',
    'simple-icons',
    'proicons',
    'eos-icons',
    'svg-spinners'
  ];
  
  let blueCount = 0;
  let whiteCount = 0;
  let brandCount = 0;
  
  for (const file of files) {
    const filePath = join(iconsDir, file);
    let content = await readFile(filePath, 'utf8');
    
    const baseName = file.replace('.svg', '');
    
    // Check if it's a white nav icon
    const isWhiteNavIcon = WHITE_NAV_ICONS.some(iconName => 
      baseName === iconName || file.includes(iconName)
    );
    
    // Check if it's a brand icon (keep original colors)
    const isBrandIcon = BRAND_ICONS.some(brand => file.includes(brand));
    
    if (isBrandIcon) {
      // Keep original colors for VS Code and brand icons
      brandCount++;
      console.log(`  🔶 Keep original: ${file}`);
      continue;
    }
    
    if (isWhiteNavIcon) {
      // Make it white (for blue backgrounds)
      content = setSVGColor(content, '#FFFFFF');
      await writeFile(filePath, content);
      whiteCount++;
      console.log(`  ⚪ Make white: ${file}`);
    } else {
      // Make it your theme blue
      content = setSVGColor(content, THEME_BLUE);
      await writeFile(filePath, content);
      blueCount++;
      console.log(`  🔵 Make blue: ${file}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 ICON CONVERSION COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Total icons: ${files.length}`);
  console.log(`   Blue icons: ${blueCount} (main theme color: ${THEME_BLUE})`);
  console.log(`   White icons: ${whiteCount} (for navigation on blue backgrounds)`);
  console.log(`   Original icons: ${brandCount} (VS Code, logos, etc.)`);
  console.log(`\n✅ All done! Your icons now match your theme.`);
}

function setSVGColor(svgContent, color) {
  // Replace black fill colors with new color
  let processed = svgContent
    .replace(/fill=["']#000000["']/gi, `fill="${color}"`)
    .replace(/fill=["']#000["']/gi, `fill="${color}"`)
    .replace(/fill=["']black["']/gi, `fill="${color}"`)
    .replace(/fill=["']rgb\(0, 0, 0\)["']/gi, `fill="${color}"`)
    .replace(/stroke=["']#000000["']/gi, `stroke="${color}"`)
    .replace(/stroke=["']#000["']/gi, `stroke="${color}"`)
    .replace(/stroke=["']black["']/gi, `stroke="${color}"`);
  
  // If no fill attribute found, add one to the main path
  if (!processed.includes('fill=') && processed.includes('<path')) {
    processed = processed.replace(/<path([^>]*)>/g, (match, attrs) => {
      if (!attrs.includes('fill=')) {
        return `<path${attrs} fill="${color}">`;
      }
      return match;
    });
  }
  
  return processed;
}

convertIconsToBlue().catch(console.error);