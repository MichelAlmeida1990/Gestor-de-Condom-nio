const fs = require('fs');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');

(async () => {
  const newPassword = process.argv[2];
  if (!newPassword) {
    console.error('Uso: node scripts/set-admin-password.cjs <novaSenha>');
    process.exit(1);
  }

  const DB_PATH = 'condo.db';
  if (!fs.existsSync(DB_PATH)) {
    console.error('Arquivo condo.db não encontrado na raiz do projeto. Pare o servidor e verifique.');
    process.exit(1);
  }

  try {
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(fileBuffer);

    const newHash = bcrypt.hashSync(newPassword, 12);
    db.run('UPDATE users SET password = ? WHERE email = ?', [newHash, 'admin@condo.com']);

    fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
    console.log('Senha do admin atualizada com sucesso.');
  } catch (err) {
    console.error('Erro ao atualizar senha:', err && (err.stack || err));
    process.exit(1);
  }
})();
