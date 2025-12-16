#!/bin/bash
echo "🔄 Replacing ALL iconify-icon with LocalIcon..."

# Replace in all Vue files
find src -name "*.vue" -exec sed -i '
  s/<iconify-icon/<LocalIcon/g
  s/<\/iconify-icon>/<\/LocalIcon>/g
  s/<iconify-icon\([^>]*\)\/>/<LocalIcon\1 \/>/g
' {} \;

echo "✅ All icons replaced! Now using local SVG files."
