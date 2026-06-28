const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function clearDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('Conectando ao banco de dados...');
    const client = await pool.connect();
    
    console.log('Limpando dados fictícios...');
    
    // Limpar tabelas em ordem de dependência
    await client.query('DELETE FROM reservations;');
    console.log('✓ Reservas limpas');
    
    await client.query('DELETE FROM occurrences;');
    console.log('✓ Ocorrências limpas');
    
    await client.query('DELETE FROM notifications;');
    console.log('✓ Notificações limpas');
    
    await client.query('DELETE FROM expenses;');
    console.log('✓ Despesas limpas');
    
    await client.query('DELETE FROM income;');
    console.log('✓ Receitas limpas');
    
    // Manter apenas o usuário admin, remover resident fictício
    await client.query("DELETE FROM users WHERE role = 'resident';");
    console.log('✓ Moradores fictícios removidos');
    
    // Resetar sequências
    await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1;');
    await client.query('ALTER SEQUENCE occurrences_id_seq RESTART WITH 1;');
    await client.query('ALTER SEQUENCE expenses_id_seq RESTART WITH 1;');
    await client.query('ALTER SEQUENCE income_id_seq RESTART WITH 1;');
    await client.query('ALTER SEQUENCE notifications_id_seq RESTART WITH 1;');
    await client.query('ALTER SEQUENCE reservations_id_seq RESTART WITH 1;');
    console.log('✓ Sequências resetadas');
    
    console.log('\n✅ Banco de dados limpo com sucesso!');
    
    // Verificar dados restantes
    const { rows: users } = await client.query('SELECT email, role FROM users;');
    console.log('\nUsuários restantes:', users);
    
    client.release();
  } catch (error) {
    console.error('Erro ao limpar banco:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

clearDatabase().catch(console.error);
