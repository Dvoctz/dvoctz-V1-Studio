// This script runs during the Vercel build process.
// It takes the secret VITE_API_KEY from environment variables
// and injects it directly into the index.html file.
const fs = require('fs');
const path = require('path');

console.log('--- Running build-env.js script ---');

const apiKey = process.env.VITE_API_KEY;
const indexPath = path.join(__dirname, 'index.html');

// Read the original index.html content
let indexHtmlContent;
try {
  indexHtmlContent = fs.readFileSync(indexPath, 'utf8');
} catch (err) {
  console.error('Failed to read index.html:', err);
  process.exit(1); // Exit with an error code
}

let injectionScript = '';
if (!apiKey) {
  console.warn('WARNING: VITE_API_KEY environment variable not found. The AI assistant will be disabled.');
  // Define it as null so checks for its existence will fail
  injectionScript = `<script>window.GEMINI_API_KEY = null;</script>`;
} else {
  console.log('VITE_API_KEY found. Injecting into index.html.');
  // Escape backticks, backslashes, and script tags to prevent breaking the script or HTML
  const escapedApiKey = apiKey
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/</g, '\\u003c');
  injectionScript = `<script>window.GEMINI_API_KEY = \`${escapedApiKey}\`;</script>`;
}

// Replace the placeholder with the actual script
const finalHtml = indexHtmlContent.replace('<!-- INJECT_ENV -->', injectionScript);

// Write the modified content back to index.html
try {
  fs.writeFileSync(indexPath, finalHtml);
  console.log('Successfully injected API key into index.html.');
} catch (err) {
  console.error('Failed to write updated index.html:', err);
  process.exit(1);
}

// Clean up the now-unused config directory
const configDir = path.join(__dirname, 'config');
if (fs.existsSync(configDir)) {
    fs.rmSync(configDir, { recursive: true, force: true });
    console.log('Removed obsolete config directory.');
}

console.log('--- Finished build-env.js script ---');