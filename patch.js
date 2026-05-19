const fs = require('fs');
let code = fs.readFileSync('context/SportsDataContext.tsx', 'utf8');

// The only places where fetchData is NOT forced are inside prefetchAllData and useEntityData.
// prefetchAllData:
// await Promise.all(['tournaments', 'clubs', 'sponsors', 'notices', 'rules'].map(e => fetchData(e as EntityName)));
// useEntityData:
// fetchData(entityName);

// So we can safely replace all instances of:
// await fetchData('something');
// with:
// await fetchData('something', true);
// And also Promise.all([fetchData('a'), fetchData('b')]) to fetchData('a', true)

code = code.replace(/await fetchData\((['"][a-zA-Z]+['"])\);/g, "await fetchData($1, true);");
code = code.replace(/fetchData\((['"][a-zA-Z]+['"])\),? /g, (match, p1) => `fetchData(${p1}, true), `);

// For Promise.all([fetchData('playerTransfers'), fetchData('players')]);
code = code.replace(/Promise\.all\(\[fetchData\((['"][^'"]+['"])\), fetchData\((['"][^'"]+['"])\)\]\)/g, "Promise.all([fetchData($1, true), fetchData($2, true)])");

// Wait, the ones in prefetchAllData look like: e => fetchData(e as EntityName)
// That stays unmodified.

fs.writeFileSync('context/SportsDataContext.tsx', code);
