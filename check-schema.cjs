const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function checkSchema() {
  const SQL = await initSqlJs();
  const DB_PATH = path.join(__dirname, 'condo.db');
  
  if (!fs.existsSync(DB_PATH)) {
    console.log('Banco de dados não encontrado!');
    return;
  }
  
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);
  
  console.log('=== SCHEMA DA TABELA OCCURRENCES ===');
  const schema = db.exec("PRAGMA table_info(occurrences)");
  if (schema.length > 0) {
    const columns = schema[0].columns;
    const values = schema[0].values;
    console.log('Colunas:');
    values.forEach(row => {
      console.log(`  ${row[1]} (${row[2]})`);
    });
  } else {
    console.log('Tabela occurrences não encontrada');
  }
  
  db.close();
}

checkSchema().catch(console.error);
