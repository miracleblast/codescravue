// electron/iconify-local.js - CUSTOM ICONIFY LOADER
(() => {
  console.log('🚀 Loading CUSTOM Iconify (Local Bundle Only)');
  
  // Global iconify object
  window.iconify = {
    // Disable ALL external calls
    disableCache: (type) => {
      console.log(`✅ Iconify cache disabled: ${type}`);
    },
    
    // Local icon storage
    _icons: {},
    _bundles: {},
    
    // Load icons from local bundle
    async loadIcons(icons, callback) {
      console.log('🔍 Loading icons locally:', icons);
      
      const results = {};
      const missing = [];
      
      icons.forEach(icon => {
        const [collection, name] = icon.split(':');
        
        // Check if we have it in our bundle
        if (this._bundles[collection] && this._bundles[collection][name]) {
          results[icon] = {
            data: this._bundles[collection][name],
            provider: 'local',
            cached: true
          };
        } else {
          missing.push(icon);
          results[icon] = {
            data: null,
            provider: null,
            cached: false,
            error: 'Icon not found in local bundle'
          };
        }
      });
      
      if (callback) {
        callback(results, missing);
      }
      
      return results;
    },
    
    // Render icon from local data
    renderIcon(icon, customisations = {}) {
      const [collection, name] = icon.split(':');
      
      // Get icon data from local bundle
      const iconData = this._bundles[collection]?.[name];
      
      if (!iconData) {
        console.warn(`⚠️ Icon not found locally: ${icon}`);
        return this._createFallbackSVG(icon, customisations);
      }
      
      return this._renderSVG(iconData, customisations);
    },
    
    // Internal: Create SVG from icon data
    _renderSVG(iconData, customisations) {
      const { width = '24px', height = '24px', color = 'currentColor' } = customisations;
      
      // Parse icon data
      const body = iconData.body || '';
      const viewBox = iconData.width && iconData.height ? 
        `0 0 ${iconData.width} ${iconData.height}` : '0 0 24 24';
      
      return `
        <svg width="${width}" height="${height}" viewBox="${viewBox}" 
             style="display: inline-block; vertical-align: middle; color: ${color};">
          ${body}
        </svg>
      `;
    },
    
    // Internal: Create fallback SVG
    _createFallbackSVG(icon, customisations) {
      const { width = '24px', height = '24px', color = 'currentColor' } = customisations;
      const iconName = icon.split(':').pop() || icon;
      
      return `
        <svg width="${width}" height="${height}" viewBox="0 0 24 24" 
             style="display: inline-block; vertical-align: middle; color: ${color};">
          <rect width="24" height="24" fill="#4a5568" rx="4" opacity="0.7"/>
          <text x="12" y="16" text-anchor="middle" fill="white" 
                font-size="10" font-family="Arial, sans-serif" font-weight="bold">
            ${iconName.substring(0, 3)}
          </text>
        </svg>
      `;
    },
    
    // Load icon bundle from file
    async loadBundle(bundleUrl) {
      try {
        console.log(`📦 Loading icon bundle: ${bundleUrl}`);
        
        const response = await fetch(bundleUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const bundle = await response.json();
        this._bundles = { ...this._bundles, ...bundle };
        
        console.log(`✅ Loaded ${Object.keys(bundle).length} collections`);
        return true;
      } catch (err) {
        console.error('❌ Failed to load icon bundle:', err);
        return false;
      }
    },
    
    // API simulation (for compatibility)
    _api: {
      fetch: (url, callback) => {
        console.log('🚫 API fetch blocked (local mode):', url);
        if (callback) setTimeout(() => callback(null, true), 0);
      },
      send: (url, callback) => {
        console.log('🚫 API send blocked (local mode):', url);
        if (callback) setTimeout(() => callback(null, true), 0);
      }
    }
  };
  
  console.log('✅ Custom iconify loaded (local mode)');
})();