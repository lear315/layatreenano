/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/ConnectionHelper.ts":
/*!*********************************!*\
  !*** ./src/ConnectionHelper.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConnectionHelper = void 0;
var WechatHelper_1 = __webpack_require__(/*! ./WechatHelper */ "./src/WechatHelper.ts");
var Utils_1 = __webpack_require__(/*! ./Utils */ "./src/Utils.ts");
// 环境检测结果缓存
var isWechatEnv = null;
var ConnectionHelper = /** @class */ (function () {
    function ConnectionHelper() {
    }
    /**
     * 检测当前环境
     * @returns 环境类型：'wechat'表示微信小游戏环境，'unknown'表示未知环境
     */
    ConnectionHelper.detectEnvironment = function () {
        // 使用缓存的检测结果
        if (isWechatEnv === true)
            return 'wechat';
        // 重新检测环境
        if (WechatHelper_1.WechatHelper.isSupported()) {
            isWechatEnv = true;
            return 'wechat';
        }
        else {
            isWechatEnv = false;
            return 'unknown';
        }
    };
    /**
     * 显示连接选项对话框（根据环境选择合适的实现方式）
     * @param callback 连接成功后的回调函数
     */
    ConnectionHelper.showIpInputDialog = function (callback) {
        // 根据环境选择合适的实现方式
        var env = ConnectionHelper.detectEnvironment();
        switch (env) {
            case 'wechat':
                Utils_1.Logger.log('检测到微信小游戏环境，使用WechatHelper');
                WechatHelper_1.WechatHelper.scanQRCodeForConnection(callback);
                break;
            default:
                Utils_1.Logger.log('未检测到支持的环境，无法显示IP输入对话框');
                break;
        }
    };
    return ConnectionHelper;
}());
exports.ConnectionHelper = ConnectionHelper;


/***/ }),

/***/ "./src/LayaEngineHolder.ts":
/*!*********************************!*\
  !*** ./src/LayaEngineHolder.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LayaEngineHolder = void 0;
var LayaPropParse_1 = __webpack_require__(/*! ./LayaPropParse */ "./src/LayaPropParse.ts");
var Utils_1 = __webpack_require__(/*! ./Utils */ "./src/Utils.ts");
var LayaEngineHolder = /** @class */ (function () {
    function LayaEngineHolder() {
        this.name = 'Laya';
        this.childrenName = 'children';
        this.DebugLayerName = "LayaTreeDebugLayer";
        // 缓存获取过的节点链索引
        this.nodeChainCache = {};
        this.uuid = 0;
        this.isTreeDirty = true;
        LayaPropParse_1.LayaPropParse.initObfuscationName();
    }
    /**
     * 获取Laya实例，支持从iframe中查找
     */
    LayaEngineHolder.prototype.getLayaInstance = function () {
        // 如果已经缓存了有效的Laya实例，直接返回
        // 1. 首先检查主窗口
        if (typeof window.Laya !== 'undefined') {
            return window.Laya;
        }
        return null;
    };
    /**
     * 检测当前环境是否存在Laya引擎
     */
    LayaEngineHolder.prototype.isCurrentEngine = function () {
        var layaInstance = this.getLayaInstance();
        return layaInstance !== null;
    };
    /**
     * 获取Laya引擎版本
     */
    LayaEngineHolder.prototype.getEngineVersion = function () {
        var _a;
        var layaInstance = this.getLayaInstance();
        if (!layaInstance)
            return undefined;
        var stage = layaInstance.stage;
        if (!stage)
            return undefined;
        return layaInstance.version || ((_a = layaInstance.LayaEnv) === null || _a === void 0 ? void 0 : _a.version) || undefined;
    };
    LayaEngineHolder.prototype.getStage = function () {
        var Laya = this.getLayaInstance();
        if (Laya) {
            return Laya.stage;
        }
        else {
            var layaInstance = this.getLayaInstance();
            if (!layaInstance)
                return undefined;
            return layaInstance.stage;
        }
    };
    LayaEngineHolder.prototype.refreshTree = function () {
        var stage = this.getStage();
        if (!stage)
            return;
        var stageName = stage.constructor.name;
        stageName = LayaPropParse_1.LayaPropParse.getObfuscatedName(stageName);
        stage.exId = 0;
        var stageTreeCache = {
            exId: 0,
            is3D: false,
            name: stageName,
            children: [],
            type: stageName,
        };
        // 兼容Laya1.x
        if (stage._children) {
            this.childrenName = "_children";
        }
        else if (stage._childs) {
            this.childrenName = "_childs";
        }
        var len = stage[this.childrenName] ? stage[this.childrenName].length : 0;
        for (var i = 0; i < len; i++) {
            var child = stage[this.childrenName][i];
            if (child.name === this.DebugLayerName) {
                continue;
            }
            this.buildNodeTree(child, stageTreeCache.children);
        }
        // 清空缓存（TODO 可以使用树摇对比，只对比新增和删除的节点）
        this.nodeChainCache = {};
        // 刷新完成后，重置脏标记
        this.isTreeDirty = false;
        return stageTreeCache;
    };
    /**
     * 递归获取节点树
     */
    LayaEngineHolder.prototype.buildNodeTree = function (node, cache) {
        var exId = node.exId;
        if (exId == null || exId == undefined) {
            this.uuid += 1;
            exId = this.uuid;
            node.exId = exId;
        }
        var name = this.getNodeName(node);
        var type = node.constructor.name;
        type = LayaPropParse_1.LayaPropParse.getObfuscatedName(type);
        var is3D = LayaPropParse_1.LayaPropParse.is3dObject(node, type);
        if (type == 'Scene3D') {
            is3D = true;
        }
        var nodeData = {
            exId: exId,
            name: name,
            is3D: is3D,
            children: [],
            type: type,
        };
        var len = node[this.childrenName] ? node[this.childrenName].length : 0;
        for (var i = 0; i < len; i++) {
            var childItem = node[this.childrenName][i];
            this.buildNodeTree(childItem, nodeData.children);
        }
        cache.push(nodeData);
    };
    LayaEngineHolder.prototype.getNodeName = function (node) {
        var nodeName = node.constructor.name;
        nodeName = LayaPropParse_1.LayaPropParse.getObfuscatedName(nodeName);
        if (node.$owner) {
            nodeName = node.$owner._name + "    " + node.$owner.constructor.name + "    " + nodeName;
        }
        if (node.name) {
            nodeName = nodeName + "   " + node.name;
        }
        return nodeName;
    };
    LayaEngineHolder.prototype.getNodeProperty = function (exId) {
        var node = this.getNodeMemoryStroge(exId);
        if (node) {
            var type = node.constructor.name;
            type = LayaPropParse_1.LayaPropParse.getObfuscatedName(type);
            return LayaPropParse_1.LayaPropParse.parse(node, type);
        }
        return undefined;
    };
    LayaEngineHolder.prototype.setNodeProperty = function (exId, componentType, propertyName, value) {
        try {
            var node = this.getNodeMemoryStroge(exId);
            if (!node) {
                Utils_1.Logger.warn("\u672A\u627E\u5230\u8282\u70B9 exId: ".concat(exId));
                return false;
            }
            Utils_1.Logger.log("\u8BBE\u7F6E\u8282\u70B9\u5C5E\u6027: ".concat(componentType, ".").concat(propertyName, " = ").concat(JSON.stringify(value)));
            if (componentType === 'Transform3D' || componentType === 'Node2D') {
                return this.setTransformProperty(node, propertyName, value, componentType === 'Transform3D');
            }
            else if (componentType === 'NodeInfo') {
                return this.setNodeInfoProperty(node, propertyName, value);
            }
            else {
                return this.setNodeInfoProperty(node, propertyName, value);
            }
        }
        catch (error) {
            Utils_1.Logger.error('设置节点属性失败:', error);
            return false;
        }
    };
    LayaEngineHolder.prototype.setTransformProperty = function (node, propertyName, value, is3D) {
        if (is3D && node.transform) {
            // 3D Transform
            var transform = node.transform;
            switch (propertyName) {
                case 'Position':
                    if (value.x !== undefined)
                        transform.localPositionX = value.x;
                    if (value.y !== undefined)
                        transform.localPositionY = value.y;
                    if (value.z !== undefined)
                        transform.localPositionZ = value.z;
                    return true;
                case 'Rotation':
                    if (value.x !== undefined)
                        transform.localRotationEulerX = value.x;
                    if (value.y !== undefined)
                        transform.localRotationEulerY = value.y;
                    if (value.z !== undefined)
                        transform.localRotationEulerZ = value.z;
                    return true;
                case 'Scale':
                    if (value.x !== undefined)
                        transform.localScaleX = value.x;
                    if (value.y !== undefined)
                        transform.localScaleY = value.y;
                    if (value.z !== undefined)
                        transform.localScaleZ = value.z;
                    return true;
            }
        }
        else {
            // 2D Transform
            switch (propertyName) {
                case 'Position':
                    if (value.x !== undefined)
                        node.x = value.x;
                    if (value.y !== undefined)
                        node.y = value.y;
                    return true;
                case 'Size':
                    if (value.x !== undefined)
                        node.width = value.x;
                    if (value.y !== undefined)
                        node.height = value.y;
                    return true;
                case 'Anchor':
                    if (value.x !== undefined)
                        node.anchorX = value.x;
                    if (value.y !== undefined)
                        node.anchorY = value.y;
                    return true;
                case 'Scale':
                    if (value.x !== undefined)
                        node.scaleX = value.x;
                    if (value.y !== undefined)
                        node.scaleY = value.y;
                    return true;
                case 'Skew':
                    if (value.x !== undefined)
                        node.skewX = value.x;
                    if (value.y !== undefined)
                        node.skewY = value.y;
                    return true;
                case 'Rotation':
                    if (typeof value === 'number')
                        node.rotation = value;
                    return true;
                case 'alpha':
                    if (typeof value === 'number')
                        node.alpha = value;
                    return true;
                case 'visible':
                    if (typeof value === 'boolean') {
                        node.visible = value;
                        Utils_1.Logger.log("\u2705 \u6210\u529F\u8BBE\u7F6E2D\u8282\u70B9visible\u5C5E\u6027: ".concat(value));
                        return true;
                    }
                    else {
                        Utils_1.Logger.warn("visible\u5C5E\u6027\u503C\u7C7B\u578B\u9519\u8BEF: ".concat(typeof value, ", \u671F\u671Bboolean"));
                        return false;
                    }
                case 'mouseEnabled':
                    if (typeof value === 'boolean') {
                        node.mouseEnabled = value;
                        Utils_1.Logger.log("\u2705 \u6210\u529F\u8BBE\u7F6E2D\u8282\u70B9mouseEnabled\u5C5E\u6027: ".concat(value));
                        return true;
                    }
                    else {
                        Utils_1.Logger.warn("mouseEnabled\u5C5E\u6027\u503C\u7C7B\u578B\u9519\u8BEF: ".concat(typeof value, ", \u671F\u671Bboolean"));
                        return false;
                    }
                case 'mouseThrough':
                    if (typeof value === 'boolean') {
                        node.mouseThrough = value;
                        Utils_1.Logger.log("\u2705 \u6210\u529F\u8BBE\u7F6E2D\u8282\u70B9mouseThrough\u5C5E\u6027: ".concat(value));
                        return true;
                    }
                    else {
                        Utils_1.Logger.warn("mouseThrough\u5C5E\u6027\u503C\u7C7B\u578B\u9519\u8BEF: ".concat(typeof value, ", \u671F\u671Bboolean"));
                        return false;
                    }
                case 'zOrder':
                    if (typeof value === 'number') {
                        node.zOrder = value;
                        Utils_1.Logger.log("\u2705 \u6210\u529F\u8BBE\u7F6E2D\u8282\u70B9zOrder\u5C5E\u6027: ".concat(value));
                        return true;
                    }
                    else {
                        Utils_1.Logger.warn("zOrder\u5C5E\u6027\u503C\u7C7B\u578B\u9519\u8BEF: ".concat(typeof value, ", \u671F\u671Bnumber"));
                    }
            }
            return false;
        }
        return false;
    };
    LayaEngineHolder.prototype.setNodeInfoProperty = function (node, propertyName, value) {
        if (node && node[propertyName] != undefined) {
            var propertyNameType = node[propertyName].constructor.name;
            propertyNameType = LayaPropParse_1.LayaPropParse.getObfuscatedName(propertyNameType);
            switch (propertyNameType) {
                case 'Color':
                    // 特殊处理clearColor：先设置RGBA分量，再触发自赋值
                    if (Array.isArray(value) && value.length >= 4) {
                        // 设置各个分量
                        node[propertyName].r = value[0];
                        node[propertyName].g = value[1];
                        node[propertyName].b = value[2];
                        node[propertyName].a = value[3];
                        // 关键：触发clearColor的自赋值来更新引擎
                        node[propertyName] = node[propertyName];
                        return true;
                    }
                    else {
                        Utils_1.Logger.warn('Color值格式错误，期望[r,g,b,a]数组');
                        return false;
                    }
                default:
                    node[propertyName] = value;
                    break;
            }
            return true;
        }
        else {
            Utils_1.Logger.warn("\u672A\u627E\u5230\u8282\u70B9\u5C5E\u6027: ".concat(propertyName));
            return false;
        }
    };
    LayaEngineHolder.prototype.deleteNode = function (exId) {
        try {
            var node = this.getNodeMemoryStroge(exId);
            if (!node) {
                Utils_1.Logger.warn("\u672A\u627E\u5230\u8981\u5220\u9664\u7684\u8282\u70B9 exId: ".concat(exId));
                return false;
            }
            Utils_1.Logger.log("\u51C6\u5907\u5220\u9664\u8282\u70B9: ".concat(node.name || node.constructor.name, " (exId: ").concat(exId, ")"));
            // 检查节点是否有destroy方法
            if (typeof node.destroy === 'function') {
                // 使用Laya的destroy方法删除节点
                node.destroy();
                Utils_1.Logger.log("\u2705 \u4F7F\u7528destroy\u65B9\u6CD5\u6210\u529F\u5220\u9664\u8282\u70B9: ".concat(node.name || node.constructor.name));
                return true;
            }
            // 检查节点是否有removeSelf方法 (Laya 2D节点)
            else if (typeof node.removeSelf === 'function') {
                // 从父节点移除
                node.removeSelf();
                Utils_1.Logger.log("\u2705 \u4F7F\u7528removeSelf\u65B9\u6CD5\u6210\u529F\u5220\u9664\u8282\u70B9: ".concat(node.name || node.constructor.name));
                return true;
            }
            // 检查是否有父节点，尝试从父节点移除
            else if (node.parent && typeof node.parent.removeChild === 'function') {
                node.parent.removeChild(node);
                Utils_1.Logger.log("\u2705 \u4ECE\u7236\u8282\u70B9\u79FB\u9664\u6210\u529F\u5220\u9664\u8282\u70B9: ".concat(node.name || node.constructor.name));
                return true;
            }
            else {
                Utils_1.Logger.warn("\u274C \u8282\u70B9\u6CA1\u6709\u53EF\u7528\u7684\u5220\u9664\u65B9\u6CD5: ".concat(node.name || node.constructor.name));
                return false;
            }
        }
        catch (error) {
            Utils_1.Logger.error('删除节点失败:', error);
            return false;
        }
    };
    LayaEngineHolder.prototype.getNodeMemoryStroge = function (exId) {
        var preNode = this.getNodeByChainCache(exId);
        if (preNode && (exId == preNode.exId)) {
            return preNode;
        }
        var stage = this.getStage();
        if (!stage)
            return null;
        var node = this.getNodeByExId(exId, stage, []);
        return node;
    };
    LayaEngineHolder.prototype.getNodeByExId = function (exId, node, chain) {
        if (node.exId == exId) {
            this.nodeChainCache[exId] = chain;
            return node;
        }
        var len = node[this.childrenName] ? node[this.childrenName].length : 0;
        for (var i = 0; i < len; i++) {
            var curchain = chain.concat([i]);
            var childItem = node[this.childrenName][i];
            if (childItem.exId == exId) {
                this.nodeChainCache[exId] = curchain;
                return childItem;
            }
            var findResult = this.getNodeByExId(exId, childItem, curchain);
            if (findResult) {
                this.nodeChainCache[exId] = curchain;
                return findResult;
            }
        }
        return undefined;
    };
    LayaEngineHolder.prototype.getNodeByChainCache = function (exId) {
        if (!this.nodeChainCache) {
            return undefined;
        }
        var curChain = this.nodeChainCache[exId];
        if (curChain == undefined) {
            return undefined;
        }
        var node = this.getStage();
        if (!node)
            return undefined;
        if (curChain.length > 0) {
            for (var i = 0; i < curChain.length; i++) {
                var chainIndex = curChain[i];
                if (node[this.childrenName][chainIndex]) {
                    node = node[this.childrenName][chainIndex];
                }
                else {
                    return undefined;
                }
            }
        }
        else {
            return undefined;
        }
        return node;
    };
    LayaEngineHolder.prototype.setTimeScale = function (timeScale) {
        // 限制在0-50之间
        var Laya = this.getLayaInstance();
        if (timeScale < 0) {
            timeScale = 0;
        }
        else if (timeScale > 50) {
            timeScale = 50;
        }
        if (Laya && Laya.timer) {
            Laya.timer.scale = timeScale;
        }
        return timeScale;
    };
    LayaEngineHolder.prototype.nextFrame = function () {
        Utils_1.Logger.log('执行下一帧');
        var Laya = this.getLayaInstance();
        if (!Laya || !Laya.timer) {
            Utils_1.Logger.warn('未找到Laya引擎实例或timer对象');
            return;
        }
        // 如果当前游戏是暂停状态（timeScale为0），执行一帧
        if (Laya.timer.scale === 0) {
            // 临时恢复时间流逝，让游戏执行一帧
            var originalScale_1 = Laya.timer.scale;
            Laya.timer.scale = 1;
            // 使用 requestAnimationFrame 来精确控制一帧的执行
            requestAnimationFrame(function () {
                // 立即暂停游戏，防止执行多帧
                Laya.timer.scale = originalScale_1;
                Utils_1.Logger.log('下一帧执行完成，恢复暂停状态');
            });
        }
        else {
            Utils_1.Logger.warn('只有在暂停状态下（timeScale=0）才能执行下一帧');
        }
    };
    LayaEngineHolder.prototype.pluginSetNodeByKey = function (exId, key, value) {
        var node = this.getNodeMemoryStroge(exId);
        if (node && node[key] !== undefined) {
            node[key] = value;
        }
    };
    ;
    LayaEngineHolder.prototype.outputToConsole = function (exId) {
        var node = this.getNodeMemoryStroge(exId);
        if (node) {
            console.log(node);
        }
    };
    LayaEngineHolder.prototype.getAllProps = function (obj, showPrivate, showFunction) {
        return LayaPropParse_1.LayaPropParse.getAllProps(obj, showPrivate, showFunction);
    };
    LayaEngineHolder.prototype.getOrCreatePropStructure = function (obj, showPrivate, showFunction) {
        return LayaPropParse_1.LayaPropParse.getOrCreatePropStructure(obj, showPrivate, showFunction);
    };
    LayaEngineHolder.prototype.walkArr = function (arr, fun, _this) {
        if (_this === void 0) { _this = null; }
        if (!arr)
            return;
        var i;
        var len;
        len = arr.length;
        for (i = 0; i < len; i++) {
            fun.apply(_this, [arr[i], i]);
        }
    };
    LayaEngineHolder.prototype.isShowStat = function () {
        var Laya = this.getLayaInstance();
        return Laya.Stat._show;
    };
    LayaEngineHolder.prototype.setShowStat = function (show) {
        var Laya = this.getLayaInstance();
        if (show) {
            Laya.Stat.show();
            return true;
        }
        else {
            Laya.Stat.hide();
            return false;
        }
    };
    LayaEngineHolder.prototype.initProxy = function () {
        var Laya = this.getLayaInstance();
        if (!Laya)
            return;
        if (Laya.initProxy)
            return;
        Laya.initProxy = true;
        // 保存当前引擎实例的引用
        var engineInstance = this;
        // 替换Node
        var rawChildChanged = Laya.Node.prototype._childChanged;
        Laya.Node.prototype._childChanged = function (child) {
            if (child === void 0) { child = null; }
            rawChildChanged.apply(this, [child]);
            // 刷新节点树的脏标记
            engineInstance.isTreeDirty = true;
        };
    };
    LayaEngineHolder.prototype.setTreeDirty = function (isDirty) {
        this.isTreeDirty = isDirty;
    };
    return LayaEngineHolder;
}());
exports.LayaEngineHolder = LayaEngineHolder;


/***/ }),

/***/ "./src/LayaPropParse.ts":
/*!******************************!*\
  !*** ./src/LayaPropParse.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LayaPropParse = void 0;
var LayaPropParse = /** @class */ (function () {
    function LayaPropParse() {
    }
    LayaPropParse.is3dObject = function (node, type) {
        // Scene3D 是特殊的3D对象，但没有Transform3D
        if (type === 'Scene3D') {
            return false; // Scene3D 不需要Transform3D处理
        }
        if (node.transform) {
            var typeName = node.transform.constructor.name;
            typeName = LayaPropParse.getObfuscatedName(typeName);
            if (typeName == 'Transform3D') {
                return true;
            }
        }
        return false;
    };
    LayaPropParse.parse = function (node, type) {
        if (node.destroyed == true) {
            return null;
        }
        var prop = [];
        // 节点信息
        var name = node.name;
        if (!name) {
            var typeName = node.constructor.name;
            typeName = LayaPropParse.getObfuscatedName(typeName);
            if (node.$owner) {
                name = node.$owner._name || node.$owner.constructor.name;
            }
            else {
                name = typeName;
            }
        }
        var nodeInfoItem = {
            t: 'NodeInfo',
            v: [name, node.active]
        };
        prop.push(nodeInfoItem);
        var nodeType = type;
        if (this.is3dObject(node, type)) {
            var pos = node.transform.localPosition;
            var rotRuler = node.transform.localRotationEuler;
            var scale = node.transform.localScale;
            var propItem = {
                t: 'Transform3D',
                v: [[pos.x, pos.y, pos.z], [rotRuler.x, rotRuler.y, rotRuler.z], [scale.x, scale.y, scale.z]]
            };
            prop.push(propItem);
        }
        else {
            if (nodeType != 'Scene3D') {
                var propItem = {
                    t: 'Node2D',
                    v: [[node.x, node.y], [node.width, node.height], [node.anchorX, node.anchorY], [node.scaleX, node.scaleY], [node.skewX, node.skewY], node.rotation, node.visible, node.alpha, node.mouseEnabled, node.mouseThrough, node.zOrder]
                };
                prop.push(propItem);
            }
        }
        // 判断节点类型
        switch (nodeType) {
            case 'Camera':
                var cameraItem = {
                    t: 'Camera',
                    v: [node.orthographic, node.orthographicVerticalSize, node.fieldOfView, node.aspectRatio, node.nearPlane, node.farPlane, node.clearFlag, [node.clearColor.r, node.clearColor.g, node.clearColor.b, node.clearColor.a], node.enableHDR, node.msaa, node.fxaa, node.cullingMask]
                };
                prop.push(cameraItem);
                break;
            case 'Scene3D':
                var scene3DItem = {
                    t: 'Scene3D',
                    v: [
                        node.ambientMode,
                        node.ambientColor ? [node.ambientColor.r, node.ambientColor.g, node.ambientColor.b, node.ambientColor.a] : [0.7, 0.7, 0.7, 1],
                        node.ambientIntensity || 1,
                        node.shadowMapFrequency || 1,
                        node._reflectionsSource || 0,
                        node._reflectionsResolution || "256",
                        node.reflectionIntensity || 1,
                        node.enableFog || false,
                        node.fogMode || 0,
                        node.fogStart || 300,
                        node.fogEnd || 1000,
                        node.fogDensity || 0.01,
                        node.fogColor ? [node.fogColor.r, node.fogColor.g, node.fogColor.b, node.fogColor.a] : [0.7, 0.7, 0.7, 1]
                    ]
                };
                prop.push(scene3DItem);
                break;
            case 'Text':
                var textItem = {
                    t: 'Text',
                    v: [
                        node.text || '',
                        node.fontSize || 12,
                        node.font || 'Arial',
                        node.color || '#000000',
                        node.align || 'left',
                        node.valign || 'top',
                        node.bold || false,
                        node.italic || false,
                        node.wordWrap || false,
                        node.leading || 0,
                        [node.padding ? node.padding.x || 0 : 0, node.padding ? node.padding.y || 0 : 0]
                    ]
                };
                prop.push(textItem);
                break;
            case 'Image':
                var imageItem = {
                    t: 'Image',
                    v: [
                        node.skin || '',
                        node.useSourceSize || false,
                        node.sizeGrid || '',
                        node.color || '#FFFFFF',
                        node.group || ''
                    ]
                };
                prop.push(imageItem);
                break;
            case 'Button':
                var buttonItem = {
                    t: 'Button',
                    v: [
                        node.skin || '',
                        node.label || '',
                        node.labelFont || '',
                        node.labelSize || 12,
                        node.labelColor || '#000000',
                        node.labelAlign || 'center',
                        node.labelVAlign || 'middle',
                        node.labelBold || false,
                        node.labelItalic || false,
                        node.labelPadding ? [node.labelPadding.left || 0, node.labelPadding.top || 0, node.labelPadding.right || 0, node.labelPadding.bottom || 0] : [0, 0, 0, 0],
                        node.stateNum || 1,
                        node.group || ''
                    ]
                };
                prop.push(buttonItem);
                break;
            default:
                break;
        }
        // 组件类型
        var components = node._components;
        if (components && components.length > 0) {
            for (var i = 0; i < components.length; i++) {
                var componentName = components[i].constructor.name;
                componentName = LayaPropParse.getObfuscatedName(componentName);
                if (componentName) {
                    var propItem = {
                        t: 'Component',
                        v: [componentName, i]
                    };
                    prop.push(propItem);
                }
            }
            ;
        }
        return {
            prop: prop,
            name: node.name,
            active: node.active,
            exId: node.exId
        };
    };
    LayaPropParse.getNodeType = function (node) {
        var typeName = LayaPropParse.getObfuscatedName(node.constructor.name);
        return typeName;
    };
    /**
     * 生成对象类型的缓存key
     * @param obj 对象实例
     * @param showPrivate 是否显示私有属性
     * @param showFunction 是否显示函数属性
     * @returns 缓存key
     */
    LayaPropParse.generateCacheKey = function (obj, showPrivate, showFunction) {
        var _a, _b;
        // 获取构造函数名作为基础key
        var className = ((_a = obj.constructor) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown';
        // 生成原型链的简单哈希
        var prototypeHash = '';
        var temp = obj;
        var depth = 0;
        var maxDepth = 10; // 限制原型链深度，避免无限循环
        while (temp && depth < maxDepth) {
            var proto = Object.getPrototypeOf(temp);
            if (!proto || proto === Object.prototype)
                break;
            prototypeHash += (((_b = proto.constructor) === null || _b === void 0 ? void 0 : _b.name) || '') + '_';
            temp = proto;
            depth++;
        }
        return "".concat(className, "_").concat(prototypeHash, "_").concat(showPrivate, "_").concat(showFunction);
    };
    /**
     * 从缓存中获取属性结构或创建新的缓存
     * @param obj 对象实例
     * @param showPrivate 是否显示私有属性
     * @param showFunction 是否显示函数属性
     * @returns 属性元数据数组
     */
    LayaPropParse.getOrCreatePropStructure = function (obj, showPrivate, showFunction) {
        var cacheKey = this.generateCacheKey(obj, showPrivate, showFunction);
        // 尝试从缓存中获取
        var cached = this.propStructureCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        // 缓存未命中，创建新的属性结构
        var propMetadata = [];
        var temp = obj;
        while (temp) {
            var keys = Reflect.ownKeys(temp);
            var length = keys.length;
            var _loop_1 = function (i) {
                var propName = keys[i];
                if (typeof propName !== "string")
                    return "continue";
                // 检查是否已经在数组中（避免重复）
                if (propMetadata.some(function (meta) { return meta.name === propName; }))
                    return "continue";
                var firstChar = propName.charAt(0);
                var isPrivate = firstChar === "_" || firstChar === "$";
                // 根据过滤条件决定是否包含
                if (!showPrivate && isPrivate)
                    return "continue";
                var propInfo = Object.getOwnPropertyDescriptor(temp, propName);
                var hasGetter = (propInfo === null || propInfo === void 0 ? void 0 : propInfo.get) !== undefined;
                var hasSetter = hasGetter && propInfo.set !== undefined;
                propMetadata.push({
                    name: propName,
                    isPrivate: isPrivate,
                    isGetter: hasGetter,
                    isSetter: hasSetter,
                });
            };
            for (var i = 0; i < length; i++) {
                _loop_1(i);
            }
            temp = Object.getPrototypeOf(temp);
        }
        // 缓存结果
        this.propStructureCache.set(cacheKey, propMetadata);
        return propMetadata;
    };
    /**
     * 清空属性结构缓存
     */
    LayaPropParse.clearCache = function () {
        this.propStructureCache.clear();
    };
    /**
     * 初始化混淆名称映射
     */
    LayaPropParse.initObfuscationName = function () {
        var layaInstance = LayaPropParse.getLayaInstance();
        if (layaInstance) {
            // 混淆检测与映射
            if (layaInstance.stage.constructor.name === 'Stage') {
                return;
            }
            Object.keys(layaInstance).forEach(function (key) {
                if (layaInstance[key] && (layaInstance[key].prototype instanceof layaInstance.Node || layaInstance[key].prototype instanceof layaInstance.EventDispatcher || layaInstance[key].prototype instanceof layaInstance.Component)) {
                    var name = layaInstance[key].name;
                    if (name) {
                        LayaPropParse.layaObfuscationMap.set(name, key);
                    }
                }
            });
        }
    };
    /**
     * 获取Laya实例，支持从iframe中查找
     */
    LayaPropParse.getLayaInstance = function () {
        // 如果已经缓存了有效的Laya实例，直接返回
        // 1. 首先检查主窗口
        if (typeof window.Laya !== 'undefined') {
            return window.Laya;
        }
        return null;
    };
    /**
     * 获取混淆映射的真实名称
     */
    LayaPropParse.getObfuscatedName = function (name) {
        return LayaPropParse.layaObfuscationMap.get(name) || name;
    };
    /**
     * 获取混淆映射Map
     */
    LayaPropParse.getObfuscationMap = function () {
        return LayaPropParse.layaObfuscationMap;
    };
    LayaPropParse.getAllProps = function (obj, showPrivate, showFunction) {
        var props = {};
        // 使用缓存获取属性结构
        var propStructure = this.getOrCreatePropStructure(obj, showPrivate, showFunction);
        // 为每个属性获取当前值
        for (var _i = 0, propStructure_1 = propStructure; _i < propStructure_1.length; _i++) {
            var metadata = propStructure_1[_i];
            var value = void 0;
            try {
                value = obj[metadata.name];
            }
            catch (_a) {
                value = null;
            }
            var type = typeof value;
            // 应用showFunction过滤
            if (!showFunction && type === "function") {
                continue;
            }
            var expandable = type === "object" && value !== null;
            props[metadata.name] = {
                name: metadata.name,
                isPrivate: metadata.isPrivate,
                isGetter: metadata.isGetter,
                isSetter: metadata.isSetter,
                type: type,
                expandable: expandable,
                value: this.stringifyValue(value, type)
            };
        }
        return props;
    };
    LayaPropParse.stringifyValue = function (value, preComputedType) {
        if (value === null)
            return "null";
        if (value === undefined)
            return "undefined";
        var type = preComputedType || typeof value;
        switch (type) {
            case "string":
                return value;
            case "number":
                return Number.isNaN(value) ? "NaN" : String(value);
            case "bigint":
                return String(value);
            case "object":
                return Array.isArray(value) ? "array" : this.getClassName(value);
            case "function":
                return String(value);
            default:
                return String(value);
        }
    };
    LayaPropParse.getClassName = function (obj) {
        var objType = typeof obj;
        if (objType === "number" || objType === "string")
            return String(obj);
        // 优化FGUI对象检测
        var owner = obj.$owner || obj.$gobj;
        if (owner) {
            var constructor_1 = owner.constructor;
            if ((constructor_1 === null || constructor_1 === void 0 ? void 0 : constructor_1.name) && constructor_1.name.length > 2) {
                return constructor_1.name;
            }
            return typeof owner;
        }
        // 优化__className检测
        var className = obj.__className;
        if (className && !className.toLowerCase().startsWith("laya")) {
            return className;
        }
        // 通用构造函数名检测
        var constructor = obj.constructor;
        if ((constructor === null || constructor === void 0 ? void 0 : constructor.name) && constructor.name.length > 2) {
            return constructor.name;
        }
        return typeof obj;
    };
    // 属性结构缓存 - 根据对象类型缓存属性元数据
    LayaPropParse.propStructureCache = new Map();
    // Laya混淆映射map
    LayaPropParse.layaObfuscationMap = new Map();
    return LayaPropParse;
}());
exports.LayaPropParse = LayaPropParse;


/***/ }),

/***/ "./src/MessageTypes.ts":
/*!*****************************!*\
  !*** ./src/MessageTypes.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MessageType = void 0;
/**
 * 消息类型枚举
 * 用于统一管理系统中使用的所有消息类型
 */
var MessageType;
(function (MessageType) {
    // 节点树相关消息
    MessageType["REFRESH_NODE_TREE_REQUEST"] = "REFRESH_NODE_TREE_REQUEST";
    MessageType["REFRESH_NODE_TREE_RESPONSE"] = "REFRESH_NODE_TREE_RESPONSE";
    MessageType["REQUEST_NODE_PROPERTY"] = "REQUEST_NODE_PROPERTY";
    MessageType["NODE_PROPERTY_RESPONSE"] = "NODE_PROPERTY_RESPONSE";
    MessageType["SET_NODE_PROPERTY_REQUEST"] = "SET_NODE_PROPERTY_REQUEST";
    MessageType["SET_NODE_PROPERTY_RESPONSE"] = "SET_NODE_PROPERTY_RESPONSE";
    // 时间缩放相关消息
    MessageType["SET_TIMESCALE_REQUEST"] = "SET_TIMESCALE_REQUEST";
    MessageType["SET_TIMESCALE_RESPONSE"] = "SET_TIMESCALE_RESPONSE";
    MessageType["NEXT_FRAME_REQUEST"] = "NEXT_FRAME_REQUEST";
    // 连接相关消息
    MessageType["LOWER_CONNECT"] = "LOWER_CONNECT";
    MessageType["LOWER_CONNECT_SUCCESS"] = "LOWER_CONNECT_SUCCESS";
    MessageType["LOWER_CONNECT_FAIL"] = "LOWER_CONNECT_FAIL";
    // 心跳包消息
    MessageType["HEARTBEAT"] = "HEARTBEAT";
    // 自动更新标志相关消息
    MessageType["GET_AUTO_UPDATE_FLAG"] = "GET_AUTO_UPDATE_FLAG";
    MessageType["SET_AUTO_UPDATE_FLAG"] = "SET_AUTO_UPDATE_FLAG";
    // 状态相关消息
    MessageType["STAT_REQUEST"] = "STAT_REQUEST";
    MessageType["STAT_RESPONSE"] = "STAT_RESPONSE";
})(MessageType || (exports.MessageType = MessageType = {}));


/***/ }),

/***/ "./src/NanoManager.ts":
/*!****************************!*\
  !*** ./src/NanoManager.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NanoManager = void 0;
var LayaEngineHolder_1 = __webpack_require__(/*! ./LayaEngineHolder */ "./src/LayaEngineHolder.ts");
var MessageTypes_1 = __webpack_require__(/*! ./MessageTypes */ "./src/MessageTypes.ts");
var Utils_1 = __webpack_require__(/*! ./Utils */ "./src/Utils.ts");
var WechatHelper_1 = __webpack_require__(/*! ./WechatHelper */ "./src/WechatHelper.ts");
/**
 * Nano核心管理器
 * 负责处理WebSocket连接和消息处理
 */
var NanoManager = /** @class */ (function () {
    /**
     * 私有构造函数，防止外部直接创建实例
     */
    function NanoManager() {
        this.isActive = false;
        this.heartbeatInterval = null;
        this.upperId = null;
        this.treeRefreshTimer = null;
        this.refreshTime = 1000; // 1秒防抖时间
        this.lastRefreshTime = 0;
        this.layaEngineHolder = new LayaEngineHolder_1.LayaEngineHolder();
        this.layaEngineHolder.initProxy();
    }
    // 使用MessageType枚举替代字符串常量
    /**
     * 获取NanoManager单例
     */
    NanoManager.getInstance = function () {
        if (!NanoManager.instance) {
            NanoManager.instance = new NanoManager();
        }
        return NanoManager.instance;
    };
    /**
     * 启动管理器
     */
    NanoManager.prototype.start = function () {
        if (this.isActive) {
            Utils_1.Logger.log('NanoManager已经处于活动状态');
            return;
        }
        this.isActive = true;
        Utils_1.Logger.log('NanoManager已启动');
        // 注册WebSocket消息处理函数
        this.registerMessageHandler();
    };
    /**
     * 停止管理器
     */
    NanoManager.prototype.stop = function () {
        if (!this.isActive) {
            Utils_1.Logger.log('NanoManager已经处于停止状态');
            return;
        }
        this.isActive = false;
        Utils_1.Logger.log('NanoManager已停止');
        // 清除心跳定时器
        this.clearHeartbeat();
        // 取消注册WebSocket消息处理函数
        this.unregisterMessageHandler();
    };
    /**
     * 注册WebSocket消息处理函数
     */
    NanoManager.prototype.registerMessageHandler = function () {
        var _this = this;
        if (WechatHelper_1.WechatHelper.socketTask) {
            WechatHelper_1.WechatHelper.socketTask.onMessage(function (res) {
                _this.handleMessage(res.data);
            });
            Utils_1.Logger.log('已注册WebSocket消息处理函数');
        }
        else {
            Utils_1.Logger.warn('无法注册WebSocket消息处理函数：socketTask不存在');
        }
    };
    /**
     * 取消注册WebSocket消息处理函数
     */
    NanoManager.prototype.unregisterMessageHandler = function () {
        // 微信小游戏环境下无法直接取消onMessage注册
        // 但可以通过停止标志位来控制消息处理
        Utils_1.Logger.log('已取消WebSocket消息处理');
    };
    /**
     * 处理接收到的WebSocket消息
     * @param data 消息数据
     */
    NanoManager.prototype.handleMessage = function (data) {
        if (!this.isActive) {
            Utils_1.Logger.log('NanoManager未启动，忽略消息');
            return;
        }
        try {
            var message = JSON.parse(data);
            var type = message.type;
            Utils_1.Logger.log('收到WebSocket消息:', type);
            switch (type) {
                case MessageTypes_1.MessageType.LOWER_CONNECT_FAIL:
                    WechatHelper_1.WechatHelper.showNotification('连接失败', 'success');
                    break;
                case MessageTypes_1.MessageType.LOWER_CONNECT_SUCCESS:
                    WechatHelper_1.WechatHelper.showNotification('连接成功', 'success');
                    // 启动心跳定时器，每30秒发送一次心跳包
                    this.upperId = message.upperId;
                    this.startHeartbeat();
                    // 连接成功后请求自动更新标志
                    this.requestAutoUpdateFlag();
                    // 连接成功后请求stat状态
                    this.sendLayaEngineStatus();
                    break;
                case MessageTypes_1.MessageType.REFRESH_NODE_TREE_REQUEST:
                    Utils_1.Logger.log('收到刷新节点树请求');
                    this.handleGetNodeTree();
                    break;
                case MessageTypes_1.MessageType.REQUEST_NODE_PROPERTY:
                    this.handleGetNodeProperty(message.exId);
                    break;
                case MessageTypes_1.MessageType.SET_NODE_PROPERTY_REQUEST:
                    this.handleSetNodeProperty(message);
                    break;
                case MessageTypes_1.MessageType.SET_TIMESCALE_REQUEST:
                    this.handleSetTimeScale(message);
                    break;
                case MessageTypes_1.MessageType.NEXT_FRAME_REQUEST:
                    this.handleNextFrame(message);
                    break;
                case MessageTypes_1.MessageType.HEARTBEAT:
                    Utils_1.Logger.log('收到心跳包');
                    break;
                case MessageTypes_1.MessageType.SET_AUTO_UPDATE_FLAG:
                    this.handleSetAutoUpdateFlag(message);
                    break;
                case MessageTypes_1.MessageType.STAT_REQUEST:
                    this.handleStatRequest(message);
                    break;
                default:
                    Utils_1.Logger.warn('未知的消息类型:', type);
                    break;
            }
        }
        catch (error) {
            Utils_1.Logger.error('处理WebSocket消息失败:', error);
        }
    };
    /**
     * 处理获取节点树请求
     */
    NanoManager.prototype.handleGetNodeTree = function () {
        try {
            // 获取Laya节点树数据
            var nodeTree = this.layaEngineHolder.refreshTree();
            // 构建响应消息
            var response = {
                type: MessageTypes_1.MessageType.REFRESH_NODE_TREE_RESPONSE,
                targetId: this.upperId,
                success: true,
                data: nodeTree
            };
            // 发送响应
            this.sendMessage(response);
            Utils_1.Logger.log('节点树数据已发送');
        }
        catch (error) {
            Utils_1.Logger.error('获取节点树失败:', error);
            // 发送错误响应
            this.sendMessage({
                type: MessageTypes_1.MessageType.REFRESH_NODE_TREE_RESPONSE,
                targetId: this.upperId,
                success: false,
                error: '获取节点树失败'
            });
        }
    };
    /**
     * 处理获取节点属性请求
     * @param payload 请求参数
     */
    NanoManager.prototype.handleGetNodeProperty = function (exId) {
        try {
            if (exId === undefined || exId === null) {
                throw new Error('缺少exId参数');
            }
            // 获取节点属性
            var nodeProperty = this.layaEngineHolder.getNodeProperty(exId);
            // 构建响应消息
            var response = {
                type: MessageTypes_1.MessageType.NODE_PROPERTY_RESPONSE,
                success: true,
                exId: exId,
                targetId: this.upperId,
                property: nodeProperty
            };
            // 发送响应
            this.sendMessage(response);
            Utils_1.Logger.log("\u8282\u70B9\u5C5E\u6027\u5DF2\u53D1\u9001\uFF0CexId: ".concat(exId));
        }
        catch (error) {
            Utils_1.Logger.error('获取节点属性失败:', error);
            // 发送错误响应
            this.sendMessage({
                type: MessageTypes_1.MessageType.NODE_PROPERTY_RESPONSE,
                success: false,
                exId: 0,
                targetId: this.upperId,
                property: []
            });
        }
    };
    /**
     * 处理设置节点属性请求
     * @param payload 请求参数
     */
    NanoManager.prototype.handleSetNodeProperty = function (payload) {
        try {
            var exId = payload.exId, componentType = payload.componentType, propertyName = payload.propertyName, value = payload.value;
            // 参数验证
            if (exId === undefined || exId === null) {
                throw new Error('缺少exId参数');
            }
            if (!componentType) {
                throw new Error('缺少componentType参数');
            }
            if (!propertyName) {
                throw new Error('缺少propertyName参数');
            }
            // 设置节点属性
            var success = this.layaEngineHolder.setNodeProperty(exId, componentType, propertyName, value);
            // 构建响应消息
            var response = {
                type: MessageTypes_1.MessageType.SET_NODE_PROPERTY_RESPONSE,
                success: success,
                targetId: this.upperId,
                exId: exId,
                componentType: componentType,
                propertyName: propertyName,
                value: value
            };
            // 发送响应
            this.sendMessage(response);
            Utils_1.Logger.log("\u8282\u70B9\u5C5E\u6027\u8BBE\u7F6E".concat(success ? '成功' : '失败', "\uFF0CexId: ").concat(exId, ", property: ").concat(componentType, ".").concat(propertyName));
        }
        catch (error) {
            Utils_1.Logger.error('设置节点属性失败:', error);
            // 发送错误响应
            this.sendMessage({
                type: MessageTypes_1.MessageType.SET_NODE_PROPERTY_RESPONSE,
                success: false,
                error: '设置节点属性失败'
            });
        }
    };
    /**
     * 处理设置timeScale请求
     * @param payload 请求参数
     */
    NanoManager.prototype.handleSetTimeScale = function (payload) {
        try {
            var timeScale = parseFloat(payload.timeScale);
            if (isNaN(timeScale)) {
                throw new Error('无效的timeScale值');
            }
            // 设置timeScale
            var actualTimeScale = this.layaEngineHolder.setTimeScale(timeScale);
            // 构建响应消息
            var response = {
                type: MessageTypes_1.MessageType.SET_TIMESCALE_RESPONSE,
                success: true,
                targetId: this.upperId,
                data: { timeScale: actualTimeScale }
            };
            // 发送响应
            this.sendMessage(response);
            Utils_1.Logger.log("timeScale\u5DF2\u8BBE\u7F6E\u4E3A".concat(actualTimeScale));
        }
        catch (error) {
            Utils_1.Logger.error('设置timeScale失败:', error);
            // 发送错误响应
            this.sendMessage({
                type: MessageTypes_1.MessageType.SET_TIMESCALE_RESPONSE,
                success: false,
                targetId: this.upperId,
                error: '设置timeScale失败'
            });
        }
    };
    /**
     * 处理下一帧请求
     * @param payload 请求参数
     */
    NanoManager.prototype.handleNextFrame = function (payload) {
        try {
            Utils_1.Logger.log('收到下一帧请求');
            // 执行下一帧
            this.layaEngineHolder.nextFrame();
        }
        catch (error) {
            Utils_1.Logger.error('执行下一帧失败:', error);
        }
    };
    /**
     * 处理状态请求
     * @param payload 请求参数
     */
    NanoManager.prototype.handleStatRequest = function (payload) {
        // 获取当前状态
        var isShow = this.layaEngineHolder.setShowStat(payload.isShow);
        // 构建响应消息
        var response = {
            type: MessageTypes_1.MessageType.STAT_RESPONSE,
            success: true,
            targetId: this.upperId,
            isShow: isShow
        };
        // 发送响应
        this.sendMessage(response);
        Utils_1.Logger.log('状态请求处理完成，isShow:', isShow);
    };
    /**
     * 启动心跳定时器
     */
    NanoManager.prototype.startHeartbeat = function () {
        var _this = this;
        // 先清除可能存在的旧定时器
        this.clearHeartbeat();
        // 创建新的心跳定时器，每30秒发送一次心跳包
        this.heartbeatInterval = setInterval(function () {
            if (WechatHelper_1.WechatHelper.socketTask) {
                try {
                    _this.sendMessage({
                        type: MessageTypes_1.MessageType.HEARTBEAT
                    });
                    Utils_1.Logger.log('已发送心跳包');
                }
                catch (error) {
                    Utils_1.Logger.error('发送心跳包失败:', error);
                }
            }
        }, 30000); // 30秒发送一次心跳
        Utils_1.Logger.log('心跳定时器已启动');
    };
    /**
     * 清除心跳定时器
     */
    NanoManager.prototype.clearHeartbeat = function () {
        if (this.heartbeatInterval !== null) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
            Utils_1.Logger.log('心跳定时器已清除');
        }
    };
    /**
     * 请求自动更新标志
     */
    NanoManager.prototype.requestAutoUpdateFlag = function () {
        if (!this.upperId) {
            Utils_1.Logger.error('上位机ID不存在，无法请求自动更新标志');
            return;
        }
        var message = {
            type: MessageTypes_1.MessageType.GET_AUTO_UPDATE_FLAG,
            targetId: this.upperId
        };
        this.sendMessage(message);
        Utils_1.Logger.log('已发送获取自动更新标志请求');
    };
    /**
     * 下发Laya引擎状态
     */
    NanoManager.prototype.sendLayaEngineStatus = function () {
        var isShow = this.layaEngineHolder.isShowStat();
        // 构建响应消息
        var response = {
            type: MessageTypes_1.MessageType.STAT_RESPONSE,
            success: true,
            targetId: this.upperId,
            data: { isShow: isShow }
        };
        // 发送响应
        this.sendMessage(response);
    };
    /**
     * 处理设置自动更新标志响应
     */
    NanoManager.prototype.handleSetAutoUpdateFlag = function (message) {
        try {
            Utils_1.Logger.log('收到自动更新标志响应，发送者:', message.senderId, '标志值:', message.autoUpdateFlag);
            // 这里可以根据接收到的自动更新标志进行相应处理
            if (message.autoUpdateFlag) {
                this.startTreeRefreshTimer();
            }
            else {
                this.stopTreeRefreshTimer();
            }
        }
        catch (error) {
            Utils_1.Logger.error('处理自动更新标志响应失败:', error);
        }
    };
    NanoManager.prototype.startTreeRefreshTimer = function () {
        var _this = this;
        // 清除之前的定时器（如果存在）
        if (this.treeRefreshTimer) {
            clearInterval(this.treeRefreshTimer);
        }
        // 启动新的定时器，每秒检查isTreeDirty状态
        this.treeRefreshTimer = setInterval(function () {
            if (_this.layaEngineHolder.isTreeDirty) {
                var currentTime = Date.now();
                // 防抖检查：如果距离上次刷新不足1秒，则跳过
                if (currentTime - _this.lastRefreshTime < _this.refreshTime) {
                    return;
                }
                Utils_1.Logger.log('检测到树结构变化，自动刷新树形结构');
                _this.handleGetNodeTree();
                _this.lastRefreshTime = currentTime;
                // 刷新后将isTreeDirty设置为false
                if (_this.layaEngineHolder.setTreeDirty) {
                    _this.layaEngineHolder.setTreeDirty(false);
                }
                else {
                    _this.layaEngineHolder.isTreeDirty = false;
                }
            }
        }, 500);
        Utils_1.Logger.log('已启动基于isTreeDirty的定时刷新机制（带防抖）');
    };
    NanoManager.prototype.stopTreeRefreshTimer = function () {
        if (this.treeRefreshTimer) {
            clearInterval(this.treeRefreshTimer);
            this.treeRefreshTimer = null;
            Utils_1.Logger.log('定时刷新定时器已清除');
        }
    };
    /**
     * 发送WebSocket消息
     * @param message 消息对象
     */
    NanoManager.prototype.sendMessage = function (message) {
        if (!WechatHelper_1.WechatHelper.socketTask) {
            Utils_1.Logger.warn('无法发送消息：socketTask不存在');
            return;
        }
        try {
            var messageStr = JSON.stringify(message);
            WechatHelper_1.WechatHelper.socketTask.send({
                data: messageStr,
                success: function () {
                    Utils_1.Logger.log('消息发送成功:', message.type);
                },
                fail: function (err) {
                    Utils_1.Logger.error('消息发送失败:', err);
                }
            });
        }
        catch (error) {
            Utils_1.Logger.error('消息序列化失败:', error);
        }
    };
    return NanoManager;
}());
exports.NanoManager = NanoManager;


/***/ }),

/***/ "./src/Utils.ts":
/*!**********************!*\
  !*** ./src/Utils.ts ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports) {


var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.base64Img = exports.Logger = void 0;
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger.getHead = function () {
        return "[".concat(new Date().toLocaleString(), "]");
    };
    /**
     * 设置日志级别
     * @param level 日志级别
     */
    Logger.setLevel = function (level) {
        Logger.currentLevel = level;
    };
    /**
     * 获取当前日志级别
     */
    Logger.getLevel = function () {
        return Logger.currentLevel;
    };
    /**
     * 启用日志
     */
    Logger.enable = function () {
        Logger.enabled = true;
    };
    /**
     * 禁用日志
     */
    Logger.disable = function () {
        Logger.enabled = false;
    };
    /**
     * 检查是否启用日志
     */
    Logger.isEnabled = function () {
        return Logger.enabled;
    };
    /**
     * 检查指定级别的日志是否应该输出
     */
    Logger.shouldLog = function (level) {
        return Logger.enabled && level <= Logger.currentLevel;
    };
    Logger.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (Logger.shouldLog(Logger.LogLevel.LOG)) {
            console.log.apply(console, __spreadArray([this.getHead()], args, false));
        }
    };
    Logger.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (Logger.shouldLog(Logger.LogLevel.WARN)) {
            console.warn.apply(console, __spreadArray([this.getHead()], args, false));
        }
    };
    Logger.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (Logger.shouldLog(Logger.LogLevel.ERROR)) {
            console.error.apply(console, __spreadArray([this.getHead()], args, false));
        }
    };
    Logger.debug = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (Logger.shouldLog(Logger.LogLevel.DEBUG)) {
            console.debug.apply(console, __spreadArray([this.getHead()], args, false));
        }
    };
    // 日志级别枚举
    Logger.LogLevel = {
        ERROR: 0,
        WARN: 1,
        LOG: 2,
        DEBUG: 3
    };
    // 当前日志级别，默认为LOG级别
    Logger.currentLevel = Logger.LogLevel.LOG;
    // 日志开关，默认开启
    Logger.enabled = false;
    return Logger;
}());
exports.Logger = Logger;
exports.base64Img = "data:image/png;base64,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";


/***/ }),

/***/ "./src/WechatHelper.ts":
/*!*****************************!*\
  !*** ./src/WechatHelper.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WechatHelper = void 0;
/// <reference types="minigame-api-typings" />
var MessageTypes_1 = __webpack_require__(/*! ./MessageTypes */ "./src/MessageTypes.ts");
var Utils_1 = __webpack_require__(/*! ./Utils */ "./src/Utils.ts");
var NanoManager_1 = __webpack_require__(/*! ./NanoManager */ "./src/NanoManager.ts");
/**
 * 微信小游戏环境助手
 */
var WechatHelper = /** @class */ (function () {
    function WechatHelper() {
    }
    /**
     * 显示通知消息
     * @param message 消息内容
     * @param type 消息类型：'success'、'error'、'info'、'warning'
     * @param duration 显示时长，单位毫秒，默认1500ms
     */
    WechatHelper.showNotification = function (message, type, duration) {
        if (type === void 0) { type = 'info'; }
        if (duration === void 0) { duration = 1500; }
        // 记录日志
        Utils_1.Logger.log("[".concat(type, "] ").concat(message));
        // 检查微信环境
        if (typeof wx !== 'undefined') {
            // 根据类型设置图标和样式
            var icon = 'none';
            switch (type) {
                case 'success':
                    icon = 'success';
                    break;
                case 'error':
                    icon = 'error';
                    break;
                case 'info':
                    icon = 'none';
                    break;
                case 'warning':
                    icon = 'none';
                    break;
            }
            // 使用微信小游戏的toast API显示消息
            wx.showToast({
                title: message,
                icon: icon,
                duration: duration,
                mask: false
            });
        }
    };
    /**
     * 检查当前环境是否支持微信API
     * @returns 是否支持微信API
     */
    WechatHelper.isSupported = function () {
        return typeof wx !== 'undefined';
    };
    /**
     * 使用扫码方式获取连接地址
     * @param callback 连接成功后的回调函数
     */
    WechatHelper.scanQRCodeForConnection = function (callback) {
        if (typeof wx !== 'undefined' && wx.scanCode) {
            wx.scanCode({
                scanType: ['qrCode'],
                success: function (res) {
                    Utils_1.Logger.log('扫码成功:', res.result);
                    try {
                        // 尝试解析JSON格式的扫码结果
                        // 预期格式为 { uid: uniqueId, url: wsAddress }
                        var scanData = JSON.parse(res.result);
                        if (scanData && scanData.uid && scanData.url) {
                            // 存储唯一标识ID，用于后续连接消息
                            WechatHelper.uniqueId = scanData.uid;
                            // 解析WebSocket地址
                            var parsedUrl = WechatHelper.parseWebSocketUrl(scanData.url);
                            var ip = parsedUrl.ip, port = parsedUrl.port, iswss = parsedUrl.iswss;
                            // 连接到指定IP的服务器
                            if (ip && ip.trim() !== '') {
                                // 传递uniqueId参数和完整wsUrl
                                WechatHelper.connectToServer(ip, port, iswss, callback, scanData.uid, scanData.url);
                                wx.vibrateShort({
                                    type: 'light',
                                });
                            }
                            else {
                                WechatHelper.showNotification('无效地址', 'error');
                            }
                        }
                    }
                    catch (error) {
                        WechatHelper.showNotification('无效二维码', 'error');
                    }
                },
                fail: function (err) {
                    Utils_1.Logger.log('扫码失败:', err);
                    WechatHelper.showNotification('扫码失败', 'error');
                }
            });
        }
        else {
            Utils_1.Logger.log('当前环境不支持wx.scanCode，尝试使用手动输入');
        }
    };
    /**
     * 解析WebSocket URL
     * @param url WebSocket URL
     * @param defaultPort 默认端口号
     * @returns 解析结果，包含IP、端口和是否使用WSS
     */
    WechatHelper.parseWebSocketUrl = function (url, defaultPort) {
        if (defaultPort === void 0) { defaultPort = 8080; }
        var result = {
            ip: '',
            port: defaultPort,
            iswss: false
        };
        if (!url)
            return result;
        var processedUrl = url;
        // 解析协议
        if (processedUrl.startsWith('wss://')) {
            result.iswss = true;
            processedUrl = processedUrl.substring(6);
        }
        else if (processedUrl.startsWith('ws://')) {
            result.iswss = false;
            processedUrl = processedUrl.substring(5);
        }
        // 解析IP和端口
        if (processedUrl.includes(':')) {
            var parts = processedUrl.split(':');
            result.ip = parts[0];
            var parsedPort = parseInt(parts[1]);
            if (!isNaN(parsedPort)) {
                result.port = parsedPort;
            }
        }
        else {
            result.ip = processedUrl;
        }
        return result;
    };
    /**
     * 构建WebSocket URL
     * @param info WebSocket连接信息
     * @returns 完整的WebSocket URL
     */
    WechatHelper.buildWebSocketUrl = function (info) {
        var ip = info.ip, port = info.port, iswss = info.iswss;
        var protocol = iswss ? 'wss://' : 'ws://';
        return "".concat(protocol).concat(ip, ":").concat(port);
    };
    /**
     * 连接到指定服务器
     * @param ip 服务器IP
     * @param port 服务器端口
     * @param iswss 是否使用WSS安全连接，如果提供wsUrl参数，则会根据wsUrl自动判断
     * @param callback 连接成功后的回调函数
     * @param uniqueId 可选的唯一标识ID，如果提供则会覆盖已存储的uniqueId
     * @param wsUrl 可选的完整WebSocket URL，如果提供则会自动解析协议、IP和端口
     */
    WechatHelper.connectToServer = function (ip, port, iswss, callback, uniqueId, wsUrl) {
        if (iswss === void 0) { iswss = false; }
        // 如果提供了完整的wsUrl，则解析出协议、IP和端口
        if (wsUrl) {
            var parsedUrl = WechatHelper.parseWebSocketUrl(wsUrl);
            ip = parsedUrl.ip || ip;
            port = parsedUrl.port || port;
            iswss = parsedUrl.iswss;
        }
        // 参数验证
        if (!ip || ip.trim() === '') {
            WechatHelper.showNotification('服务器地址不能为空', 'error');
            return;
        }
        // 显示连接提示
        var fullWsUrl = WechatHelper.buildWebSocketUrl({ ip: ip, port: port, iswss: iswss });
        // WechatHelper.showNotification(`正在连接到 ${fullWsUrl}`, 'info');
        // 如果提供了uniqueId，则更新存储的值
        if (uniqueId) {
            WechatHelper.uniqueId = uniqueId;
            Utils_1.Logger.log('已更新uniqueId:', uniqueId);
        }
        // 如果已有连接，先关闭
        if (WechatHelper.socketTask) {
            try {
                WechatHelper.socketTask.close({
                    success: function () { return Utils_1.Logger.log('成功关闭旧连接'); },
                    fail: function (err) { return Utils_1.Logger.log('关闭旧连接失败', err); },
                    complete: function () {
                        WechatHelper.socketTask = null;
                        // 关闭后立即创建新连接
                        setTimeout(function () {
                            WechatHelper._createSocketConnection(ip, port, iswss, callback);
                        }, 500);
                    }
                });
                return; // 等待关闭回调中创建新连接
            }
            catch (e) {
                Utils_1.Logger.log('关闭旧连接时发生异常', e);
                WechatHelper.socketTask = null;
            }
        }
        // 创建新连接
        WechatHelper._createSocketConnection(ip, port, iswss, callback);
    };
    /**
     * 创建WebSocket连接（内部方法）
     * @private
     */
    WechatHelper._createSocketConnection = function (ip, port, iswss, callback) {
        // 检查环境
        if (typeof wx === 'undefined' || !wx.connectSocket) {
            Utils_1.Logger.log('当前环境不支持wx.connectSocket');
            return;
        }
        // 创建连接
        try {
            // 构建WebSocket URL
            var fullWsUrl = WechatHelper.buildWebSocketUrl({ ip: ip, port: port, iswss: iswss });
            // 使用SocketTask管理WebSocket连接
            WechatHelper.socketTask = wx.connectSocket({
                url: fullWsUrl,
                success: function () { return Utils_1.Logger.log('WebSocket连接创建成功'); },
                fail: function (err) {
                    Utils_1.Logger.log('WebSocket连接创建失败', err);
                    WechatHelper.showNotification('连接失败', 'error');
                }
            });
            // 使用SocketTask管理WebSocket事件
            if (WechatHelper.socketTask) {
                // 连接打开事件
                WechatHelper.socketTask.onOpen(function () {
                    Utils_1.Logger.log('WebSocket连接已打开');
                    // 发送下位机连接消息，包含上位机的唯一标识ID
                    if (WechatHelper.uniqueId) {
                        try {
                            WechatHelper.socketTask.send({
                                data: JSON.stringify({
                                    type: MessageTypes_1.MessageType.LOWER_CONNECT,
                                    uniqueId: WechatHelper.uniqueId
                                })
                            });
                        }
                        catch (error) {
                            Utils_1.Logger.error('发送下位机连接消息失败:', error);
                        }
                    }
                    // 启动NanoManager
                    NanoManager_1.NanoManager.getInstance().start();
                    if (callback)
                        callback();
                });
                // 连接关闭事件
                WechatHelper.socketTask.onClose(function () {
                    Utils_1.Logger.log('WebSocket连接已关闭');
                    if (WechatHelper.socketTask) {
                        WechatHelper.showNotification('连接已断开', 'warning');
                    }
                    // 停止NanoManager
                    NanoManager_1.NanoManager.getInstance().stop();
                    WechatHelper.socketTask = null;
                });
                // 连接错误事件
                WechatHelper.socketTask.onError(function (err) {
                    Utils_1.Logger.log('WebSocket连接发生错误:', err);
                    WechatHelper.showNotification('连接错误', 'error');
                    // 错误时尝试关闭连接
                    try {
                        WechatHelper.socketTask.close();
                    }
                    catch (e) {
                        // 忽略关闭错误
                    }
                    WechatHelper.socketTask = null;
                });
            }
        }
        catch (error) {
            Utils_1.Logger.error('创建WebSocket连接时发生异常:', error);
            WechatHelper.showNotification('连接异常', 'error');
        }
    };
    /**
     * 关闭WebSocket连接
     * @param showNotification 是否显示通知，默认为true
     * @returns 是否成功关闭连接
     */
    WechatHelper.closeConnection = function (showNotification) {
        if (showNotification === void 0) { showNotification = true; }
        if (!WechatHelper.socketTask) {
            Utils_1.Logger.log('没有活动的WebSocket连接');
            return false;
        }
        try {
            WechatHelper.socketTask.close({
                success: function () {
                    Utils_1.Logger.log('WebSocket连接已主动关闭');
                    if (showNotification) {
                        WechatHelper.showNotification('已断开连接', 'info');
                    }
                    // 停止NanoManager
                    NanoManager_1.NanoManager.getInstance().stop();
                },
                fail: function (err) {
                    Utils_1.Logger.log('WebSocket连接关闭失败', err);
                    if (showNotification) {
                        WechatHelper.showNotification('断开连接失败', 'error');
                    }
                },
                complete: function () {
                    WechatHelper.socketTask = null;
                }
            });
            return true;
        }
        catch (e) {
            Utils_1.Logger.log('关闭WebSocket连接时发生异常', e);
            WechatHelper.socketTask = null;
            if (showNotification) {
                WechatHelper.showNotification('断开连接异常', 'error');
            }
            return false;
        }
    };
    /**
     * 检查WebSocket连接状态
     * @returns 连接是否活跃
     */
    WechatHelper.isConnected = function () {
        return WechatHelper.socketTask !== null;
    };
    // 存储上位机的唯一标识ID
    WechatHelper.uniqueId = '';
    // 存储当前的SocketTask实例，方便后续管理
    WechatHelper.socketTask = null;
    return WechatHelper;
}());
exports.WechatHelper = WechatHelper;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.layaTreeNano = exports.LayaTreeNano = exports.MessageType = void 0;
/// <reference types="minigame-api-typings" />
var Utils_1 = __webpack_require__(/*! ./Utils */ "./src/Utils.ts");
var ConnectionHelper_1 = __webpack_require__(/*! ./ConnectionHelper */ "./src/ConnectionHelper.ts");
var MessageTypes_1 = __webpack_require__(/*! ./MessageTypes */ "./src/MessageTypes.ts");
Object.defineProperty(exports, "MessageType", ({ enumerable: true, get: function () { return MessageTypes_1.MessageType; } }));
var LayaTreeNano = /** @class */ (function () {
    function LayaTreeNano() {
        this.init();
    }
    /**
     * 处理调试按钮点击事件
     */
    LayaTreeNano.prototype.handleDebugButtonClick = function () {
        // 调用ConnectionHelper显示连接选项对话框（会根据环境自动选择合适的实现方式）
        ConnectionHelper_1.ConnectionHelper.showIpInputDialog();
    };
    LayaTreeNano.prototype.init = function () {
        var _this = this;
        if (window.Laya) {
            Utils_1.Logger.log('Laya版本: ', window.Laya.LayaEnv.version);
            // 创建debug层
            var intervalId_1 = setInterval(function () {
                if (window.stage) {
                    clearInterval(intervalId_1);
                    _this.createDebugLayer();
                }
            }, 100);
        }
    };
    LayaTreeNano.prototype.createDebugLayer = function () {
        var Laya = window.Laya;
        // 创建最顶层的debug层
        var debugLayer = new Laya.Sprite();
        debugLayer.name = "LayaTreeDebugLayer";
        debugLayer.zOrder = 999999; // 设置最高层级
        // 添加到舞台
        Laya.stage.addChild(debugLayer);
        Utils_1.Logger.log('Debug层已创建并添加到舞台');
        // 创建可拖动的调试按钮
        this.createDraggableDebugButton(debugLayer);
        // 添加移除监听
        debugLayer.on(Laya.Event.REMOVED, null, function () {
            Utils_1.Logger.log('Debug层被移除，1秒后重新添加');
            // 1秒后重新添加
            setTimeout(function () {
                if (!debugLayer.parent) { // 确保还没有被重新添加
                    Laya.stage.addChild(debugLayer);
                    Utils_1.Logger.log('Debug层已重新添加到舞台');
                }
            }, 1000);
        });
        // 返回debug层引用，方便外部使用
        return debugLayer;
    };
    LayaTreeNano.prototype.createDraggableDebugButton = function (parent) {
        var _this = this;
        var Laya = window.Laya;
        // 创建按钮容器
        var button = new Laya.Sprite();
        button.name = "DebugButton";
        button.size(48, 48);
        button.pos(50, 500); // 初始位置
        // 创建按钮背景
        var bg = new Laya.Graphics();
        bg.drawRect(0, 0, 48, 48, "#00000000");
        button.graphics = bg;
        // 创建图标
        var icon = new Laya.Sprite();
        // 加载图片并显示
        Laya.loader.load(Utils_1.base64Img, Laya.Handler.create(null, function (texture) {
            if (texture) {
                icon.graphics.drawTexture(texture, 0, 0, 48, 48);
            }
        }));
        icon.size(48, 48);
        icon.pos(0, 0);
        button.addChild(icon);
        // 添加到父容器
        parent.addChild(button);
        // 拖拽相关变量
        var isDragging = false;
        var startX = 0;
        var startY = 0;
        var startButtonX = 0;
        var startButtonY = 0;
        // 鼠标按下事件
        button.on(Laya.Event.MOUSE_DOWN, null, function (e) {
            isDragging = true;
            startX = e.stageX;
            startY = e.stageY;
            startButtonX = button.x;
            startButtonY = button.y;
            Laya.stage.on(Laya.Event.MOUSE_MOVE, null, onMouseMove);
            Laya.stage.on(Laya.Event.MOUSE_UP, null, onMouseUp);
        });
        // 鼠标移动事件
        var onMouseMove = function (e) {
            if (isDragging) {
                var deltaX = e.stageX - startX;
                var deltaY = e.stageY - startY;
                button.pos(startButtonX + deltaX, startButtonY + deltaY);
            }
        };
        // 鼠标抬起事件
        var onMouseUp = function (e) {
            if (isDragging) {
                isDragging = false;
                Laya.stage.off(Laya.Event.MOUSE_MOVE, null, onMouseMove);
                Laya.stage.off(Laya.Event.MOUSE_UP, null, onMouseUp);
                // 检查是否是点击（移动距离很小）
                var deltaX = Math.abs(e.stageX - startX);
                var deltaY = Math.abs(e.stageY - startY);
                if (deltaX < 5 && deltaY < 5) {
                    // 使用WechatHelper处理IP输入和连接逻辑
                    _this.handleDebugButtonClick();
                }
            }
        };
        Utils_1.Logger.log('可拖动的Debug按钮已创建');
    };
    return LayaTreeNano;
}());
exports.LayaTreeNano = LayaTreeNano;
exports.layaTreeNano = new LayaTreeNano();

})();

/******/ })()
;
//# sourceMappingURL=nano.js.map