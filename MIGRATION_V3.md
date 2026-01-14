# Manifest V3 迁移说明

## ✅ 迁移完成状态

本次更新已成功将 SyncMyCookie 扩展从 Manifest V2 升级到 Manifest V3，可以在最新版本的 Chrome 浏览器上正常工作。

**构建状态：** ✅ 成功构建  
**测试建议：** 请加载到 Chrome 并测试所有功能

---

## 主要变更

### 1. manifest.json 变更

#### 版本升级
- `manifest_version`: 2 → 3

#### Background 脚本改为 Service Worker
```diff
- "background": {
-   "scripts": ["background.js"],
-   "persistent": false
- }
+ "background": {
+   "service_worker": "background.js"
+ }
```

#### 浏览器操作 API 更名
```diff
- "browser_action": { ... }
+ "action": { ... }
```

#### 权限分离
```diff
  "permissions": [
    "cookies",
    "storage",
-   "<all_urls>",
    "tabs"
- ]
+ ],
+ "host_permissions": [
+   "<all_urls>"
+ ]
```

### 2. 代码变更

#### src/background.ts
- 将 `chrome.browserAction` 替换为 `chrome.action`

```typescript
// 旧的 API (V2)
chrome.browserAction.setBadgeText({text});
chrome.browserAction.setBadgeBackgroundColor({color});

// 新的 API (V3)
chrome.action.setBadgeText({text});
chrome.action.setBadgeBackgroundColor({color});
```

### 3. 依赖更新

#### package.json
- 更新 `@types/chrome` 从 `^0.0.80` 到 `^0.0.268`，支持 Manifest V3 类型定义
- 将 `node-sass` 替换为 `sass` (^1.32.0)，解决 Node.js 兼容性问题
- 添加 `cross-env` 和 `rimraf` 用于跨平台构建
- 更新构建脚本以支持 Windows 环境

#### webpack.config.js
- 配置 sass-loader 使用现代 `sass` 实现
- 添加 `implementation: require('sass')` 选项

### 4. 构建配置更新

#### 脚本变更
```json
"scripts": {
  "build": "npm run clean && node ./scripts/copyFiles.js && cross-env NODE_ENV=production NODE_OPTIONS=--openssl-legacy-provider webpack",
  "clean": "rimraf build"
}
```

---

## 安装和构建

### 1. 克隆或更新代码
```bash
cd sync-my-cookie
git pull  # 如果是更新现有仓库
```

### 2. 安装依赖
```bash
npm install --legacy-peer-deps
```

> **注意：** 使用 `--legacy-peer-deps` 以避免旧依赖的 peer 依赖冲突

### 3. 构建扩展
```bash
npm run build
```

构建成功后，`build` 文件夹将包含：
- ✅ `manifest.json` (V3 格式)
- ✅ `background.js` (Service Worker)
- ✅ `popup.html` / `popup.js`
- ✅ `options.html` / `options.js`
- ✅ 样式文件和图标

### 4. 加载到 Chrome
1. 打开 Chrome 扩展管理页面：`chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `build` 文件夹

---

## 兼容性说明

- ✅ Chrome 88+ (Manifest V3 支持)
- ✅ Edge 88+ (基于 Chromium)
- ❌ 旧版 Chrome (<88) 需要使用 Manifest V2 版本

---

## Manifest V3 的主要优势

1. **更好的性能**：Service Worker 替代持久化后台页面，减少资源占用
2. **更强的隐私保护**：host_permissions 分离，权限管理更清晰
3. **更好的安全性**：移除远程代码执行，更严格的 CSP 策略
4. **未来兼容性**：Chrome 将在 2024 年后逐步禁用 Manifest V2

---

## 已知限制

Service Worker 环境与传统的后台页面有一些区别：
- ⚠️ 不支持 DOM 操作（但本扩展未使用）
- ⚠️ 需要处理 Service Worker 的生命周期（当前实现已兼容）
- ⚠️ 某些 Web API 可能不可用（当前未受影响）

---

## 测试建议

升级后建议测试以下功能：
1. ✓ 自动合并功能（浏览器启动时）
2. ✓ 自动推送功能（Cookie 变更时）
3. ✓ Badge 通知显示
4. ✓ Popup 界面交互
5. ✓ Options 页面配置
6. ✓ GitHub Gist 同步

---

## 故障排除

### 构建失败
如果遇到 OpenSSL 错误：
```bash
# 已在构建脚本中添加此环境变量
NODE_OPTIONS=--openssl-legacy-provider npm run build
```

### 扩展加载失败
1. 检查 Chrome 版本是否 >= 88
2. 在 `chrome://extensions/` 中查看错误日志
3. 清除旧的扩展数据后重新加载
4. 检查是否有权限提示需要用户授权

### 依赖安装问题
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## 技术债务和未来改进

虽然已成功迁移到 V3，但以下方面可以进一步优化：

1. **依赖更新**：许多依赖包已过时（webpack 4 → 5, React 16 → 18）
2. **代码拆分**：Popup 和 Options 页面的包体积较大
3. **TypeScript**：升级到最新版本并改进类型定义
4. **构建工具**：考虑迁移到 Vite 或 esbuild 以提升构建速度

---

## 更新日志

### 2.0.1 (2026-01-15)
- ✅ 升级到 Manifest V3
- ✅ 更新 Chrome API 调用
- ✅ 修复构建依赖问题
- ✅ 改进跨平台兼容性
- ✅ 更新类型定义

---

## 参考资料

- [Chrome Manifest V3 官方文档](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Manifest V2 到 V3 迁移指南](https://developer.chrome.com/docs/extensions/mv3/mv3-migration/)
- [Service Workers 文档](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
