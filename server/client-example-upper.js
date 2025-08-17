"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const messages_1 = require("./types/messages");
// 上位机客户端示例
// 连接到WebSocket服务器
const ws = new ws_1.default('ws://localhost:8080');
// 存储客户端ID和唯一标识ID
let clientId = null;
let uniqueId = null;
// 心跳定时器
let heartbeatInterval = null;
// 连接打开时
ws.on('open', () => {
    console.log('已连接到服务器');
    // 发送上位机注册消息
    ws.send(JSON.stringify({
        type: messages_1.MessageType.UPPER_REGISTER,
        uniqueId: uniqueId
    }));
    // 启动心跳定时器，每30秒发送一次心跳包
    heartbeatInterval = setInterval(() => {
        if (ws.readyState === ws_1.default.OPEN) {
            ws.send(JSON.stringify({
                type: messages_1.MessageType.HEARTBEAT
            }));
            console.log('已发送心跳包');
        }
    }, 30000); // 30秒发送一次心跳
});
// 接收消息
ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('收到消息:', message);
    // 处理不同类型的消息
    switch (message.type) {
        case messages_1.MessageType.CONNECTION:
            // 保存客户端ID
            clientId = message.clientId;
            console.log(`已分配客户端ID: ${clientId}`);
            break;
        case messages_1.MessageType.UPPER_REGISTER_SUCCESS:
            // 保存唯一标识ID
            uniqueId = message.uniqueId;
            console.log(`上位机注册成功，唯一标识ID: ${uniqueId}`);
            console.log(`下位机可使用此ID连接: ${uniqueId}`);
            break;
        case messages_1.MessageType.HEARTBEAT:
            // 收到服务器的心跳包，更新最后活动时间
            console.log('收到服务器心跳包');
            break;
        case messages_1.MessageType.LOWER_CONNECT_SUCCESS:
            console.log(`下位机 ${message.lowerId} 已连接`);
            // 发送测试消息给下位机
            setTimeout(() => {
                if (message.lowerId) {
                    ws.send(JSON.stringify({
                        type: messages_1.MessageType.MESSAGE,
                        targetId: message.lowerId,
                        content: '这是来自上位机的测试消息'
                    }));
                    // 发送刷新节点树请求
                    setTimeout(() => {
                        ws.send(JSON.stringify({
                            type: messages_1.MessageType.REFRESH_NODE_TREE_REQUEST,
                            targetId: message.lowerId
                        }));
                        console.log(`已发送刷新节点树请求给下位机 ${message.lowerId}`);
                    }, 2000);
                }
            }, 1000);
            break;
        case messages_1.MessageType.LOWER_REPLACED:
            console.log(`下位机 ${message.oldLowerId} 已被 ${message.newLowerId} 替换`);
            break;
        case messages_1.MessageType.MESSAGE:
            console.log(`收到来自 ${message.senderId} 的消息: ${message.content}`);
            break;
        case messages_1.MessageType.REFRESH_NODE_TREE_RESPONSE:
            console.log(`收到来自下位机 ${message.senderId} 的节点树数据:`);
            console.log(JSON.stringify(message.nodeTree, null, 2));
            // 收到节点树后，请求第一个节点的属性
            if (message.nodeTree && message.nodeTree.children && message.nodeTree.children.length > 0) {
                const firstNodeId = message.nodeTree.children[0].id;
                setTimeout(() => {
                    ws.send(JSON.stringify({
                        type: messages_1.MessageType.REQUEST_NODE_PROPERTY,
                        targetId: message.senderId,
                        nodeId: firstNodeId,
                        propertyNames: ['name', 'type', 'value'] // 可选，指定要获取的属性
                    }));
                    console.log(`已发送节点属性请求，节点ID: ${firstNodeId}`);
                }, 1000);
            }
            break;
        case messages_1.MessageType.NODE_PROPERTY_RESPONSE:
            console.log(`收到来自下位机 ${message.senderId} 的节点属性数据:`);
            console.log(`节点ID: ${message.nodeId}`);
            if (message.error) {
                console.log(`获取属性失败: ${message.error}`);
            }
            else {
                console.log('属性数据:');
                console.log(JSON.stringify(message.properties, null, 2));
            }
            break;
    }
});
// 连接关闭时
ws.on('close', () => {
    console.log('与服务器的连接已关闭');
    // 清除心跳定时器
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
});
// 连接错误时
ws.on('error', (error) => {
    console.error('连接错误:', error);
});
// 处理程序退出
process.on('SIGINT', () => {
    console.log('关闭连接并退出...');
    // 清除心跳定时器
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    ws.close();
    process.exit(0);
});
