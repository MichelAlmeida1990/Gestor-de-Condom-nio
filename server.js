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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var vite_1 = require("vite");
var plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
var vite_2 = __importDefault(require("@tailwindcss/vite"));
var path_1 = __importDefault(require("path"));
var cors_1 = __importDefault(require("cors"));
var helmet_1 = __importDefault(require("helmet"));
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var database_ts_1 = require("./server/database.ts");
var auth_ts_1 = __importDefault(require("./server/routes/auth.ts"));
var expenses_ts_1 = __importDefault(require("./server/routes/expenses.ts"));
var income_ts_1 = __importDefault(require("./server/routes/income.ts"));
var notifications_ts_1 = __importDefault(require("./server/routes/notifications.ts"));
var users_ts_1 = __importDefault(require("./server/routes/users.ts"));
var occurrences_ts_1 = __importDefault(require("./server/routes/occurrences.ts"));
var transparency_ts_1 = __importDefault(require("./server/routes/transparency.ts"));
var reservations_ts_1 = __importDefault(require("./server/routes/reservations.ts"));
var middleware_ts_1 = require("./server/middleware.ts");
var PORT = parseInt(process.env.PORT || "3000");
var ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map(function (o) { return o.trim(); })
    : ["http://localhost:3000", "http://localhost:5173"];
var CORS_ORIGINS = __spreadArray(__spreadArray([], ALLOWED_ORIGINS, true), [/\.vercel\.app$/, /\.onrender\.com$/], false);
function startServer() {
    return __awaiter(this, void 0, void 0, function () {
        var db, app, vite, distPath_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, database_ts_1.initDB)()];
                case 1:
                    db = _a.sent();
                    // Store db instance globally for route modules
                    global.__db = db;
                    app = (0, express_1.default)();
                    app.use(express_1.default.json({ limit: "10mb" }));
                    app.use((0, cors_1.default)({ origin: CORS_ORIGINS, credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
                    // Set correct MIME types for JavaScript modules
                    app.use(function (req, res, next) {
                        if (req.path.endsWith('.js') || req.path.endsWith('.mjs')) {
                            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
                        }
                        next();
                    });
                    app.use((0, helmet_1.default)({
                        contentSecurityPolicy: false,
                        crossOriginEmbedderPolicy: false,
                    }));
                    // API Routes
                    app.use("/api/auth", middleware_ts_1.rateLimit, auth_ts_1.default);
                    app.use("/api/expenses", middleware_ts_1.rateLimit, expenses_ts_1.default);
                    app.use("/api/income", middleware_ts_1.rateLimit, income_ts_1.default);
                    app.use("/api/notifications", middleware_ts_1.rateLimit, notifications_ts_1.default);
                    app.use("/api", middleware_ts_1.rateLimit, users_ts_1.default);
                    app.use("/api/occurrences", middleware_ts_1.rateLimit, occurrences_ts_1.default);
                    app.use("/api/transparency", middleware_ts_1.rateLimit, transparency_ts_1.default);
                    app.use("/api/reservations", middleware_ts_1.rateLimit, reservations_ts_1.default);
                    // Global error handler
                    app.use(middleware_ts_1.errorHandler);
                    if (!(process.env.NODE_ENV !== "production")) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, vite_1.createServer)({
                            root: process.cwd(),
                            configFile: false,
                            server: { middlewareMode: true },
                            appType: "spa",
                            plugins: [(0, plugin_react_1.default)(), (0, vite_2.default)()],
                        })];
                case 2:
                    vite = _a.sent();
                    app.use(vite.middlewares);
                    return [3 /*break*/, 4];
                case 3:
                    distPath_1 = path_1.default.join(process.cwd(), "dist");
                    app.use(express_1.default.static(distPath_1, {
                        setHeaders: function (res, filePath) {
                            if (filePath.endsWith('.js')) {
                                res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
                            }
                        }
                    }));
                    app.get("*", function (req, res) { return res.sendFile(path_1.default.join(distPath_1, "index.html")); });
                    _a.label = 4;
                case 4:
                    app.listen(PORT, "0.0.0.0", function () { return console.log("\u2705 Server running on http://localhost:".concat(PORT)); });
                    return [2 /*return*/];
            }
        });
    });
}
startServer();
