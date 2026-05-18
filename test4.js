const data = require('./openapi.json');
console.log(Object.keys(data));
console.log(Object.keys(data.paths || {}));
console.log(Object.keys(data.definitions || data.components?.schemas || {}));
