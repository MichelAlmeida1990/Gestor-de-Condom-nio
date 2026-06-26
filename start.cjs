const { execSync } = require('child_process');

console.log('Compilando TypeScript...');
try {
  execSync('npx tsc -p tsconfig.server.json', { stdio: 'inherit' });
} catch (error) {
  console.warn('Aviso: Erros de TypeScript encontrados, mas continuando...');
}

console.log('Iniciando servidor...');
execSync('node dist/server.js', { stdio: 'inherit' });
