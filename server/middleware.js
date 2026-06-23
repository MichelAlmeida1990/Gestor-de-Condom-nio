"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLoginRateLimit = checkLoginRateLimit;
exports.resetLoginRateLimit = resetLoginRateLimit;
exports.rateLimit = rateLimit;
exports.authenticate = authenticate;
exports.isAdmin = isAdmin;
exports.errorHandler = errorHandler;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("❌ JWT_SECRET não configurado no arquivo .env");
    process.exit(1);
}
// Rate limiter for login
var loginAttempts = new Map();
var MAX_LOGIN_ATTEMPTS = 5;
var LOGIN_WINDOW_MS = 15 * 60 * 1000;
function checkLoginRateLimit(ip) {
    var now = Date.now();
    var entry = loginAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
        loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
        return true;
    }
    if (entry.count >= MAX_LOGIN_ATTEMPTS)
        return false;
    entry.count++;
    return true;
}
function resetLoginRateLimit(ip) {
    loginAttempts.delete(ip);
}
// General rate limiter for API routes
var rateLimitMap = new Map();
var MAX_REQUESTS_PER_MINUTE = 60;
var RATE_LIMIT_WINDOW_MS = 60 * 1000;
function rateLimit(req, res, next) {
    var _a;
    var ip = ((_a = req.ip) !== null && _a !== void 0 ? _a : req.socket.remoteAddress) || "unknown";
    var now = Date.now();
    var entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        next();
        return;
    }
    if (entry.count >= MAX_REQUESTS_PER_MINUTE) {
        return res.status(429).json({ error: "Muitas requisições. Tente novamente em 1 minuto." });
    }
    entry.count++;
    next();
}
function authenticate(req, res, next) {
    var _a;
    var token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token)
        return res.status(401).json({ error: "Unauthorized" });
    try {
        req.user = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        next();
    }
    catch (_b) {
        res.status(401).json({ error: "Invalid token" });
    }
}
function isAdmin(req, res, next) {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ error: "Forbidden" });
    next();
}
// Global error handler
function errorHandler(err, req, res, next) {
    console.error("Error:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
}
