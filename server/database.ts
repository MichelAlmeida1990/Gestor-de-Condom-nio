import initSqlJs, { Database } from "sql.js";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const DB_PATH = path.join(process.cwd(), "condo.db");

// Helpers para adaptar sql.js ao padrão de uso pg-like
export function query(db: Database, sql: string, params: unknown[] = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params as any);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as Record<string, unknown>);
  }
  stmt.free();
  return rows;
}

export function run(db: Database, sql: string, params: unknown[] = []) {
  db.run(sql, params as any);
  const changes = (db.exec("SELECT changes() as c")[0]?.values[0][0] as number) ?? 0;
  return { rowCount: changes };
}

export function saveDB(db: Database) {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export async function initDB(): Promise<Database> {
  const SQL = await initSqlJs();
  let db: Database;

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      role TEXT CHECK(role IN ('admin', 'resident')),
      status TEXT DEFAULT 'active' CHECK(status IN ('pending', 'active', 'rejected')),
      unit TEXT,
      phone TEXT,
      cpf TEXT,
      birthdate TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      blood_type TEXT,
      health_notes TEXT,
      vehicles TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS occurrences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      type TEXT,
      description TEXT,
      occurrence_date TEXT,
      occurrence_time TEXT,
      evidence_url TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved')),
      admin_response TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT,
      amount REAL,
      category TEXT,
      date TEXT,
      attachment_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT,
      amount REAL,
      date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      message TEXT,
      date TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      area_name TEXT CHECK(area_name IN ('Salão de Festas', 'Churrasqueira', 'Espaço Gourmet', 'Quadra Poliesportiva')),
      date TEXT,
      time_slot TEXT CHECK(time_slot IN ('Manhã (08:00 - 12:00)', 'Tarde (13:00 - 17:00)', 'Noite (18:00 - 22:00)', 'Dia Inteiro (08:00 - 22:00)')),
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migrations: adicionar colunas se não existirem
  const migrations = [
    "ALTER TABLE users ADD COLUMN cpf TEXT",
    "ALTER TABLE users ADD COLUMN birthdate TEXT",
    "ALTER TABLE users ADD COLUMN emergency_contact TEXT",
    "ALTER TABLE users ADD COLUMN emergency_phone TEXT",
    "ALTER TABLE users ADD COLUMN blood_type TEXT",
    "ALTER TABLE users ADD COLUMN health_notes TEXT",
    "ALTER TABLE users ADD COLUMN vehicles TEXT",
    "ALTER TABLE occurrences ADD COLUMN occurrence_date TEXT",
    "ALTER TABLE occurrences ADD COLUMN occurrence_time TEXT",
    "ALTER TABLE occurrences ADD COLUMN evidence_url TEXT",
  ];
  for (const sql of migrations) {
    try { db.run(sql); } catch { /* coluna já existe */ }
  }

  // Seed admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminRows = query(db, "SELECT id FROM users WHERE email = ?", [adminEmail]);
  if (adminRows.length === 0) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "StrongAdminPassword123!", 12);
    db.run("INSERT INTO users (email, password, name, role, status) VALUES (?, ?, ?, 'admin', 'active')", [adminEmail, hash, "Síndico Admin"]);
  }

  // Seed resident
  const residentEmail = process.env.RESIDENT_EMAIL || "resident@example.com";
  const residentRows = query(db, "SELECT id FROM users WHERE email = ?", [residentEmail]);
  if (residentRows.length === 0) {
    const hash = bcrypt.hashSync(process.env.RESIDENT_PASSWORD || "StrongResidentPassword123!", 12);
    db.run("INSERT INTO users (email, password, name, role, status) VALUES (?, ?, ?, 'resident', 'active')", [residentEmail, hash, "Morador João"]);
  }

  saveDB(db);
  return db;
}

