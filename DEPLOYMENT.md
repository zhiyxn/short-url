# Cloudflare Pages 部署指南

## 前置条件

- 已有 Cloudflare 账户
- 已安装 Node.js 和 npm
- 已安装 Wrangler CLI: `npm install -g @cloudflare/wrangler`

## 部署步骤

### 1. 创建 KV Namespace

在 Cloudflare Dashboard 中：
1. 进入 Workers 和 Pages → KV
2. 创建命名空间 `url_store`（生产环境）
3. 可选：创建 `url_store_preview`（预览环境）
4. 记录下命名空间 ID

### 2. 更新配置文件

编辑 `wrangler.toml`，填入：

```toml
account_id = "your_account_id"  # 从 CF Dashboard 获取

[[kv_namespaces]]
binding = "URL_STORE"
id = "your_kv_namespace_id"           # 生产环境 ID
preview_id = "your_preview_namespace_id"  # 预览环境 ID（可选）
```

### 3. 关联 Git 仓库（推荐方法）

1. 将代码推送到 GitHub/GitLab
2. 在 Cloudflare Dashboard 创建新的 Pages 项目
3. 选择 "连接 Git"
4. 授权并选择此仓库
5. **构建设置**（重要）：
   - 框架：`无`
   - 构建命令：（留空）
   - 构建输出目录：`public`
6. **环境变量配置**（在 Pages 项目设置中）：
   - 进入项目 → 设置 → 函数
   - 添加 KV 命名空间绑定：
     - 变量名：`URL_STORE`
     - KV 命名空间：选择上面创建的命名空间

### 4. 本地部署（可选）

如需本地测试或直接部署：

```bash
# 测试本地环境
wrangler pages dev public --compatibility-date=2024-01-01

# 部署到 Pages
wrangler pages deploy public
```

## 项目结构

```
short-url/
├── functions/          # Cloudflare Pages 函数路由
│   ├── [[path]].js    # 通配符路由（处理短链接重定向）
│   ├── api/
│   │   ├── shorten.js     # POST /api/shorten - 创建短链接
│   │   ├── [code].js      # GET/DELETE /api/{code} - 获取/删除
│   │   └── info/
│   │       └── [code].js  # GET /api/info/{code} - 获取信息（备选）
│   └── utils.js        # 共享工具函数
├── public/
│   └── index.html      # 主页面
├── wrangler.toml       # Wrangler 配置
└── package.json        # 项目配置
```

## 路由映射

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/shorten` | 创建短链接 |
| GET | `/api/{code}` | 获取短链接信息 |
| DELETE | `/api/{code}` | 删除短链接 |
| GET | `/{code}` | 重定向到原始 URL |
| GET | `/` | 显示 API 文档 |

## 注意事项

### 路由优先级

Cloudflare Pages 的路由优先级（从高到低）：
1. 具体路径：`/api/shorten`
2. 参数化路由：`/api/[code]`、`/api/info/[code]`
3. 通配符路由：`/[[path]]`

当前配置中：
- `/api/shorten` - 由 `functions/api/shorten.js` 处理
- `/api/{code}` - 由 `functions/api/[code].js` 处理（GET/DELETE）
- `/{code}` - 由 `functions/[[path]].js` 处理（重定向）

### 删除重复的处理器

`functions/api/info/[code].js` 现已被 `functions/api/[code].js` 的 `onRequestGet` 函数替代。可选择保留或删除。

### 自定义域名

部署后，在 Cloudflare Pages 项目设置中：
1. 进入 "自定义域名"
2. 添加你的域名或使用 Pages 默认域名
3. 配置 DNS 记录

## 测试 API

部署完成后，测试各个端点：

```bash
# 创建短链接
curl -X POST https://your-domain.com/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# 获取短链接信息
curl https://your-domain.com/api/abc123

# 删除短链接
curl -X DELETE https://your-domain.com/api/abc123

# 访问短链接（重定向）
curl -L https://your-domain.com/abc123
```

## 故障排除

| 问题 | 解决方案 |
|------|--------|
| 404 错误 | 检查 KV 命名空间是否正确绑定，命名空间 ID 是否正确 |
| 无法创建短链接 | 确认 KV 命名空间有读写权限，检查请求格式 |
| 重定向失败 | 检查原始 URL 是否有效，查看浏览器控制台错误 |
| CORS 错误 | CORS 已配置允许所有来源，若仍有问题检查浏览器安全策略 |

## 更新部署

每次代码变更后：

### 如果使用 Git 方式部署：
只需推送到连接的仓库，Pages 会自动构建部署

```bash
git add .
git commit -m "update short-url service"
git push origin main
```

### 如果使用 Wrangler 部署：
```bash
wrangler pages deploy public
```

## 更多信息

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [KV 文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
