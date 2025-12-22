# Cloudflare Workers 部署指南

基于 Cloudflare Workers 的短链接服务 API。

## 前置条件

- 已有 Cloudflare 账户
- 已安装 Node.js 和 npm
- 已安装 Wrangler CLI

```bash
npm install -g @cloudflare/wrangler
# 或
npm install -D wrangler
```

## 部署步骤

### 1. 创建 KV 命名空间

```bash
# 创建生产环境命名空间
wrangler kv:namespace create "URL_STORE"

# 输出示例：
# 🌀 Creating KV namespace "URL_STORE"
# ✨ Created KV namespace "URL_STORE"
# Add the following to your wrangler.toml:
# id = "abcd1234..."
# preview_id = "efgh5678..."
```

记录返回的 `id` 和 `preview_id`。

### 2. 配置 wrangler.toml

编辑 `wrangler.toml`，填入刚创建的命名空间 ID：

```toml
[[kv_namespaces]]
binding = "URL_STORE"
id = "your_kv_namespace_id"           # 粘贴生产环境 ID
preview_id = "your_preview_kv_namespace_id"  # 粘贴预览环境 ID
```

### 3. 本地开发和测试

```bash
# 启动本地开发服务器
npm run dev

# 访问 http://localhost:8787
```

### 4. 部署到 Cloudflare Workers

```bash
npm run deploy

# 输出示例：
# 🌍 Uploading...
# ✨ Success! Worker uploaded to https://short-url.your-account.workers.dev
```

---

## API 接口

### 创建短链接

```bash
curl -X POST https://your-worker.workers.dev/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/very/long/url",
    "customCode": "mycode"
  }'
```

**响应**：
```json
{
  "success": true,
  "shortCode": "mycode",
  "shortUrl": "https://your-worker.workers.dev/mycode",
  "originalUrl": "https://example.com/very/long/url"
}
```

### 获取短链接信息

```bash
curl https://your-worker.workers.dev/api/info/mycode
```

**响应**：
```json
{
  "url": "https://example.com/very/long/url",
  "shortCode": "mycode",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "clicks": 42
}
```

### 重定向

访问短链接直接跳转：
```
https://your-worker.workers.dev/mycode → 重定向到原始 URL
```

### 删除短链接

```bash
curl -X DELETE https://your-worker.workers.dev/api/mycode
```

**响应**：
```json
{
  "success": true,
  "message": "短链接已删除"
}
```

---

## 项目结构

```
short-url/
├── src/
│   └── index.js              # Worker 主文件
├── wrangler.toml             # Cloudflare 配置
├── package.json              # 项目配置
├── README.md                 # 项目文档
└── DEPLOYMENT.md             # 部署指南（本文件）
```

## 配置说明

### wrangler.toml

| 字段 | 说明 |
|------|------|
| `name` | Worker 名称 |
| `main` | 入口文件路径 |
| `compatibility_date` | 兼容性日期 |
| `kv_namespaces` | KV 存储绑定 |

### 环境变量

如需添加环境变量（如自定义域名），在 wrangler.toml 中添加：

```toml
[env.production]
vars = { DOMAIN = "yourdomain.com" }
```

在代码中使用：
```javascript
const domain = env.DOMAIN || 'your-worker.workers.dev';
```

---

## 常见问题

### Q: 如何更新部署？

```bash
# 修改代码后
npm run deploy
```

### Q: 如何查看部署的 Worker？

访问 `https://[worker-name].workers.dev` 或在 Cloudflare Dashboard 查看。

### Q: KV 数据会丢失吗？

不会。KV 存储中的数据持久化存储，除非手动删除。

### Q: 如何监控 Worker 执行？

在 Cloudflare Dashboard → Workers → 你的 Worker → Real-time logs

### Q: 请求限制是多少？

- 免费版：100,000 请求/天
- 付费版：无限制

详见 [Cloudflare Workers 定价](https://workers.cloudflare.com/)

---

## 自定义域名

如需使用自己的域名，而不是 `*.workers.dev`：

1. Dashboard → Workers → 你的 Worker → Settings
2. Routes → Add route
3. 填入路由（如 `short.yourdomain.com/*`）
4. 选择 Zone（你的域名）

---

## 故障排除

| 问题 | 解决方案 |
|------|--------|
| 部署失败 | 检查 wrangler.toml 配置，确保 KV namespace ID 正确 |
| API 返回 404 | 检查请求路径是否正确（`/api/...`） |
| KV 操作失败 | 确认 KV namespace 已创建并在 wrangler.toml 中配置 |
| 超时错误 | KV 读写可能较慢，检查网络连接 |

---

## 更多信息

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [KV 存储文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
