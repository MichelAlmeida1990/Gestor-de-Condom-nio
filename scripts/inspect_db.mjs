import initSqlJs from 'sql.js';
import fs from 'fs';

async function main() {
  try {
    const DB_PATH = 'condo.db';
    if (!fs.existsSync(DB_PATH)) {
      console.error('condo.db not found');
      process.exit(2);
    }
    const buffer = fs.readFileSync(DB_PATH);
    const SQL = await initSqlJs();
    const db = new SQL.Database(buffer);
    const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    const tables = (tablesRes[0]?.values || []).map(r => r[0]);
    console.log('tables:', tables);
    const names = ['users','expenses','income','notifications','reservations','occurrences'];
    for (const name of names) {
      try {
        const res = db.exec(`SELECT COUNT(*) AS count FROM ${name}`)[0];
        const count = (res?.values?.[0]?.[0]) ?? 0;
        console.log(name, count);
      } catch (e) {
        console.log(name, 'ERROR', e.message || e);
      }
    }
    db.close();
  } catch (err) {
    console.error('Error inspecting DB:', err);
    process.exit(1);
  }
}

main();
