const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const distDir = 'dist';

async function build() {
    console.log('--- Starting build process ---');

    // 1. Create dist directory if it doesn't exist
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir);
        console.log(`Created directory: ${distDir}`);
    }

    // 2. Bundle the application using esbuild
    try {
        await esbuild.build({
            entryPoints: ['index.tsx'],
            bundle: true,
            outfile: path.join(distDir, 'bundle.js'),
            jsx: 'automatic', // Handle JSX syntax
            loader: { '.ts': 'tsx' }, // Handle TS files
            minify: true,
            sourcemap: true,
        });
        console.log('Successfully bundled application to dist/bundle.js');
    } catch (e) {
        console.error('esbuild failed:', e);
        process.exit(1);
    }

    // 3. Process index.html
    try {
        // Read original index.html
        let html = fs.readFileSync('index.html', 'utf-8');

        // Replace script tag to point to the bundled JS file
        html = html.replace(
            '<script type="module" src="/index.tsx"></script>',
            '<script src="/bundle.js"></script>' // Changed to a standard script tag
        );
        console.log('Updated script tag in index.html to point to bundle.js');

        // Inject environment variable (API Key)
        const apiKey = process.env.VITE_API_KEY;
        let injectionScript = '';
        if (!apiKey) {
            console.warn('WARNING: VITE_API_KEY environment variable not found. The AI assistant will be disabled.');
            injectionScript = `<script>window.GEMINI_API_KEY = null;</script>`;
        } else {
            console.log('VITE_API_KEY found. Injecting into index.html.');
            const escapedApiKey = apiKey.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/</g, '\\u003c');
            injectionScript = `<script>window.GEMINI_API_KEY = \`${escapedApiKey}\`;</script>`;
        }
        
        html = html.replace('<!-- INJECT_ENV -->', injectionScript);
        console.log('Injected API key script into index.html');

        // Write the new index.html to dist
        fs.writeFileSync(path.join(distDir, 'index.html'), html);
        console.log(`Successfully created ${path.join(distDir, 'index.html')}`);

    } catch (e) {
        console.error('Processing index.html failed:', e);
        process.exit(1);
    }

    console.log('--- Build process completed successfully! ---');
}

build().catch(err => {
    console.error('Build script encountered an unhandled error:', err);
    process.exit(1);
});
