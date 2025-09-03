"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.avyraEdaiApi = void 0;
const app_1 = __importDefault(require("./app"));
const avyraEdaiApi = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    (0, app_1.default)(req, res);
};
exports.avyraEdaiApi = avyraEdaiApi;
exports.api = exports.avyraEdaiApi;
//# sourceMappingURL=functions.js.map