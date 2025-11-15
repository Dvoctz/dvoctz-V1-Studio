
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  try {
    const distDir = path.join(__dirname, 'dist');

    // Clean and create dist directory
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir);
    console.log('🚀 Starting build...');

    // 1. Build the main JS bundle from index.tsx
    await esbuild.build({
      entryPoints: ['index.tsx'],
      bundle: true,
      outfile: 'dist/bundle.js',
      minify: true,
      sourcemap: true,
      // FIX: Target modern environments that support ES2020 features.
      // This resolves the "destructuring is not supported" error.
      target: 'es2020',
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });
    console.log('✅ JavaScript bundled successfully.');

    // 2. Process and copy index.html
    let htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
    
    // Remove environment variable injection placeholder for security
    htmlContent = htmlContent.replace('<!-- INJECT_ENV -->', '');
    console.log('✅ Environment variable injection removed for security.');

    // Update the script tag to point to the compiled bundle.js
    htmlContent = htmlContent.replace(
      '<script type="module" src="/index.tsx"></script>',
      '<script type="module" src="/bundle.js"></script>'
    );
    console.log('✅ Script path updated to bundle.js.');
    
    fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
    console.log('✅ index.html processed and copied.');

    // 3. Copy other static files to the dist directory
    const staticFiles = [
      'manifest.json',
      'sw.js',
      'icon-192.svg',
      'icon-512.svg',
      'metadata.json',
    ];

    staticFiles.forEach(file => {
      const srcPath = path.join(__dirname, file);
      if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, path.join(distDir, file));
          console.log(`✅ Copied ${file}`);
      } else {
          console.warn(`⚠️  Static file not found, skipping: ${file}`);
      }
    });
    
    console.log('\n✨ Build complete! Your app is ready in the "dist" directory.');

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();