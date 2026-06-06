const fs = require('fs');
const file = 'e:\\\\4th Semester\\\\IS Lab\\\\Project\\\\Backend\\\\controllers\\\\cryptoController.js';
let content = fs.readFileSync(file, 'utf-8');

// Strip block comments and line comments
content = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

// Clean up multiple empty lines
content = content.replace(/^\s*[\r\n]/gm, '');

fs.writeFileSync(file, content, 'utf-8');
console.log('Comments stripped successfully.');
