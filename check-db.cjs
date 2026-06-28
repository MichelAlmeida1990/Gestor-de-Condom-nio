const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function checkDatabase() {
  const SQL = await initSqlJs();
  const DB_PATH = path.join(__dirname, 'condo.db');
  
  if (!fs.existsSync(DB_PATH)) {
    console.log('Banco de dados não encontrado!');
    return;
  }
  
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);
  
  console.log('=== USUÁRIOS CADASTRADOS ===');
  const users = db.exec("SELECT id, email, name, role, status, unit, phone FROM users");
  if (users.length > 0) {
    users[0].values.forEach(row => {
      console.log(`ID: ${row[0]}, Email: ${row[1]}, Nome: ${row[2]}, Role: ${row[3]}, Status: ${row[4]}, Unidade: ${row[5]}, Telefone: ${row[6]}`);
    });
  } else {
    console.log('Nenhum usuário encontrado');
  }
  
  console.log('\n=== OCORRÊNCIAS ===');
  const occurrences = db.exec("SELECT id, type, status, created_at FROM occurrences");
  if (occurrences.length > 0) {
    console.log(`Total de ocorrências: ${occurrences[0].values.length}`);
    occurrences[0].values.slice(0, 5).forEach(row => {
      console.log(`ID: ${row[0]}, Tipo: ${row[1]}, Status: ${row[2]}, Data: ${row[3]}`);
    });
  } else {
    console.log('Nenhuma ocorrência encontrada');
  }
  
  console.log('\n=== RESERVAS ===');
  const reservations = db.exec("SELECT id, area_name, date, status FROM reservations");
  if (reservations.length > 0) {
    console.log(`Total de reservas: ${reservations[0].values.length}`);
    reservations[0].values.slice(0, 5).forEach(row => {
      console.log(`ID: ${row[0]}, Área: ${row[1]}, Data: ${row[2]}, Status: ${row[3]}`);
    });
  } else {
    console.log('Nenhuma reserva encontrada');
  }
  
  console.log('\n=== DESPESAS ===');
  const expenses = db.exec("SELECT id, description, amount, date FROM expenses");
  if (expenses.length > 0) {
    console.log(`Total de despesas: ${expenses[0].values.length}`);
    expenses[0].values.slice(0, 5).forEach(row => {
      console.log(`ID: ${row[0]}, Descrição: ${row[1]}, Valor: ${row[2]}, Data: ${row[3]}`);
    });
  } else {
    console.log('Nenhuma despesa encontrada');
  }
  
  db.close();
}

checkDatabase().catch(console.error);
