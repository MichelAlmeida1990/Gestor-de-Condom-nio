const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.log('DATABASE_URL não encontrada no .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clearMaintenanceData() {
  try {
    console.log('=== LIMPANDO DADOS DE MANUTENÇÃO ===\n');
    
    const result = await pool.query('DELETE FROM maintenance_requests RETURNING *');
    
    console.log(`✅ ${result.rowCount} registros de manutenção deletados.`);
    
    if (result.rowCount > 0) {
      console.log('\nRegistros deletados:');
      result.rows.forEach(row => {
        console.log(`- ID ${row.id}: ${row.title}`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    await pool.end();
    process.exit(1);
  }
}

clearMaintenanceData();
