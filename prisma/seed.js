"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var adapter_mariadb_1 = require("@prisma/adapter-mariadb");
var dotenv = __importStar(require("dotenv"));
dotenv.config();
var dbUrl = process.env.DATABASE_URL;
if (!dbUrl)
    throw new Error("DATABASE_URL is not set");
var adapter = new adapter_mariadb_1.PrismaMariaDb(dbUrl);
var prisma = new client_1.PrismaClient({ adapter: adapter });
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var dummyUser, dummyUser1, dummyUser2, dummyUser3, dummyUser4, partnersData, _i, partnersData_1, p, partner;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.user.upsert({
                        where: { email: 'admin@wearwise.com' },
                        update: {},
                        create: {
                            name: 'WearWise Admin',
                            email: 'admin@wearwise.com',
                            password: '$2b$10$wXeurq1Dq0kJPRHQxyg0QuqAKIXUvyi.CTiNgOsJNvWKkf38lzVz6', // password123
                            phone: '081234567890',
                            address: 'Jakarta',
                            role: 'admin',
                        },
                    })
                    // We need distinct user IDs for each partner due to the @unique constraint on userId
                    // So we'll create a few dummy partner accounts
                ];
                case 1:
                    dummyUser = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'partner1@wearwise.com' },
                            update: {},
                            create: {
                                name: 'Panti Asuhan Kasih Bunda',
                                email: 'partner1@wearwise.com',
                                password: '$2b$10$wXeurq1Dq0kJPRHQxyg0QuqAKIXUvyi.CTiNgOsJNvWKkf38lzVz6', // password123
                                phone: '08111111111',
                                address: 'Jl. Sudirman No. 1, Jakarta',
                                role: 'partner',
                            },
                        })];
                case 2:
                    dummyUser1 = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'partner2@wearwise.com' },
                            update: {},
                            create: {
                                name: 'Yayasan Baju Bekas',
                                email: 'partner2@wearwise.com',
                                password: '$2b$10$wXeurq1Dq0kJPRHQxyg0QuqAKIXUvyi.CTiNgOsJNvWKkf38lzVz6', // password123
                                phone: '08222222222',
                                address: 'Bandung',
                                role: 'partner',
                            },
                        })];
                case 3:
                    dummyUser2 = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'partner3@wearwise.com' },
                            update: {},
                            create: {
                                name: 'Donasi Baju Surabaya',
                                email: 'partner3@wearwise.com',
                                password: '$2b$10$wXeurq1Dq0kJPRHQxyg0QuqAKIXUvyi.CTiNgOsJNvWKkf38lzVz6', // password123
                                phone: '08333333333',
                                address: 'Surabaya',
                                role: 'partner',
                            },
                        })];
                case 4:
                    dummyUser3 = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'partner4@wearwise.com' },
                            update: {},
                            create: {
                                name: 'Panti Asuhan Depok',
                                email: 'partner4@wearwise.com',
                                password: '$2b$10$wXeurq1Dq0kJPRHQxyg0QuqAKIXUvyi.CTiNgOsJNvWKkf38lzVz6', // password123
                                phone: '08444444444',
                                address: 'Margonda Raya, Depok',
                                role: 'partner',
                            },
                        })];
                case 5:
                    dummyUser4 = _a.sent();
                    partnersData = [
                        {
                            userId: dummyUser1.id,
                            type: 'donate',
                            name: 'Panti Asuhan Kasih Bunda',
                            description: 'Menerima donasi pakaian layak pakai untuk anak-anak dan dewasa.',
                            address: 'Monumen Nasional, Jakarta', // Using known landmarks for easy geocoding
                            phone: '08111111111',
                            latitude: -6.1753924,
                            longitude: 106.8271528,
                        },
                        {
                            userId: dummyUser2.id,
                            type: 'donate',
                            name: 'Yayasan Baju Bekas Bandung',
                            description: 'Donasi untuk masyarakat kurang mampu di daerah Jawa Barat.',
                            address: 'Gedung Sate, Bandung',
                            phone: '08222222222',
                            latitude: -6.9024812,
                            longitude: 107.61881,
                        },
                        {
                            userId: dummyUser3.id,
                            type: 'donate',
                            name: 'Pusat Donasi Pakaian Surabaya',
                            description: 'Menyalurkan pakaian untuk korban bencana.',
                            address: 'Tugu Pahlawan, Surabaya',
                            phone: '08333333333',
                            latitude: -7.2458428,
                            longitude: 112.7378039,
                        },
                        {
                            userId: dummyUser4.id,
                            type: 'donate',
                            name: 'Panti Asuhan Depok Terpadu',
                            description: 'Pusat penampungan baju bekas layak pakai area Depok.',
                            address: 'Universitas Indonesia, Depok',
                            phone: '08444444444',
                            latitude: -6.360623,
                            longitude: 106.827282,
                        }
                    ];
                    console.log("Start seeding ...");
                    _i = 0, partnersData_1 = partnersData;
                    _a.label = 6;
                case 6:
                    if (!(_i < partnersData_1.length)) return [3 /*break*/, 9];
                    p = partnersData_1[_i];
                    return [4 /*yield*/, prisma.partner.upsert({
                            where: { userId: p.userId },
                            update: p,
                            create: p,
                        })];
                case 7:
                    partner = _a.sent();
                    console.log("Created/Updated partner with id: ".concat(partner.id));
                    _a.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 6];
                case 9:
                    console.log("Seeding finished.");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })
    .catch(function (e) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.error(e);
                return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
