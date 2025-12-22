# 完整排查指南：仍显示 "Hello world"

你已经配置正确但仍然显示 "Hello world"？跟着这个指南逐步排查。

---

## 🔍 第一步：验证 Git 关联

最常见的问题：**没有真正部署新代码**

### 检查 Dashboard 上的部署状态

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers and Pages** → **Pages**
3. 选择 **short-url** 项目
4. 找到 **Deployments** 标签

**关键信息**：
- 最新部署的状态是什么？（✅ Success / ⏳ Building / ❌ Failed）
- 部署时间是什么时候？（应该是你最近推送代码的时间）
- 点开最新部署，查看 **Build logs**

---

### 常见问题：

**症状 A：显示一个很久之前的部署**
```
Deployment 1 hour ago ← 这个太久了
Deployment 3 weeks ago
Deployment 1 month ago
```

**原因**：Git 仓库没有关联，或者代码没有推送

**解决**：
1. 检查代码是否推送到 GitHub
   ```bash
   git log --oneline -5
   git status
   ```
2. 确认 git branch 是 `main`
   ```bash
   git branch
   ```
3. 推送最新代码
   ```bash
   git push origin main
   ```
4. 等待 5-10 分钟，Dashboard 应该会自动触发新部署

---

**症状 B：部署显示失败 ❌**
```
Last deployment
Failed 2 minutes ago ✗
```

**查看错误日志**：
1. 点击失败的部署
2. 展开 **Build logs**
3. 找到红色的错误信息

**常见错误和修复**：

| 错误信息 | 原因 | 修复 |
|---------|------|------|
| `Directory not found: public` | Build output directory 写错了 | 改为 `public`（不要 `/public`）|
| `Cannot find module` | 缺少依赖 | 运行 `npm install` 并推送 `package-lock.json` |
| `Command not found` | Build command 有问题 | 改为留空 |
| `Build script failed` | package.json 的 scripts 有问题 | 检查 scripts，删除错误的命令 |

---

**症状 C：部署成功 ✅ 但仍显示 "Hello world"**

继续往下看 👇

---

## 🔍 第二步：验证文件是否被部署

### 方法 1：使用 Wrangler 检查

```bash
# 列出 Pages 项目信息
wrangler pages list

# 查看最新部署的文件
wrangler pages deployment list --project-name short-url
```

### 方法 2：浏览器开发者工具

1. 访问你的 Pages 域名（例如 `https://short-url.pages.dev`）
2. 打开浏览器开发者工具（F12）
3. 进入 **Network** 标签
4. 刷新页面
5. 查找第一个请求（通常是 index.html）
   - 状态码应该是 `200`
   - 响应内容应该包含 "短链接服务" 和 "API 文档"（不是 "Hello world"）

**如果看到 "Hello world" 的响应**：
- 说明服务器返回的确实是默认页面
- 这通常意味着 `public/index.html` 没有被正确部署

---

## 🔍 第三步：清除缓存并强制刷新

### 浏览器缓存

```
Windows: Ctrl + Shift + R
Mac:     Cmd + Shift + R
```

### CloudFlare 缓存

1. Dashboard → 你的域名 → Caching
2. 点击 **Purge Cache** → **Purge Everything**
3. 等待 1-2 分钟

---

## 🔍 第四步：验证代码是否被推送

检查你本地的代码是否包含 `public/index.html`

```bash
# 查看 public/ 目录
ls -la public/

# 预期输出：
# public/
# └── index.html

# 验证 index.html 包含短链接文档
grep "短链接服务" public/index.html
# 应该输出: <title>短链接服务</title>
```

如果文件存在：

```bash
# 检查是否被 Git 追踪
git ls-files | grep public/index.html

# 预期输出：
# public/index.html

# 如果没有输出，说明文件被 .gitignore 忽略了
cat .gitignore | grep public
```

---

## 🔍 第五步：检查 .gitignore

如果 `public/index.html` 被忽略了，需要修改 `.gitignore`

```bash
cat .gitignore
```

检查是否有这些规则：
```
public/
public/*
/public
```

**如果有这些规则**，需要删除或修改：

```bash
# 编辑 .gitignore，删除 "public/" 相关的行
# 保留其他必要的忽略规则（如 node_modules/）
```

然后重新推送代码：
```bash
git add .gitignore public/index.html
git commit -m "fix: ensure public/index.html is tracked by git"
git push origin main
```

---

## 🔍 第六步：完整的重新部署

如果上面的步骤都检查了还是不行，尝试完整重新部署：

### 方案 A：使用 Wrangler CLI

```bash
# 1. 确保代码是最新的
git pull origin main

# 2. 部署到 Pages
wrangler pages deploy public

# 3. 选择项目：short-url

# 4. 等待部署完成（1-2 分钟）
```

### 方案 B：在 Dashboard 手动重新部署

1. Dashboard → Pages → short-url
2. Deployments 标签
3. 点击最近的部署（即使是成功的）
4. 找到 "Redeploy" 按钮
5. 点击重新部署

### 方案 C：删除并重建 Pages 项目（终极方案）

1. Dashboard → Pages → short-url → Settings
2. 向下滚动找到 "Delete project"
3. 删除项目
4. 重新创建 Pages 项目
5. 重新配置 Build settings：
   - Framework: None
   - Build command: （留空）
   - Build output directory: public
6. 部署

---

## 🔍 第七步：验证完整部署

部署完成后，访问你的 Pages 域名，检查以下内容：

### ✅ 应该看到：
- 页面标题：**"短链接服务"**（不是 "Hello world"）
- 大标题：**"🔗 短链接服务"**
- 紫色渐变背景
- API 文档说明
- "创建短链接"、"访问短链接" 等部分

### ❌ 不应该看到：
- "Hello world"
- "Welcome to Cloudflare Pages"
- 空白页面
- 404 错误

---

## 📋 完整检查清单

按顺序检查：

- [ ] 1. Dashboard 上最新部署状态是 ✅ Success
- [ ] 2. 最新部署时间是几分钟内（不是几周前）
- [ ] 3. 查看 Build logs，没有红色错误
- [ ] 4. 浏览器硬刷新（Ctrl+Shift+R）
- [ ] 5. Cloudflare 缓存已清除（Purge Cache）
- [ ] 6. 本地文件 `public/index.html` 存在
- [ ] 7. `public/index.html` 已被 Git 追踪（不在 .gitignore 中）
- [ ] 8. 最新代码已推送到 GitHub（`git push origin main`）
- [ ] 9. 访问 Pages 域名，看到的是短链接服务页面

所有项目都勾选后，刷新浏览器，应该看到正确的页面。

---

## 仍然无法解决？

如果上面的步骤都试过了还是不行，收集以下信息：

1. **Pages Dashboard 的截图**（Deployments 部分）
2. **Build logs 的错误信息**（如果有的话）
3. **本地命令输出**：
   ```bash
   git log --oneline -3
   git branch
   ls -la public/
   grep "短链接服务" public/index.html
   ```
4. **浏览器开发者工具** → Network → index.html 的响应内容

---

## 快速参考

| 问题 | 最可能的原因 | 快速修复 |
|------|----------|--------|
| 显示 "Hello world" | Build output directory 不对 | 改为 `public` 并 Redeploy |
| 部署失败 | 构建命令有问题 | 改为留空 |
| 没有新部署 | 代码没有推送 | `git push origin main` |
| public/index.html 被忽略 | .gitignore 配置错误 | 修改 .gitignore，重新推送 |
| 部署了但还是旧页面 | 缓存问题 | Ctrl+Shift+R 硬刷新 + Purge Cache |
