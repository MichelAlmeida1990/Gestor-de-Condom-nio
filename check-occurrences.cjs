const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function checkOccurrences() {
  const SQL = await initSqlJs();
  const DB_PATH = path.join(__dirname, 'condo.db');
  
  if (!fs.existsSync(DB_PATH)) {
    console.log('Banco de dados não encontrado!');
    return;
  }
  
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);
  
  console.log('=== OCORRÊNCIAS COMPLETAS ===');
  const occurrences = db.exec("SELECT * FROM occurrences");
  if (occurrences.length > 0) {
    const columns = occurrences[0].columns;
    occurrences[0].values.forEach(row => {
      console.log('---');
      columns.forEach((col, index) => {
        console.log(`${col}: ${row[index]}`);
      });
    });
  } else {
    console.log('Nenhuma ocorrência encontrada');
  }
  
  db.close();
}

checkOccurrences().catch(console.error);
