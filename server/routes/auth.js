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
var express_1 = require("express");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var database_js_1 = require("../database.js");
var middleware_js_1 = require("../middleware.js");
var validation_js_1 = require("../validation.js");
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var JWT_SECRET = process.env.JWT_SECRET;
var router = (0, express_1.Router)();
function getDB() {
    return global.__db;
}
router.post("/register", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validation, _a, email, password, name_1, unit, phone, existing, hash;
    return __generator(this, function (_b) {
        try {
            validation = validation_js_1.registerSchema.safeParse(req.body);
            if (!validation.success) {
                return [2 /*return*/, res.status(400).json({ error: validation.error.issues[0].message })];
            }
            _a = validation.data, email = _a.email, password = _a.password, name_1 = _a.name, unit = _a.unit, phone = _a.phone;
            existing = (0, database_js_1.query)(getDB(), "SELECT id FROM users WHERE email = ?", [email]);
            if (existing.length > 0)
                return [2 /*return*/, res.status(409).json({ error: "Email já cadastrado" })];
            hash = bcryptjs_1.default.hashSync(password, 12);
            (0, database_js_1.query)(getDB(), "INSERT INTO users (email, password, name, role, status, unit, phone) VALUES (?, ?, ?, 'resident', 'pending', ?, ?)", [email, hash, name_1, unit || null, phone || null]);
            (0, database_js_1.saveDB)(getDB());
            res.status(201).json({ message: "Cadastro realizado! Aguarde a aprovação do síndico." });
        }
        catch (error) {
            console.error("Register error:", error);
            res.status(500).json({ error: "Erro ao realizar cadastro" });
        }
        return [2 /*return*/];
    });
}); });
router.post("/login", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var ip, validation, _a, email, password, rows, user, token;
    var _b;
    return __generator(this, function (_c) {
        try {
            ip = ((_b = req.ip) !== null && _b !== void 0 ? _b : req.socket.remoteAddress) || "unknown";
            if (!(0, middleware_js_1.checkLoginRateLimit)(ip))
                return [2 /*return*/, res.status(429).json({ error: "Muitas tentativas. Tente novamente em 15 minutos." })];
            validation = validation_js_1.loginSchema.safeParse(req.body);
            if (!validation.success) {
                return [2 /*return*/, res.status(400).json({ error: validation.error.issues[0].message })];
            }
            _a = validation.data, email = _a.email, password = _a.password;
            rows = (0, database_js_1.query)(getDB(), "SELECT * FROM users WHERE email = ?", [email]);
            user = rows[0];
            if (!user || !bcryptjs_1.default.compareSync(password, user.password))
                return [2 /*return*/, res.status(401).json({ error: "Credenciais inválidas" })];
            if (user.status === "pending")
                return [2 /*return*/, res.status(403).json({ error: "Cadastro aguardando aprovação do síndico." })];
            if (user.status === "rejected")
                return [2 /*return*/, res.status(403).json({ error: "Cadastro não aprovado. Entre em contato com o síndico." })];
            (0, middleware_js_1.resetLoginRateLimit)(ip);
            token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "24h" });
            res.json({ token: token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
        }
        catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ error: "Erro interno do servidor" });
        }
        return [2 /*return*/];
    });
}); });
exports.default = router;
