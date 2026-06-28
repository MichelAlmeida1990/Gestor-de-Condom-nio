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

async function checkMaintenanceData() {
  try {
    console.log('=== VERIFICANDO DADOS DE MANUTENÇÃO ===\n');
    
    const result = await pool.query('SELECT * FROM maintenance_requests ORDER BY created_at DESC');
    
    if (result.rows.length === 0) {
      console.log('✅ Nenhum dado de manutenção encontrado no banco.');
    } else {
      console.log(`❌ Encontrados ${result.rows.length} registros de manutenção:\n`);
      result.rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`Título: ${row.title}`);
        console.log(`Descrição: ${row.description}`);
        console.log(`Categoria: ${row.category}`);
        console.log(`Prioridade: ${row.priority}`);
        console.log(`Status: ${row.status}`);
        console.log(`Solicitante: ${row.requested_by}`);
        console.log(`Atribuído: ${row.assigned_to || 'N/A'}`);
        console.log(`Custo: ${row.cost || 'N/A'}`);
        console.log(`Criado em: ${row.created_at}`);
        console.log('---');
      });
      
      console.log('\n=== OPÇÕES ===');
      console.log('1. Manter dados');
      console.log('2. Deletar todos os dados de manutenção');
      console.log('\nPara deletar, execute: node clear-maintenance-db.cjs');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
    await pool.end();
    process.exit(1);
  }
}

checkMaintenanceData();
