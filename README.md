# 短链接服务

基于 Cloudflare Pages/Workers 的短链接服务，支持自定义短码、点击统计等功能，提供美观的 Web 界面。

## 功能特性

- ✅ 美观的 Web 界面
- ✅ 生成短链接（随机或自定义短码）
- ✅ 短链接重定向
- ✅ 点击次数统计
- ✅ 查询短链接信息
- ✅ 删除短链接
- ✅ CORS 支持
- ✅ 使用 Cloudflare KV 存储

## 部署方式

本项目支持两种部署方式：

### 方式一：Cloudflare Pages（推荐）

Pages 部署更简单，支持前端界面和后端 API 一体化部署。

#### 1. 安装依赖

```bash
npm install
```

#### 2. 创建 KV 命名空间

```bash
wrangler kv:namespace create "URL_STORE"
```

记录返回的 namespace ID。

#### 3. 本地开发

```bash
# 使用本地 KV 进行开发
npm run dev
```

访问 http://localhost:8788 查看效果。

#### 4. 部署到 Cloudflare Pages

**方法 A：通过 Git 部署（推荐）**

1. 将代码推送到 GitHub/GitLab
2. 在 Cloudflare Dashboard 中创建 Pages 项目
3. 选择 "连接 Git"
4. 授权并选择此仓库
5. **构建设置（重要，三个字段都要对）**：
   - Framework preset: `None`（选"无"）
   - Build command: 留空（不要填任何东西）
   - Build output directory: `public`（不是 `/public`）
6. 部署后，在 Pages 项目设置中添加 KV 绑定：
   - 进入 → 设置 → Functions → KV namespace bindings
   - 变量名：`URL_STORE`
   - KV 命名空间：选择之前创建的命名空间
7. 重新部署（触发新构建）

> **注意**：如果部署后看到 "Hello world"，说明构建输出目录设置错误，改为 `public` 并重新部署

**方法 B：GitHub Actions 自动部署（可选）**

项目已包含 `.github/workflows/deploy.yml`，支持自动部署。需要设置：

1. GitHub 仓库 → Settings → Secrets
2. 添加环境变量：
   - `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
   - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID

获取方法：
- Account ID：Cloudflare Dashboard → 账户 → API 令牌 → 帐户 ID
- API Token：创建 Token → Pages 权限 → 获取 Token

### 方式二：Cloudflare Workers

如果只需要 API 功能，可以使用 Workers 部署。

#### 1. 安装依赖

```bash
npm install
```

#### 2. 创建 KV 命名空间

```bash
wrangler kv:namespace create "URL_STORE"
wrangler kv:namespace create "URL_STORE" --preview
```

#### 3. 配置 wrangler.toml

将生成的 KV namespace ID 填入 `wrangler.toml` 文件：

```toml
[[kv_namespaces]]
binding = "URL_STORE"
id = "your_kv_namespace_id"
preview_id = "your_preview_kv_namespace_id"
```

#### 4. 本地开发

```bash
npm run dev:worker
```

#### 5. 部署

```bash
npm run deploy:worker
```

## API 使用说明

### 1. 创建短链接

**请求：**

```bash
curl -X POST https://your-domain.com/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/very/long/url",
    "customCode": "mycode"
  }'
```

**参数说明：**
- `url` (必填): 要缩短的原始 URL
- `customCode` (可选): 自定义短码，不提供则自动生成

**响应：**

```json
{
  "success": true,
  "shortCode": "mycode",
  "shortUrl": "https://your-domain.com/mycode",
  "originalUrl": "https://example.com/very/long/url"
}
```

### 2. 访问短链接

直接访问短链接即可重定向到原始 URL：

```
https://your-domain.com/{shortCode}
```

### 3. 查询短链接信息

**请求：**

```bash
curl https://your-domain.com/api/info/{shortCode}
```

**响应：**

```json
{
  "url": "https://example.com/very/long/url",
  "shortCode": "mycode",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "clicks": 42
}
```

### 4. 删除短链接

**请求：**

```bash
curl -X DELETE https://your-domain.com/api/{shortCode}
```

**响应：**

```json
{
  "success": true,
  "message": "短链接已删除"
}
```

## 项目结构

```
short-url/
├── public/
│   └── index.html        # Web 界面
├── functions/
│   ├── utils.js          # 工具函数
│   ├── [[path]].js       # 短链接重定向处理
│   └── api/
│       ├── shorten.js    # 创建短链接 API
│       ├── [code].js     # 删除短链接 API
│       └── info/
│           └── [code].js # 查询短链接信息 API
├── src/
│   └── index.js          # Worker 主文件（Workers 部署用）
├── package.json          # 项目配置
├── wrangler.toml         # Cloudflare 配置
└── README.md             # 项目文档
```

## 技术栈

- Cloudflare Pages/Workers - 边缘计算平台
- Cloudflare KV - 键值存储
- Wrangler - Cloudflare CLI 工具
- 原生 HTML/CSS/JavaScript - 前端界面

## 注意事项

1. Cloudflare KV 是最终一致性存储，写入后可能需要几秒钟才能在全球范围内生效
2. 免费版 Workers 有请求限制，详见 [Cloudflare 定价](https://workers.cloudflare.com/)
3. 建议为生产环境添加身份验证机制，防止滥用

## 许可证

MIT
