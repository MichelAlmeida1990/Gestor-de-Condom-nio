import dns from "node:dns";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Render and other hosts often lack IPv6; Supabase direct host resolves to IPv6 first.
dns.setDefaultResultOrder("ipv4first");

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for PostgreSQL connection.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

export async function query<T = any>(text: string, params: unknown[] = []) {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function run(text: string, params: unknown[] = []) {
  const result = await pool.query(text, params);
  return { rowCount: result.rowCount };
}

export async function initDB(): Promise<Pool> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'resident')),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected')),
        unit TEXT,
        phone TEXT,
        cpf TEXT,
        birthdate DATE,
        emergency_contact TEXT,
        emergency_phone TEXT,
        blood_type TEXT,
        health_notes TEXT,
        vehicles TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS occurrences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type TEXT,
        description TEXT,
        occurrence_date DATE,
        occurrence_time TEXT,
        evidence_url TEXT,
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
        admin_response TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        description TEXT,
        amount NUMERIC,
        category TEXT,
        date DATE,
        attachment_url TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS income (
        id SERIAL PRIMARY KEY,
        description TEXT,
        amount NUMERIC,
        date DATE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title TEXT,
        message TEXT,
        date DATE,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        area_name TEXT CHECK(area_name IN ('Salão de Festas', 'Churrasqueira', 'Espaço Gourmet', 'Quadra Poliesportiva')),
        date DATE,
        time_slot TEXT CHECK(time_slot IN ('Manhã (08:00 - 12:00)', 'Tarde (13:00 - 17:00)', 'Noite (18:00 - 22:00)', 'Dia Inteiro (08:00 - 22:00)')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "StrongAdminPassword123!";
    const residentEmail = process.env.RESIDENT_EMAIL || "resident@example.com";
    const residentPassword = process.env.RESIDENT_PASSWORD || "StrongResidentPassword123!";

    const { rows: adminRows } = await client.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
    if (adminRows.length === 0) {
      const hash = bcrypt.hashSync(adminPassword, 12);
      await client.query(
        "INSERT INTO users (email, password, name, role, status) VALUES ($1, $2, $3, 'admin', 'active')",
        [adminEmail, hash, "Síndico Admin"]
      );
    }

    const { rows: residentRows } = await client.query("SELECT id FROM users WHERE email = $1", [residentEmail]);
    if (residentRows.length === 0) {
      const hash = bcrypt.hashSync(residentPassword, 12);
      await client.query(
        "INSERT INTO users (email, password, name, role, status) VALUES ($1, $2, $3, 'resident', 'active')",
        [residentEmail, hash, "Morador João"]
      );
    }
  } finally {
    client.release();
  }

  return pool;
}

