const dns = require('node:dns');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

console.log('=== DIAGNÓSTICO DE CONEXÃO POSTGRESQL ===\n');
console.log('DATABASE_URL encontrada:', DATABASE_URL ? 'SIM' : 'NÃO');

if (DATABASE_URL) {
  // Extrair hostname da URL
  try {
    const url = new URL(DATABASE_URL);
    const hostname = url.hostname;
    console.log('Hostname:', hostname);
    console.log('Porta:', url.port || '5432');
    console.log('Database:', url.pathname.slice(1));
    
    console.log('\n=== TESTANDO RESOLUÇÃO DNS ===');
    dns.lookup(hostname, (err, address, family) => {
      if (err) {
        console.error('❌ Erro DNS:', err.message);
        console.log('\n=== SOLUÇÕES POSSÍVEIS ===');
        console.log('1. Verifique se o hostname está correto no .env');
        console.log('2. Verifique sua conexão com a internet');
        console.log('3. Tente usar o IP direto se disponível');
        console.log('4. Verifique se o banco Supabase está ativo');
        process.exit(1);
      } else {
        console.log('✅ DNS resolvido:', address);
        console.log('   Família:', family === 4 ? 'IPv4' : 'IPv6');
        
        console.log('\n=== TESTANDO CONEXÃO COM BANCO ===');
        const pool = new Pool({
          connectionString: DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });
        
        pool.query('SELECT NOW()', (err, res) => {
          if (err) {
            console.error('❌ Erro de conexão:', err.message);
            pool.end();
            process.exit(1);
          } else {
            console.log('✅ Conexão bem-sucedida!');
            console.log('   Hora do banco:', res.rows[0].now);
            pool.end();
            process.exit(0);
          }
        });
      }
    });
  } catch (e) {
    console.error('❌ Erro ao parsear DATABASE_URL:', e.message);
    process.exit(1);
  }
} else {
  console.error('❌ DATABASE_URL não encontrada no .env');
  process.exit(1);
}
