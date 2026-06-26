const { execSync } = require('child_process');

console.log('Compilando TypeScript...');
execSync('npx tsc -p tsconfig.server.json', { stdio: 'inherit' });

console.log('Iniciando servidor...');
execSync('node dist/server.js', { stdio: 'inherit' });
