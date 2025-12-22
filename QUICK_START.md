# 快速开始

## 1️⃣ 安装依赖

```bash
npm install
```

## 2️⃣ 创建 KV 命名空间

```bash
wrangler kv:namespace create "URL_STORE"
```

复制输出中的 `id` 和 `preview_id`。

## 3️⃣ 配置 wrangler.toml

编辑 `wrangler.toml`，填入 KV namespace ID：

```toml
[[kv_namespaces]]
binding = "URL_STORE"
id = "YOUR_KV_ID"
preview_id = "YOUR_PREVIEW_ID"
```

## 4️⃣ 本地测试

```bash
npm run dev
```

访问 http://localhost:8787

## 5️⃣ 部署

```bash
npm run deploy
```

---

## 使用 API

### 创建短链接

```bash
curl -X POST https://your-worker.workers.dev/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/long"}'
```

### 访问短链接

```bash
curl https://your-worker.workers.dev/abc123
# 自动重定向到原始 URL
```

### 查询信息

```bash
curl https://your-worker.workers.dev/api/info/abc123
```

### 删除

```bash
curl -X DELETE https://your-worker.workers.dev/api/abc123
```

---

详见 [DEPLOYMENT.md](./DEPLOYMENT.md) 和 [README.md](./README.md)
