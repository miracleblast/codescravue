// scripts/create-themed-icons.mjs
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join, basename, extname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🎨 Creating themed icon sets from your existing icons...\n');

async function createThemedIcons() {
  const baseDir = process.cwd();
  const iconsDir = join(baseDir, 'public/assets/icons');
  const lightDir = join(baseDir, 'public/assets/icons/light');
  const darkDir = join(baseDir, 'public/assets/icons/dark');
  
  // Create theme directories
  await mkdir(lightDir, { recursive: true });
  await mkdir(darkDir, { recursive: true });
  
  // Get all SVG files from current icons directory
  const files = (await readdir(iconsDir)).filter(f => f.endsWith('.svg'));
  
  console.log(`Found ${files.length} SVG icons to process\n`);
  
  // Colors for themes
  const COLORS = {
    light: '#1a365d', // Navy blue (works on light backgrounds)
    dark: '#ffffff'   // White (works on dark backgrounds)
  };
  
  // Keep these as-is (already colored or fine as-is)
  const EXCLUDE_FROM_COLORING = [
    'vscode-icons',  // VS Code icons are already colored
    'logos-',        // Logos should keep original colors
    'eos-icons',     // EOS icons might have animations
    'devicon',       // Devicons are brand-colored
    'simple-icons',  // Brand icons
    'svg-spinners'   // Spinners
  ];
  
  let lightCount = 0;
  let darkCount = 0;
  let skippedCount = 0;
  
  for (const file of files) {
    const filePath = join(iconsDir, file);
    const fileName = basename(file);
    
    // Check if this file should be excluded from recoloring
    const shouldExclude = EXCLUDE_FROM_COLORING.some(pattern => fileName.includes(pattern));
    
    try {
      let content = await readFile(filePath, 'utf8');
      
      // Create light version (navy blue)
      let lightContent = content;
      if (!shouldExclude) {
        lightContent = recolorSVG(content, COLORS.light);
        const lightPath = join(lightDir, fileName);
        await writeFile(lightPath, lightContent);
        lightCount++;
      }
      
      // Create dark version (white)
      let darkContent = content;
      if (!shouldExclude) {
        darkContent = recolorSVG(content, COLORS.dark);
        const darkPath = join(darkDir, fileName);
        await writeFile(darkPath, darkContent);
        darkCount++;
      }
      
      if (shouldExclude) {
        // For excluded files, copy as-is to both directories
        await writeFile(join(lightDir, fileName), content);
        await writeFile(join(darkDir, fileName), content);
        skippedCount++;
      }
      
      // Progress indicator
      if ((files.indexOf(file) + 1) % 20 === 0) {
        console.log(`Processed ${files.indexOf(file) + 1}/${files.length} icons...`);
      }
      
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  // Create a manifest file for easy reference
  const manifest = {
    generated: new Date().toISOString(),
    totalIcons: files.length,
    lightIcons: lightCount + skippedCount,
    darkIcons: darkCount + skippedCount,
    recolored: lightCount,
    excluded: skippedCount,
    colors: COLORS,
    note: "vscode-icons, logos, and brand icons are kept as-is"
  };
  
  await writeFile(
    join(baseDir, 'public/assets/icons/manifest-themes.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 THEMED ICONS CREATION COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Total icons: ${files.length}`);
  console.log(`   Light theme (navy blue): ${lightCount + skippedCount}`);
  console.log(`   Dark theme (white): ${darkCount + skippedCount}`);
  console.log(`   Recolored: ${lightCount}`);
  console.log(`   Kept original (brands/logos): ${skippedCount}`);
  console.log(`\n📁 Location:`);
  console.log(`   Light icons: public/assets/icons/light/`);
  console.log(`   Dark icons: public/assets/icons/dark/`);
  console.log(`\n🎨 Colors used:`);
  console.log(`   Light theme: ${COLORS.light} (navy blue)`);
  console.log(`   Dark theme: ${COLORS.dark} (white)`);
  console.log('\n🚀 Next: Update your Vue components to use theme-aware icons!');
}

function recolorSVG(svgContent, color) {
  // Remove any existing fill attributes from path/g elements
  let processed = svgContent
    .replace(/fill=["'][^"']*["']/g, '')  // Remove existing fills
    .replace(/stroke=["'][^"']*["']/g, ''); // Remove existing strokes
  
  // Add the new fill to the main SVG or to path/g elements
  // Check if there's an opening <svg> tag
  const svgTagMatch = processed.match(/<svg[^>]*>/);
  if (svgTagMatch) {
    const svgTag = svgTagMatch[0];
    
    // If SVG tag doesn't have fill attribute, add it
    if (!svgTag.includes('fill=')) {
      const newSvgTag = svgTag.replace('<svg', `<svg fill="${color}"`);
      processed = processed.replace(svgTag, newSvgTag);
    }
  }
  
  // Also add fill to all path and g elements that don't have it
  processed = processed
    .replace(/<path([^>]*)>/g, (match, attributes) => {
      if (!attributes.includes('fill=')) {
        return `<path${attributes} fill="${color}">`;
      }
      return match;
    })
    .replace(/<g([^>]*)>/g, (match, attributes) => {
      if (!attributes.includes('fill=')) {
        return `<g${attributes} fill="${color}">`;
      }
      return match;
    });
  
  return processed;
}

// Run the script
createThemedIcons().catch(console.error);