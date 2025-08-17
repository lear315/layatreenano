"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const http_1 = require("http");
const client_manager_1 = require("./managers/client-manager");
const messages_1 = require("./types/messages");
const config_1 = require("./config");
const os_1 = require("os");
// 服务器启动时间
const serverStartTime = new Date();
// 创建HTTP服务器
const server = (0, http_1.createServer)((req, res) => {
    // 处理HTTP请求
    const url = req.url || '/';
    // 解析URL路径
    const parsedUrl = new URL(url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    // 服务器信息API
    if (pathname === '/api/server-info') {
        // 返回服务器信息
        const serverInfo = {
            startTime: serverStartTime,
            uptime: (new Date().getTime() - serverStartTime.getTime()) / 1000,
            clientCount: clientManager.getClientCount(),
            version: '1.0.0'
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(serverInfo));
        return;
    }
    // 客户端信息API
    if (pathname === '/api/clients') {
        // 返回客户端信息和服务器信息
        const responseData = {
            clients: clientManager.getAllClientsInfo(),
            serverInfo: {
                startTime: serverStartTime,
                uptime: (new Date().getTime() - serverStartTime.getTime()) / 1000,
                clientCount: clientManager.getClientCount(),
                version: '1.0.0'
            }
        };
        res.writeHead(200, {
            'Content-Type': 'application/json',
        });
        res.end(JSON.stringify(responseData));
        return;
    }
    // 404 - 页面不存在
    res.writeHead(404);
    res.end('Not Found');
});
// 创建WebSocket服务器
const wss = new ws_1.WebSocketServer({ server });
// 初始化客户端管理器
const clientManager = new client_manager_1.ClientManager();
// WebSocket连接处理
wss.on('connection', (ws, req) => {
    console.log(`新客户端连接: ${req.socket.remoteAddress}`);
    // 客户端类型和ID将在收到第一条消息后确定
    let clientId = '';
    // 处理客户端消息
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            // 第一条消息必须指定客户端类型
            if (!clientId) {
                // 根据消息类型确定客户端类型
                if (data.type === messages_1.MessageType.UPPER_REGISTER) {
                    // 上位机注册
                    clientId = clientManager.addClient(ws, messages_1.ClientType.UPPER);
                    console.log(`新上位机连接: ${clientId}`);
                    // 发送欢迎消息和客户端ID
                    ws.send(JSON.stringify({
                        type: messages_1.MessageType.CONNECTION,
                        clientId,
                        clientType: messages_1.ClientType.UPPER,
                        message: '已连接到服务器，请等待注册'
                    }));
                    // 立即注册上位机并生成唯一标识ID
                    const uniqueId = clientManager.registerUpper(clientId);
                    if (!uniqueId) {
                        console.error(`上位机 ${clientId} 注册失败`);
                    }
                }
                else if (data.type === messages_1.MessageType.LOWER_CONNECT && data.uniqueId) {
                    // 下位机连接，需要提供上位机唯一标识ID
                    clientId = clientManager.addClient(ws, messages_1.ClientType.LOWER);
                    console.log(`新下位机连接: ${clientId}，尝试连接到上位机 ID: ${data.uniqueId}`);
                    // 发送欢迎消息和客户端ID
                    ws.send(JSON.stringify({
                        type: messages_1.MessageType.CONNECTION,
                        clientId,
                        clientType: messages_1.ClientType.LOWER,
                        uniqueId: data.uniqueId,
                        message: '已连接到服务器，正在尝试连接上位机'
                    }));
                    // 尝试连接到上位机
                    const success = clientManager.connectLowerToUpper(clientId, data.uniqueId);
                    if (!success) {
                        console.error(`下位机 ${clientId} 连接上位机失败，唯一标识ID: ${data.uniqueId}`);
                    }
                }
                else {
                    // 未指定有效的客户端类型
                    console.error('客户端未指定有效的类型，断开连接');
                    ws.close(1002, '未指定有效的客户端类型');
                    return;
                }
            }
            else {
                // 已经建立连接的客户端消息处理
                console.log(`收到来自客户端 ${clientId} 的消息:`, data);
                // 根据消息类型处理
                switch (data.type) {
                    case messages_1.MessageType.MESSAGE:
                        // 处理客户端之间的消息
                        const client = clientManager.getClient(clientId);
                        if (client && client.matchedWith) {
                            // 如果已匹配，直接发送给匹配的客户端
                            clientManager.sendMessageToClient(client.matchedWith, {
                                type: messages_1.MessageType.MESSAGE,
                                senderId: clientId,
                                content: data.content
                            });
                        }
                        else if (data.targetId) {
                            // 如果指定了目标ID，发送给指定客户端
                            clientManager.sendMessageToClient(data.targetId, {
                                type: messages_1.MessageType.MESSAGE,
                                senderId: clientId,
                                content: data.content
                            });
                        }
                        break;
                    case messages_1.MessageType.REFRESH_NODE_TREE_REQUEST:
                        // 处理上位机请求刷新节点树的消息
                        console.log(`上位机 ${clientId} 请求刷新节点树，目标下位机: ${data.targetId}`);
                        // 转发请求给目标下位机
                        clientManager.sendMessageToClient(data.targetId, {
                            type: messages_1.MessageType.REFRESH_NODE_TREE_REQUEST,
                            senderId: clientId
                        });
                        break;
                    case messages_1.MessageType.REFRESH_NODE_TREE_RESPONSE:
                        // 处理下位机响应刷新节点树的消息
                        console.log(`下位机 ${clientId} 响应刷新节点树请求，目标上位机: ${data.targetId}`);
                        // 转发响应给目标上位机
                        clientManager.sendMessageToClient(data.targetId, {
                            type: messages_1.MessageType.REFRESH_NODE_TREE_RESPONSE,
                            senderId: clientId,
                            success: true,
                            nodeTree: data.data
                        });
                        break;
                    case messages_1.MessageType.REQUEST_NODE_PROPERTY:
                        // 处理上位机请求节点属性的消息
                        console.log(`上位机 ${clientId} 请求节点属性，目标下位机: ${data.targetId}，节点ID: ${data.exId}`);
                        // 转发请求给目标下位机
                        clientManager.sendMessageToClient(data.targetId, {
                            type: messages_1.MessageType.REQUEST_NODE_PROPERTY,
                            senderId: clientId,
                            exId: data.exId,
                        });
                        break;
                    case messages_1.MessageType.NODE_PROPERTY_RESPONSE:
                        // 处理下位机响应节点属性的消息
                        console.log(`下位机 ${clientId} 响应节点属性请求，目标上位机: ${data.targetId}，节点ID: ${data.exId}`);
                        // 转发响应给目标上位机
                        clientManager.sendMessageToClient(data.targetId, {
                            type: messages_1.MessageType.NODE_PROPERTY_RESPONSE,
                            senderId: clientId,
                            exId: data.exId,
                            property: data.property,
                            success: data.success,
                        });
                        break;
                    case messages_1.MessageType.SET_NODE_PROPERTY_REQUEST:
                        // 处理上位机设置节点属性的消息
                        console.log(`上位机 ${clientId} 请求设置节点属性，目标下位机: ${data.targetId}，节点ID: ${data.nodeId}`);
                        // 转发请求给目标下位机
                        clientManager.sendMessageToClient(data.targetId, {
                            type: messages_1.MessageType.SET_NODE_PROPERTY_REQUEST,
                            senderId: clientId,
                            exId: data.exId,
                            componentType: data.componentType,
                            propertyName: data.propertyName,
                            value: data.value,
                        });
                        break;
                    case messages_1.MessageType.SET_NODE_PROPERTY_RESPONSE:
                        // 处理下位机响应设置节点属性的消息
                        console.log(`下位机 ${clientId} 响应设置节点属性，目标上位机: ${data.targetId}`);
                        // 转发响应给目标上位机
                        clientManager.sendMessageToClient(data.targetId, {
                            type: messages_1.MessageType.SET_NODE_PROPERTY_RESPONSE,
                            senderId: clientId,
                            success: data.success,
                            exId: data.exId,
                            componentType: data.componentType,
                            propertyName: data.propertyName,
                            value: data.value,
                            timestamp: data.timestamp
                        });
                        break;
                    case messages_1.MessageType.GET_AUTO_UPDATE_FLAG:
                        // 处理下位机请求获取自动更新标志的消息
                        console.log(`下位机 ${clientId} 请求获取自动更新标志，目标上位机: ${data.targetId}`);
                        // 转发请求给目标上位机
                        clientManager.sendMessageToClient(data.targetId, {
                            type: messages_1.MessageType.GET_AUTO_UPDATE_FLAG,
                            senderId: clientId
                        });
                        break;
                    case messages_1.MessageType.SET_AUTO_UPDATE_FLAG:
                        // 处理上位机返回自动更新标志的消息
                        console.log(`上位机 ${clientId} 返回自动更新标志，目标下位机: ${data.targetId}`);
                        // 转发响应给目标下位机
                        clientManager.sendMessageToClient(data.targetId, {
                            type: messages_1.MessageType.SET_AUTO_UPDATE_FLAG,
                            senderId: clientId,
                            autoUpdateFlag: data.autoUpdateFlag
                        });
                        break;
                    case messages_1.MessageType.SET_TIMESCALE_REQUEST:
                        // 处理上位机请求获取时间刻度的消息
                        console.log(`上位机 ${clientId} 请求获取时间刻度，目标下位机: ${data.targetId}`);
                        // 转发请求给目标下位机
                        clientManager.sendMessageToClient(data.targetId, {
                            type: messages_1.MessageType.SET_TIMESCALE_REQUEST,
                            senderId: clientId,
                            timeScale: data.timeScale
                        });
                        break;
                    case messages_1.MessageType.SET_TIMESCALE_RESPONSE:
                        // 处理下位机返回时间刻度的消息
                        console.log(`下位机 ${clientId} 返回时间刻度，目标上位机: ${data.targetId}`);
                        // 转发响应给目标上位机
                        clientManager.sendMessageToClient(data.targetId, {
                            type: messages_1.MessageType.SET_TIMESCALE_RESPONSE,
                            senderId: clientId,
                            timescale: data.timescale,
                            success: data.success,
                            error: data.error
                        });
                        break;
                    case messages_1.MessageType.NEXT_FRAME_REQUEST:
                        // 处理上位机请求下一帧的消息
                        console.log(`上位机 ${clientId} 请求下一帧，目标下位机: ${data.targetId}`);
                        // 转发请求给目标下位机
                        clientManager.sendMessageToClient(data.targetId, {
                            type: messages_1.MessageType.NEXT_FRAME_REQUEST,
                            senderId: clientId
                        });
                        break;
                    case messages_1.MessageType.STAT_REQUEST:
                        // 处理上位机请求状态的消息
                        console.log(`上位机 ${clientId} 请求状态，目标下位机: ${data.targetId}`);
                        // 转发请求给目标下位机
                        clientManager.sendMessageToClient(data.targetId, {
                            type: messages_1.MessageType.STAT_REQUEST,
                            isShow: data.isShow,
                            senderId: clientId
                        });
                        break;
                    case messages_1.MessageType.STAT_RESPONSE:
                        // 处理下位机返回状态的消息
                        console.log(`下位机 ${clientId} 返回状态，目标上位机: ${data.targetId}，显示状态: ${data.isShow}`);
                        // 转发响应给目标上位机
                        clientManager.sendMessageToClient(data.targetId, {
                            type: messages_1.MessageType.STAT_RESPONSE,
                            senderId: clientId,
                            isShow: data.isShow,
                            success: data.success,
                            error: data.error
                        });
                        break;
                    case messages_1.MessageType.HEARTBEAT:
                        // 处理客户端发送的心跳包
                        // 更新客户端的最后活动时间
                        const clientInfo = clientManager.getClient(clientId);
                        if (clientInfo) {
                            clientInfo.lastActivity = new Date();
                        }
                        break;
                    default:
                        console.log(`未知消息类型: ${data.type}`);
                }
            }
        }
        catch (error) {
            console.error('处理消息时出错:', error);
        }
    });
    // 处理连接关闭
    ws.on('close', () => {
        console.log(`客户端 ${clientId} 断开连接`);
        clientManager.removeClient(clientId);
    });
    // 处理错误
    ws.on('error', (error) => {
        console.error(`客户端 ${clientId} 连接错误:`, error);
        clientManager.removeClient(clientId);
    });
});
/**
 * 获取本机IP地址
 * @returns 本机IP地址数组
 */
function getLocalIPs() {
    const nets = (0, os_1.networkInterfaces)();
    const results = [];
    for (const name of Object.keys(nets)) {
        const interfaces = nets[name];
        if (!interfaces)
            continue;
        for (const net of interfaces) {
            // 跳过内部IP和非IPv4地址
            if (net.family === 'IPv4' && !net.internal) {
                results.push(net.address);
            }
        }
    }
    return results;
}
// 启动服务器
server.listen(config_1.config.port, () => {
    console.log(`WebSocket服务器已启动，监听端口: ${config_1.config.port}`);
    // 获取并打印本机IP地址
    const ips = getLocalIPs();
    if (ips.length > 0) {
        console.log('可用的WebSocket连接地址:');
        ips.forEach(ip => {
            console.log(`ws://${ip}:${config_1.config.port}`);
        });
    }
    else {
        console.log('无法获取本机IP地址');
    }
});
