async function initializeDatabase() {
  try {
    console.log('=== INICIALIZANDO BANCO DE DADOS ===\n');
    const { initDB } = await import('./dist/server/database.js');
    await initDB();
    console.log('✅ Banco de dados inicializado com sucesso!');
    console.log('\nTabelas criadas/verificadas:');
    console.log('- users');
    console.log('- occurrences');
    console.log('- expenses');
    console.log('- income');
    console.log('- maintenance_requests');
    console.log('- notifications');
    console.log('- reservations');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
