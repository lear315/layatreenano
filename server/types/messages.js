"use strict";
/**
 * WebSocket消息类型定义
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = exports.ClientType = void 0;
// 客户端类型枚举
var ClientType;
(function (ClientType) {
    ClientType["UPPER"] = "upper";
    ClientType["LOWER"] = "lower"; // 下位机
})(ClientType || (exports.ClientType = ClientType = {}));
// 消息类型枚举
var MessageType;
(function (MessageType) {
    MessageType["CONNECTION"] = "CONNECTION";
    MessageType["UPPER_REGISTER"] = "UPPER_REGISTER";
    MessageType["LOWER_CONNECT"] = "LOWER_CONNECT";
    MessageType["MESSAGE"] = "MESSAGE";
    MessageType["HEARTBEAT"] = "HEARTBEAT";
    MessageType["DISCONNECT"] = "DISCONNECT";
    MessageType["UPPER_REGISTER_SUCCESS"] = "UPPER_REGISTER_SUCCESS";
    MessageType["LOWER_CONNECT_SUCCESS"] = "LOWER_CONNECT_SUCCESS";
    MessageType["LOWER_CONNECT_FAIL"] = "LOWER_CONNECT_FAIL";
    MessageType["LOWER_REPLACED"] = "LOWER_REPLACED";
    MessageType["REFRESH_NODE_TREE_REQUEST"] = "REFRESH_NODE_TREE_REQUEST";
    MessageType["REFRESH_NODE_TREE_RESPONSE"] = "REFRESH_NODE_TREE_RESPONSE";
    MessageType["REQUEST_NODE_PROPERTY"] = "REQUEST_NODE_PROPERTY";
    MessageType["NODE_PROPERTY_RESPONSE"] = "NODE_PROPERTY_RESPONSE";
    MessageType["SET_NODE_PROPERTY_REQUEST"] = "SET_NODE_PROPERTY_REQUEST";
    MessageType["SET_NODE_PROPERTY_RESPONSE"] = "SET_NODE_PROPERTY_RESPONSE";
    MessageType["GET_AUTO_UPDATE_FLAG"] = "GET_AUTO_UPDATE_FLAG";
    MessageType["SET_AUTO_UPDATE_FLAG"] = "SET_AUTO_UPDATE_FLAG";
    MessageType["SET_TIMESCALE_REQUEST"] = "SET_TIMESCALE_REQUEST";
    MessageType["SET_TIMESCALE_RESPONSE"] = "SET_TIMESCALE_RESPONSE";
    MessageType["NEXT_FRAME_REQUEST"] = "NEXT_FRAME_REQUEST";
    MessageType["STAT_REQUEST"] = "STAT_REQUEST";
    MessageType["STAT_RESPONSE"] = "STAT_RESPONSE";
})(MessageType || (exports.MessageType = MessageType = {}));
