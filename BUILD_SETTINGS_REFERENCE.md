# Cloudflare Pages 构建设置参考

## 本项目的正确设置

### 问题排查

这个项目是**纯静态 + 函数**的混合部署，不需要传统的构建过程。

```
┌─ Git 仓库
│
├─ public/           ← 输出目录指向这里
│  └─ index.html     ← 静态网页
│
├─ functions/        ← Cloudflare Pages Functions（自动处理）
│  ├── api/
│  │   ├── shorten.js
│  │   └── [code].js
│  └── [[path]].js
│
└─ wrangler.toml     ← 项目配置（Pages 会自动读取）
```

### 三个字段的正确填法

#### 1️⃣ Build command（构建命令）

| 情况 | 填什么 | 为什么 |
|------|-------|-------|
| **推荐** | **留空**（什么都不填） | 项目没有前端编译步骤，静态文件直接用 |
| 替代方案 1 | `echo "skip"` | 如果系统要求必填，填一个无操作命令 |
| 替代方案 2 | `npm install` | 仅安装依赖，不编译（不推荐） |
| ❌ 错误 | `npm run build` | 项目没有 build 脚本，会导致部署失败 |

**推荐方案：留空**

---

#### 2️⃣ Build output directory（输出目录）

| 路径 | ✅/❌ | 说明 |
|------|------|------|
| `public` | ✅ | **推荐** - 相对路径，指向仓库根目录下的 public 文件夹 |
| `/public` | ❌ | 错误 - 前导斜杠表示绝对路径，会找不到目录 |
| `./public` | ⚠️ | 可能有问题 - 有些系统不支持 `./ 前缀，改为 `public` |
| `.` | ❌ | 错误 - 会使用仓库根目录，导致 functions 也被部署 |
| `dist` | ❌ | 错误 - 项目没有 dist 文件夹 |

**推荐方案：`public`**

```
你的仓库结构：
short-url/
├── public/          ← 这个目录（相对路径：public）
│   └── index.html
├── functions/
└── wrangler.toml

→ 在 Dashboard 填：public
```

---

#### 3️⃣ Framework preset（框架）

| 选项 | ✅/❌ | 说明 |
|------|------|------|
| **None**（无） | ✅ | **推荐** - 项目是原生 HTML/JS，没有框架 |
| Next.js | ❌ | 项目不是 Next.js |
| React | ❌ | 项目不是 React SPA |
| Vue | ❌ | 项目不是 Vue 项目 |
| Hugo/Jekyll | ❌ | 项目不是静态网站生成器 |

**推荐方案：`None`**

---

## 完整对照表

```
┌─────────────────────────────────────────────────────────┐
│          Cloudflare Pages Build Settings                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Framework preset: [None ▼]  ✅ 选"无"                  │
│                                                         │
│  Build command: [____________]  ✅ 留空                  │
│                                                         │
│  Build output directory: [public_____]  ✅ 就是这个      │
│                                                         │
│                      [Save] [Cancel]                    │
└─────────────────────────────────────────────────────────┘
```

---

## 如果设置错了

### 症状 1: 显示 "Hello world"

**原因**：Build output directory 不对

**修复**：
1. Dashboard → Pages 项目 → Settings → Build settings
2. Build output directory 改为 `public`
3. 点击 Save
4. 重新部署（Redeploy）

---

### 症状 2: 显示 "Page not found" 或 404

**原因**：同上，输出目录设置错误

**修复**：
1. 检查 Build output directory 是否为 `public`（不是 `/public`）
2. 检查 Build command 是否为空
3. 在 Dashboard 点击最新部署，查看 Build logs

---

### 症状 3: 部署失败，错误日志显示 "npm: command not found"

**原因**：Build command 试图运行不存在的脚本

**修复**：
1. 清空 Build command，改为留空
2. 重新部署

---

### 症状 4: 部署成功但 API 无法使用

**原因**：可能不是构建设置问题，检查 KV 绑定

**修复**：
1. Pages 项目 → Settings → Functions
2. 确认 KV namespace bindings 有 `URL_STORE`
3. 如果没有，点击 "Add binding"
4. Variable name: `URL_STORE`，选择你的 KV 命名空间
5. 重新部署

---

## Pages vs Workers 部署对比

| 方面 | Pages | Workers |
|------|-------|---------|
| Build command | 留空 | N/A（不需要） |
| Build output | `public` | N/A |
| 前端页面 | ✅ 支持（public/） | ❌ 不支持 |
| API Functions | ✅ 支持（functions/） | ✅ 支持（src/） |
| KV 存储 | ✅ 支持 | ✅ 支持 |
| 部署方式 | Git 或 CLI | wrangler deploy |
| 推荐用途 | 全栈应用 | API only |

---

## 快速检查清单

在 Dashboard 设置前，确认你了解这些：

- [ ] 明白 `public` 是相对路径（不需要斜杠）
- [ ] 明白 Build command 应该留空
- [ ] 明白 Framework preset 应该选 None
- [ ] 明白项目包含静态页面（public/）和 API（functions/）
- [ ] 明白需要配置 KV 绑定才能用 API

---

## 需要帮助？

1. 看不懂 Dashboard？→ 查看 QUICK_FIX.md
2. API 无法使用？→ 检查 KV 绑定
3. 仍有问题？→ 查看 DEPLOYMENT.md 的故障排除部分
