# 短链接服务

基于 Cloudflare Workers 的高性能短链接服务 API。

## 功能

- ✅ 生成短链接（随机或自定义短码）
- ✅ 短链接重定向
- ✅ 点击次数统计
- ✅ 查询短链接信息
- ✅ 删除短链接
- ✅ CORS 支持
- ✅ 高可用性（全球边缘节点）

## 快速开始

### 安装

```bash
npm install
```

### 配置

创建 KV 命名空间：

```bash
wrangler kv:namespace create "URL_STORE"
```

更新 `wrangler.toml` 中的 KV namespace ID。

### 开发

```bash
npm run dev
```

访问 http://localhost:8787

### 部署

```bash
npm run deploy
```

详见 [部署指南](./DEPLOYMENT.md)

---

## API 端点

### POST `/api/shorten` - 创建短链接

**请求**：
```json
{
  "url": "https://example.com/very/long/url",
  "customCode": "mycode"
}
```

**响应** (201):
```json
{
  "success": true,
  "shortCode": "mycode",
  "shortUrl": "https://your-worker.workers.dev/mycode",
  "originalUrl": "https://example.com/very/long/url"
}
```

---

### GET `/{shortCode}` - 重定向

直接访问短链接，自动重定向到原始 URL。点击次数会自动统计。

**示例**：
```
https://your-worker.workers.dev/mycode
```

---

### GET `/api/info/{shortCode}` - 获取信息

**响应** (200):
```json
{
  "url": "https://example.com/very/long/url",
  "shortCode": "mycode",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "clicks": 42
}
```

---

### DELETE `/api/{shortCode}` - 删除短链接

**响应** (200):
```json
{
  "success": true,
  "message": "短链接已删除"
}
```

---

## 技术栈

- **平台**：Cloudflare Workers
- **存储**：Cloudflare KV
- **工具**：Wrangler CLI
- **语言**：JavaScript

## 部署

部署到 Cloudflare Workers：

```bash
npm run deploy
```

Worker 将部署到 `https://[worker-name].workers.dev`

详细说明见 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 配置

所有配置在 `wrangler.toml` 中：

```toml
name = "short-url"
type = "javascript"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "URL_STORE"
id = "your_kv_namespace_id"
preview_id = "your_preview_kv_namespace_id"
```

## 注意事项

- Cloudflare KV 是最终一致性存储，写入后可能需要几秒才能全球可见
- 免费版有请求限制，详见 [定价](https://workers.cloudflare.com/)
- 建议添加身份验证防止滥用

## 许可证

MIT
