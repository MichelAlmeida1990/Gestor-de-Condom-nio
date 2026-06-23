"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.run = run;
exports.saveDB = saveDB;
exports.initDB = initDB;
var sql_js_1 = __importDefault(require("sql.js"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var DB_PATH = path_1.default.join(process.cwd(), "condo.db");
// Helpers para adaptar sql.js ao padrão de uso pg-like
function query(db, sql, params) {
    if (params === void 0) { params = []; }
    var stmt = db.prepare(sql);
    stmt.bind(params);
    var rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}
function run(db, sql, params) {
    var _a, _b;
    if (params === void 0) { params = []; }
    db.run(sql, params);
    var changes = (_b = (_a = db.exec("SELECT changes() as c")[0]) === null || _a === void 0 ? void 0 : _a.values[0][0]) !== null && _b !== void 0 ? _b : 0;
    return { rowCount: changes };
}
function saveDB(db) {
    var data = db.export();
    fs_1.default.writeFileSync(DB_PATH, Buffer.from(data));
}
function initDB() {
    return __awaiter(this, void 0, void 0, function () {
        var SQL, db, fileBuffer, migrations, _i, migrations_1, sql, adminEmail, adminRows, hash, residentEmail, residentRows, hash, expRows, expenses, _a, expenses_1, _b, desc, amt, cat, date, incRows, notifRows, resvRows, resId, reservations, _c, reservations_1, _d, uid, area, date, slot, status_1;
        var _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, (0, sql_js_1.default)()];
                case 1:
                    SQL = _f.sent();
                    if (fs_1.default.existsSync(DB_PATH)) {
                        fileBuffer = fs_1.default.readFileSync(DB_PATH);
                        db = new SQL.Database(fileBuffer);
                    }
                    else {
                        db = new SQL.Database();
                    }
                    db.run("\n    CREATE TABLE IF NOT EXISTS users (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      email TEXT UNIQUE,\n      password TEXT,\n      name TEXT,\n      role TEXT CHECK(role IN ('admin', 'resident')),\n      status TEXT DEFAULT 'active' CHECK(status IN ('pending', 'active', 'rejected')),\n      unit TEXT,\n      phone TEXT,\n      cpf TEXT,\n      birthdate TEXT,\n      emergency_contact TEXT,\n      emergency_phone TEXT,\n      blood_type TEXT,\n      health_notes TEXT,\n      vehicles TEXT,\n      created_at TEXT DEFAULT (datetime('now'))\n    );\n\n    CREATE TABLE IF NOT EXISTS occurrences (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      user_id INTEGER REFERENCES users(id),\n      type TEXT,\n      description TEXT,\n      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved')),\n      admin_response TEXT,\n      created_at TEXT DEFAULT (datetime('now')),\n      updated_at TEXT DEFAULT (datetime('now'))\n    );\n\n    CREATE TABLE IF NOT EXISTS expenses (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      description TEXT,\n      amount REAL,\n      category TEXT,\n      date TEXT,\n      attachment_url TEXT,\n      created_at TEXT DEFAULT (datetime('now'))\n    );\n\n    CREATE TABLE IF NOT EXISTS income (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      description TEXT,\n      amount REAL,\n      date TEXT,\n      created_at TEXT DEFAULT (datetime('now'))\n    );\n\n    CREATE TABLE IF NOT EXISTS notifications (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      title TEXT,\n      message TEXT,\n      date TEXT,\n      expires_at TEXT,\n      created_at TEXT DEFAULT (datetime('now'))\n    );\n\n    CREATE TABLE IF NOT EXISTS reservations (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      user_id INTEGER REFERENCES users(id),\n      area_name TEXT CHECK(area_name IN ('Sal\u00E3o de Festas', 'Churrasqueira', 'Espa\u00E7o Gourmet', 'Quadra Poliesportiva')),\n      date TEXT,\n      time_slot TEXT CHECK(time_slot IN ('Manh\u00E3 (08:00 - 12:00)', 'Tarde (13:00 - 17:00)', 'Noite (18:00 - 22:00)', 'Dia Inteiro (08:00 - 22:00)')),\n      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',\n      created_at TEXT DEFAULT (datetime('now'))\n    );\n  ");
                    migrations = [
                        "ALTER TABLE users ADD COLUMN cpf TEXT",
                        "ALTER TABLE users ADD COLUMN birthdate TEXT",
                        "ALTER TABLE users ADD COLUMN emergency_contact TEXT",
                        "ALTER TABLE users ADD COLUMN emergency_phone TEXT",
                        "ALTER TABLE users ADD COLUMN blood_type TEXT",
                        "ALTER TABLE users ADD COLUMN health_notes TEXT",
                        "ALTER TABLE users ADD COLUMN vehicles TEXT",
                    ];
                    for (_i = 0, migrations_1 = migrations; _i < migrations_1.length; _i++) {
                        sql = migrations_1[_i];
                        try {
                            db.run(sql);
                        }
                        catch ( /* coluna já existe */_g) { /* coluna já existe */ }
                    }
                    adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
                    adminRows = query(db, "SELECT id FROM users WHERE email = ?", [adminEmail]);
                    if (adminRows.length === 0) {
                        hash = bcryptjs_1.default.hashSync(process.env.ADMIN_PASSWORD || "StrongAdminPassword123!", 12);
                        db.run("INSERT INTO users (email, password, name, role, status) VALUES (?, ?, ?, 'admin', 'active')", [adminEmail, hash, "Síndico Admin"]);
                    }
                    residentEmail = process.env.RESIDENT_EMAIL || "resident@example.com";
                    residentRows = query(db, "SELECT id FROM users WHERE email = ?", [residentEmail]);
                    if (residentRows.length === 0) {
                        hash = bcryptjs_1.default.hashSync(process.env.RESIDENT_PASSWORD || "StrongResidentPassword123!", 12);
                        db.run("INSERT INTO users (email, password, name, role, status) VALUES (?, ?, ?, 'resident', 'active')", [residentEmail, hash, "Morador João"]);
                    }
                    expRows = query(db, "SELECT COUNT(*) as count FROM expenses");
                    if (expRows[0].count === 0) {
                        expenses = [
                            ["Manutenção Elevador", 1200.50, "Manutenção", "2024-01-10"],
                            ["Conta de Luz - Áreas Comuns", 850.00, "Energia/Água", "2024-01-15"],
                            ["Limpeza Quinzenal", 450.00, "Limpeza", "2024-01-20"],
                            ["Reparo Portão Garagem", 320.00, "Manutenção", "2024-01-25"],
                        ];
                        for (_a = 0, expenses_1 = expenses; _a < expenses_1.length; _a++) {
                            _b = expenses_1[_a], desc = _b[0], amt = _b[1], cat = _b[2], date = _b[3];
                            db.run("INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)", [desc, amt, cat, date]);
                        }
                    }
                    incRows = query(db, "SELECT COUNT(*) as count FROM income");
                    if (incRows[0].count === 0) {
                        db.run("INSERT INTO income (description, amount, date) VALUES (?, ?, ?)", ["Cotas Condominiais - JAN", 15000.00, "2024-01-05"]);
                    }
                    notifRows = query(db, "SELECT COUNT(*) as count FROM notifications");
                    if (notifRows[0].count === 0) {
                        db.run("INSERT INTO notifications (title, message, date) VALUES (?, ?, ?)", [
                            "Manutenção de Elevadores",
                            "O elevador social do bloco A passará por manutenção preventiva na próxima segunda-feira (10/02) entre 09:00 e 12:00.",
                            "2024-01-30",
                        ]);
                    }
                    resvRows = query(db, "SELECT COUNT(*) as count FROM reservations");
                    resId = (_e = query(db, "SELECT id FROM users WHERE email = ?", [residentEmail])[0]) === null || _e === void 0 ? void 0 : _e.id;
                    if (resvRows[0].count === 0 && resId) {
                        reservations = [
                            [resId, "Salão de Festas", "2024-02-15", "Noite (18:00 - 22:00)", "approved"],
                            [resId, "Churrasqueira", "2024-02-20", "Dia Inteiro (08:00 - 22:00)", "pending"],
                        ];
                        for (_c = 0, reservations_1 = reservations; _c < reservations_1.length; _c++) {
                            _d = reservations_1[_c], uid = _d[0], area = _d[1], date = _d[2], slot = _d[3], status_1 = _d[4];
                            db.run("INSERT INTO reservations (user_id, area_name, date, time_slot, status) VALUES (?, ?, ?, ?, ?)", [uid, area, date, slot, status_1]);
                        }
                    }
                    saveDB(db);
                    return [2 /*return*/, db];
            }
        });
    });
}
