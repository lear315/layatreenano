"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
/**
 * 服务器配置
 */
exports.config = {
    // 服务器端口
    port: 8080,
    // 心跳检测间隔（毫秒）
    heartbeatInterval: 30000,
    // 最大连接数
    maxConnections: 1000
};
