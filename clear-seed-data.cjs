const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.log('DATABASE_URL não encontrada no .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Passe --wipe para apagar TUDO (exceto o admin). Sem flag, apaga só os dados de seed conhecidos.
const WIPE_ALL = process.argv.includes('--wipe');

async function clearSeedData() {
  const client = await pool.connect();
  try {
    console.log(`=== LIMPANDO DADOS ${WIPE_ALL ? '(WIPE TOTAL, mantendo admin)' : 'FICTÍCIOS (seed)'} ===\n`);
    let total = 0;

    if (WIPE_ALL) {
      for (const table of ['maintenance_requests', 'reservations', 'occurrences', 'notifications', 'income', 'expenses']) {
        const r = await client.query(`DELETE FROM ${table}`);
        console.log(`- ${table}: ${r.rowCount} removidos`);
        total += r.rowCount;
      }
      const u = await client.query("DELETE FROM users WHERE role <> 'admin'");
      console.log(`- users (não-admin): ${u.rowCount} removidos`);
      total += u.rowCount;
    } else {
      const exp = await client.query(
        `DELETE FROM expenses WHERE description IN ('Manutenção Elevador','Conta de Luz - Áreas Comuns','Limpeza Quinzenal','Reparo Portão Garagem')`
      );
      console.log(`- expenses: ${exp.rowCount} removidos`);
      total += exp.rowCount;

      const inc = await client.query(`DELETE FROM income WHERE description = 'Cotas Condominiais - JAN'`);
      console.log(`- income: ${inc.rowCount} removidos`);
      total += inc.rowCount;

      const notif = await client.query(`DELETE FROM notifications WHERE title = 'Manutenção de Elevadores'`);
      console.log(`- notifications: ${notif.rowCount} removidos`);
      total += notif.rowCount;

      // Reservas do morador fictício (e seed conhecido)
      const resv = await client.query(
        `DELETE FROM reservations WHERE user_id IN (SELECT id FROM users WHERE email = 'resident@example.com')
         OR (area_name = 'Salão de Festas' AND date = '2024-02-15')
         OR (area_name = 'Churrasqueira' AND date = '2024-02-20')`
      );
      console.log(`- reservations: ${resv.rowCount} removidos`);
      total += resv.rowCount;

      // Usuário fictício (depois de remover dependências)
      const usr = await client.query(`DELETE FROM users WHERE email = 'resident@example.com'`);
      console.log(`- users (resident@example.com): ${usr.rowCount} removidos`);
      total += usr.rowCount;
    }

    console.log(`\n✅ Total removido: ${total}`);
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

clearSeedData();
