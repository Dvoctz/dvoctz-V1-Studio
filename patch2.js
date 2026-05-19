const fs = require('fs');
let code = fs.readFileSync('context/SportsDataContext.tsx', 'utf8');

// We want to remove lines like:
// setState(s => ({...s, tournaments: null}));
// setState(s => ({...s, playerTransfers: null, players: null}));
// But wait, removing them prevents the component from showing the loading state if someone else uses loading, but `fetchData` does its own loading management:
// setState(s => ({ ...s, loading: new Set(s.loading).add(entityName) }));

// I will use regex to remove these line completely.
code = code.replace(/^\s*setState\(s => \(\{\.\.\.s,.*?: null.*\}\)\);\n/gm, '');
// For the invalidation comment, maybe we leave it or remove it, whatever.
fs.writeFileSync('context/SportsDataContext.tsx', code);
