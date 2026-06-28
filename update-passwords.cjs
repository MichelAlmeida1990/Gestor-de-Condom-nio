const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function updatePasswords() {
  const SQL = await initSqlJs();
  const DB_PATH = path.join(__dirname, 'condo.db');
  
  if (!fs.existsSync(DB_PATH)) {
    console.log('Banco de dados não encontrado!');
    return;
  }
  
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);
  
  // Atualizar senha do admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "StrongAdminPassword123!";
  const adminHash = bcrypt.hashSync(adminPassword, 12);
  
  db.run("UPDATE users SET password = ? WHERE email = ?", [adminHash, adminEmail]);
  console.log(`Senha do admin atualizada para: ${adminEmail} / ${adminPassword}`);
  
  // Atualizar senha do resident
  const residentEmail = process.env.RESIDENT_EMAIL || "resident@example.com";
  const residentPassword = process.env.RESIDENT_PASSWORD || "StrongResidentPassword123!";
  const residentHash = bcrypt.hashSync(residentPassword, 12);
  
  db.run("UPDATE users SET password = ? WHERE email = ?", [residentHash, residentEmail]);
  console.log(`Senha do resident atualizada para: ${residentEmail} / ${residentPassword}`);
  
  // Salvar o banco
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  
  console.log('Banco de dados atualizado com sucesso!');
  
  db.close();
}

updatePasswords().catch(console.error);
