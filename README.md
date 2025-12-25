# 短链接服务

基于 Cloudflare Workers 的短链接服务 API，支持生成短码、重定向、列表与删除，并将数据存储在 Cloudflare KV。

## 功能

- 生成短链接（随机或自定义短码）
- 短链接重定向与点击次数统计
- 获取短链接列表
- 删除短链接（单个与批量）
- CORS 支持

## 技术栈

- 平台：Cloudflare Workers
- 存储：Cloudflare KV
- 语言：JavaScript

## 环境配置

- 绑定 KV 命名空间：`URL_STORE`
- 可选环境变量：`DOMAIN`（用于拼接返回的短链接域名）
- 可选环境变量：`ALLOWED_ORIGINS`（CORS 允许的来源，逗号分隔；不配置则允许所有来源）

## 部署

1. 在 Cloudflare Workers 创建一个新 Worker。
2. 将 `worker.js` 的内容粘贴为 Worker 脚本。
3. 在 Worker 的环境变量中配置 `DOMAIN`。
4. 如需限制跨域访问，配置 `ALLOWED_ORIGINS`。

建议将敏感信息存放为 Worker 的加密环境变量。

## API 说明

### 1) 创建短链接

**POST** `/api/shorten`

请求示例：

```json
{
  "url": "https://example.com/very/long/url",
  "customCode": "mycode",
  "username": "alice"
}
```

响应示例（201）：

```json
{
  "success": true,
  "shortCode": "mycode",
  "shortUrl": "https://your-domain.com/mycode",
  "originalUrl": "https://example.com/very/long/url",
  "username": "alice"
}
```

说明：

- `customCode` 可选；不提供时服务会生成随机短码。
- 当 `customCode` 已存在时返回 409。

---

### 2) 访问短链接（重定向）

**GET** `/{shortCode}`

示例：

```
https://your-domain.com/mycode
```

说明：

- 自动 302 重定向到原始 URL。
- 会累计 `clicks` 计数。

---

### 3) 获取短链接列表

**GET** `/api/list`

查询参数：

- `limit`：返回条数，默认 100，最大 1000
- `cursor`：分页游标

响应示例（200）：

```json
{
  "items": [
    {
      "url": "https://example.com/very/long/url",
      "shortCode": "mycode",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "clicks": 42,
      "username": "alice"
    }
  ],
  "cursor": null
}
```

---

### 4) 批量删除短链接

**POST** `/api/batch-delete`

请求示例：

```json
{
  "shortCodes": ["mycode", "other"]
}
```

响应示例（200）：

```json
{
  "success": true,
  "deleted": ["mycode"],
  "notFound": ["other"]
}
```

---

### 5) 删除单个短链接

**DELETE** `/api/{shortCode}`

响应示例（200）：

```json
{
  "success": true,
  "message": "短链接已删除"
}
```

## CORS

- 允许方法：`GET, POST, DELETE, OPTIONS`
- 允许头：`Content-Type`
- 允许来源：未配置 `ALLOWED_ORIGINS` 时为 `*`；配置后仅允许命中的来源

示例：限制为两个域名

```
ALLOWED_ORIGINS=https://example.com,https://admin.example.com
```

## 注意事项

- Cloudflare KV 为最终一致性存储，写入后可能需要几秒才能全球可见。
- 建议在生产环境加入鉴权与限流以防滥用。
