const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

console.log('=== TESTE DIRETO DE CONEXÃO ===\n');
console.log('DATABASE_URL:', DATABASE_URL ? DATABASE_URL.replace(/:[^:]+@/, ':****@') : 'NÃO ENCONTRADA');

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada');
  process.exit(1);
}

// Tentar conexão com configuração explícita
try {
  const url = new URL(DATABASE_URL);
  const config = {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    user: url.username,
    password: url.password,
    ssl: { rejectUnauthorized: false }
  };
  
  console.log('\nConfiguração extraída:');
  console.log('Host:', config.host);
  console.log('Port:', config.port);
  console.log('Database:', config.database);
  console.log('User:', config.user);
  
  const pool = new Pool(config);
  
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('\n❌ Erro de conexão:', err.message);
      console.error('Código:', err.code);
      pool.end();
      process.exit(1);
    } else {
      console.log('\n✅ Conexão bem-sucedida!');
      console.log('Hora do banco:', res.rows[0].now);
      pool.end();
      process.exit(0);
    }
  });
} catch (e) {
  console.error('❌ Erro ao parsear URL:', e.message);
  process.exit(1);
}
