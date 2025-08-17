"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const messages_1 = require("./types/messages");
const readline_1 = __importDefault(require("readline"));
// 下位机客户端示例
// 创建命令行接口
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
// 请求输入上位机的唯一标识ID
rl.question('请输入上位机的唯一标识ID: ', (uniqueId) => {
    // 连接到WebSocket服务器
    const ws = new ws_1.default('ws://localhost:8080');
    // 存储客户端ID
    let clientId = null;
    // 心跳定时器
    let heartbeatInterval = null;
    // 连接打开时
    ws.on('open', () => {
        console.log('已连接到服务器');
        // 发送下位机连接消息，包含上位机的唯一标识ID
        ws.send(JSON.stringify({
            type: messages_1.MessageType.LOWER_CONNECT,
            uniqueId: uniqueId
        }));
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
            case messages_1.MessageType.LOWER_CONNECT_SUCCESS:
                console.log(`成功连接到上位机 ${message.upperId}`);
                // 发送测试消息给上位机
                setTimeout(() => {
                    ws.send(JSON.stringify({
                        type: messages_1.MessageType.MESSAGE,
                        content: '这是来自下位机的测试消息',
                        targetId: message.upperId
                    }));
                }, 1000);
                // 启动心跳定时器，每30秒发送一次心跳包
                heartbeatInterval = setInterval(() => {
                    if (ws.readyState === ws_1.default.OPEN) {
                        ws.send(JSON.stringify({
                            type: messages_1.MessageType.HEARTBEAT
                        }));
                        console.log('已发送心跳包');
                    }
                }, 30000); // 30秒发送一次心跳
                break;
            case messages_1.MessageType.LOWER_CONNECT_FAIL:
                console.log(`连接上位机失败: ${message.message}`);
                ws.close();
                process.exit(1);
                break;
            case messages_1.MessageType.LOWER_REPLACED:
                console.log(`您已被新的下位机替换，连接将关闭`);
                ws.close();
                process.exit(1);
                break;
            case messages_1.MessageType.MESSAGE:
                console.log(`收到来自 ${message.senderId} 的消息: ${message.content}`);
                break;
            case messages_1.MessageType.REFRESH_NODE_TREE_REQUEST:
                console.log(`收到来自上位机 ${message.senderId} 的刷新节点树请求`);
                // 模拟节点树数据
                const mockNodeTree = {
                    id: 'root',
                    name: '根节点',
                    children: [
                        {
                            id: 'node1',
                            name: '节点1',
                            children: [
                                { id: 'node1-1', name: '节点1-1', children: [] },
                                { id: 'node1-2', name: '节点1-2', children: [] }
                            ]
                        },
                        {
                            id: 'node2',
                            name: '节点2',
                            children: [
                                { id: 'node2-1', name: '节点2-1', children: [] }
                            ]
                        }
                    ]
                };
                // 发送节点树数据响应
                ws.send(JSON.stringify({
                    type: messages_1.MessageType.REFRESH_NODE_TREE_RESPONSE,
                    targetId: message.senderId,
                    nodeTree: mockNodeTree
                }));
                console.log('已发送节点树数据响应');
                break;
            case messages_1.MessageType.HEARTBEAT:
                // 收到服务器的心跳包，更新最后活动时间
                console.log('收到服务器心跳包');
                break;
            case messages_1.MessageType.REQUEST_NODE_PROPERTY:
                console.log(`收到来自上位机 ${message.senderId} 的节点属性请求，节点ID: ${message.nodeId}`);
                // 模拟节点属性数据
                let nodeProperties;
                let errorMessage;
                // 根据节点ID返回不同的属性数据
                switch (message.nodeId) {
                    case 'node1':
                        nodeProperties = {
                            name: '节点1',
                            type: 'container',
                            value: null,
                            createdAt: new Date().toISOString(),
                            status: 'active',
                            permissions: ['read', 'write']
                        };
                        break;
                    case 'node2':
                        nodeProperties = {
                            name: '节点2',
                            type: 'container',
                            value: null,
                            createdAt: new Date().toISOString(),
                            status: 'inactive',
                            permissions: ['read']
                        };
                        break;
                    case 'node1-1':
                        nodeProperties = {
                            name: '节点1-1',
                            type: 'leaf',
                            value: 'Hello World',
                            createdAt: new Date().toISOString(),
                            status: 'active',
                            permissions: ['read', 'write', 'delete']
                        };
                        break;
                    case 'node1-2':
                        nodeProperties = {
                            name: '节点1-2',
                            type: 'leaf',
                            value: 42,
                            createdAt: new Date().toISOString(),
                            status: 'active',
                            permissions: ['read']
                        };
                        break;
                    case 'node2-1':
                        nodeProperties = {
                            name: '节点2-1',
                            type: 'leaf',
                            value: true,
                            createdAt: new Date().toISOString(),
                            status: 'active',
                            permissions: ['read', 'write']
                        };
                        break;
                    default:
                        errorMessage = `找不到节点: ${message.nodeId}`;
                        break;
                }
                // 如果指定了属性名列表，只返回指定的属性
                if (message.propertyNames && nodeProperties) {
                    const filteredProperties = {};
                    message.propertyNames.forEach((propName) => {
                        if (nodeProperties.hasOwnProperty(propName)) {
                            filteredProperties[propName] = nodeProperties[propName];
                        }
                    });
                    nodeProperties = filteredProperties;
                }
                // 发送节点属性响应
                ws.send(JSON.stringify({
                    type: messages_1.MessageType.NODE_PROPERTY_RESPONSE,
                    targetId: message.senderId,
                    nodeId: message.nodeId,
                    properties: nodeProperties,
                    error: errorMessage
                }));
                console.log('已发送节点属性响应');
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
        rl.close();
    });
    // 连接错误时
    ws.on('error', (error) => {
        console.error('连接错误:', error);
        rl.close();
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
        rl.close();
        process.exit(0);
    });
});
