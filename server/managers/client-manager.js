"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientManager = void 0;
const ws_1 = __importDefault(require("ws"));
const uuid_1 = require("uuid");
const config_1 = require("../config");
const messages_1 = require("../types/messages");
/**
 * 客户端管理器
 * 负责管理所有连接的WebSocket客户端
 */
class ClientManager {
    constructor() {
        this.clients = new Map();
        this.uniqueIdToUpperId = new Map(); // 唯一标识ID到上位机ID的映射
        // 启动心跳检测
        this.heartbeatInterval = setInterval(() => {
            this.checkHeartbeats();
        }, config_1.config.heartbeatInterval);
    }
    /**
     * 添加新客户端
     * @param ws WebSocket连接
     * @param clientType 客户端类型
     * @returns 生成的客户端ID
     */
    addClient(ws, clientType) {
        // 检查是否超过最大连接数
        if (this.clients.size >= config_1.config.maxConnections) {
            ws.close(1013, '服务器已达到最大连接数');
            return '';
        }
        const clientId = (0, uuid_1.v4)();
        const now = new Date();
        this.clients.set(clientId, {
            id: clientId,
            ws,
            connectedAt: now,
            lastActivity: now,
            clientType
        });
        return clientId;
    }
    /**
     * 移除客户端
     * @param clientId 客户端ID
     */
    removeClient(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            // 如果客户端已匹配，通知匹配的另一方
            if (client.matchedWith) {
                const matchedClient = this.clients.get(client.matchedWith);
                if (matchedClient) {
                    // 根据客户端类型发送不同的断开连接通知
                    if (client.clientType === messages_1.ClientType.UPPER) {
                        this.sendMessageToClient(matchedClient.id, {
                            type: messages_1.MessageType.LOWER_CONNECT_FAIL,
                            message: '上位机已断开连接'
                        });
                    }
                    else {
                        this.sendMessageToClient(matchedClient.id, {
                            type: messages_1.MessageType.LOWER_CONNECT_FAIL,
                            message: '下位机已断开连接'
                        });
                    }
                    // 清除匹配关系
                    matchedClient.matchedWith = undefined;
                }
            }
            // 如果是上位机，清除唯一标识ID映射
            if (client.clientType === messages_1.ClientType.UPPER && client.uniqueId) {
                this.uniqueIdToUpperId.delete(client.uniqueId);
            }
            // 移除客户端
            this.clients.delete(clientId);
        }
    }
    /**
     * 获取客户端信息
     * @param clientId 客户端ID
     * @returns 客户端信息或undefined
     */
    getClient(clientId) {
        return this.clients.get(clientId);
    }
    /**
     * 向指定客户端发送消息
     * @param clientId 目标客户端ID
     * @param message 消息内容
     * @returns 是否发送成功
     */
    sendMessageToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === ws_1.default.OPEN) {
            client.ws.send(JSON.stringify(message));
            client.lastActivity = new Date();
            return true;
        }
        return false;
    }
    /**
     * 注册上位机并生成唯一标识ID
     * @param clientId 上位机客户端ID
     * @returns 生成的唯一标识ID，如果失败则返回空字符串
     */
    registerUpper(clientId) {
        const client = this.clients.get(clientId);
        if (!client || client.clientType !== messages_1.ClientType.UPPER) {
            return '';
        }
        // 生成唯一标识ID
        const uniqueId = (0, uuid_1.v4)();
        // 更新客户端信息
        client.uniqueId = uniqueId;
        // 添加映射关系
        this.uniqueIdToUpperId.set(uniqueId, clientId);
        // 通知上位机注册成功
        this.sendMessageToClient(clientId, {
            type: messages_1.MessageType.UPPER_REGISTER_SUCCESS,
            uniqueId,
            message: '上位机注册成功'
        });
        console.log(`上位机 ${clientId} 注册成功，唯一标识ID: ${uniqueId}`);
        return uniqueId;
    }
    /**
     * 连接下位机到上位机
     * @param lowerClientId 下位机客户端ID
     * @param uniqueId 上位机唯一标识ID
     * @returns 是否连接成功
     */
    connectLowerToUpper(lowerClientId, uniqueId) {
        const lowerClient = this.clients.get(lowerClientId);
        // 检查下位机是否存在
        if (!lowerClient || lowerClient.clientType !== messages_1.ClientType.LOWER) {
            return false;
        }
        // 查找上位机
        const upperClientId = this.uniqueIdToUpperId.get(uniqueId);
        if (!upperClientId) {
            // 上位机不存在
            this.sendMessageToClient(lowerClientId, {
                type: messages_1.MessageType.LOWER_CONNECT_FAIL,
                message: '找不到对应的上位机'
            });
            return false;
        }
        const upperClient = this.clients.get(upperClientId);
        if (!upperClient) {
            // 上位机不存在（可能已断开连接）
            this.uniqueIdToUpperId.delete(uniqueId);
            this.sendMessageToClient(lowerClientId, {
                type: messages_1.MessageType.LOWER_CONNECT_FAIL,
                message: '上位机已断开连接'
            });
            return false;
        }
        // 检查上位机是否已经匹配了其他下位机
        if (upperClient.matchedWith) {
            const oldLowerClientId = upperClient.matchedWith;
            const oldLowerClient = this.clients.get(oldLowerClientId);
            // 通知旧下位机被替换
            if (oldLowerClient) {
                this.sendMessageToClient(oldLowerClientId, {
                    type: messages_1.MessageType.LOWER_REPLACED,
                    newLowerId: lowerClientId,
                    message: '您已被新的下位机替换'
                });
                // 清除旧下位机的匹配关系
                oldLowerClient.matchedWith = undefined;
            }
            // 通知上位机
            this.sendMessageToClient(upperClientId, {
                type: messages_1.MessageType.LOWER_REPLACED,
                newLowerId: lowerClientId,
                message: '您已被新的下位机替换'
            });
        }
        // 设置匹配关系
        upperClient.matchedWith = lowerClientId;
        lowerClient.matchedWith = upperClientId;
        // 通知双方连接成功
        this.sendMessageToClient(upperClientId, {
            type: messages_1.MessageType.LOWER_CONNECT_SUCCESS,
            lowerId: lowerClientId,
            message: '下位机已连接'
        });
        this.sendMessageToClient(lowerClientId, {
            type: messages_1.MessageType.LOWER_CONNECT_SUCCESS,
            upperId: upperClientId,
            message: '已连接到上位机'
        });
        console.log(`下位机 ${lowerClientId} 已连接到上位机 ${upperClientId}`);
        return true;
    }
    /**
     * 根据唯一标识ID获取上位机ID
     * @param uniqueId 唯一标识ID
     * @returns 上位机客户端ID或undefined
     */
    getUpperIdByUniqueId(uniqueId) {
        return this.uniqueIdToUpperId.get(uniqueId);
    }
    /**
     * 获取所有客户端ID
     * @returns 客户端ID数组
     */
    getAllClientIds() {
        return Array.from(this.clients.keys());
    }
    /**
     * 获取客户端
     * @returns 客户端信息数组
     */
    getAllClientsInfo() {
        const clientsInfo = [];
        this.clients.forEach((client, clientId) => {
            const clientInfo = {
                id: client.id,
                clientType: client.clientType,
                connectedAt: client.connectedAt,
                lastActivity: client.lastActivity,
                uniqueId: client.uniqueId,
                matchedWith: client.matchedWith,
                // 如果已匹配，添加匹配客户端的类型信息
                matchedWithType: client.matchedWith ? this.clients.get(client.matchedWith)?.clientType : undefined,
                // 添加连接状态
                connectionState: client.ws.readyState === ws_1.default.OPEN ? 'connected' : 'disconnected',
                // 计算连接时长
                connectionDuration: Math.floor((new Date().getTime() - client.connectedAt.getTime()) / 1000)
            };
            clientsInfo.push(clientInfo);
        });
        return clientsInfo;
    }
    /**
     * 获取客户端数量
     * @returns 客户端数量
     */
    getClientCount() {
        return this.clients.size;
    }
    /**
     * 检查心跳并断开不活跃的连接
     */
    checkHeartbeats() {
        const now = new Date();
        const timeout = config_1.config.heartbeatInterval * 2; // 超过两个心跳周期未活动则断开
        this.clients.forEach((client, clientId) => {
            const inactiveTime = now.getTime() - client.lastActivity.getTime();
            if (inactiveTime > timeout) {
                console.log(`客户端 ${clientId} 心跳超时，断开连接`);
                // 发送断开连接消息
                if (client.ws.readyState === ws_1.default.OPEN) {
                    client.ws.send(JSON.stringify({
                        type: messages_1.MessageType.DISCONNECT,
                        reason: '心跳超时'
                    }));
                    client.ws.close(1000, '心跳超时');
                }
                // 移除客户端
                this.removeClient(clientId);
            }
            else if (client.ws.readyState === ws_1.default.OPEN) {
                // 发送心跳包
                client.ws.send(JSON.stringify({ type: messages_1.MessageType.HEARTBEAT }));
            }
        });
    }
    /**
     * 清理资源
     */
    dispose() {
        clearInterval(this.heartbeatInterval);
        // 关闭所有连接
        this.clients.forEach((client) => {
            if (client.ws.readyState === ws_1.default.OPEN) {
                client.ws.close(1001, '服务器关闭');
            }
        });
        this.clients.clear();
    }
}
exports.ClientManager = ClientManager;
