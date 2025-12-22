# 部署调试检查清单

## 本地诊断 (2 分钟)

```bash
# 运行诊断脚本
./DIAGNOSE.sh
```

**预期结果**：所有检查都是 ✅ 绿色

如果有 ❌ 红色或 ⚠️ 黄色，按照脚本的建议修复。

---

## 确保代码已推送 (1 分钟)

```bash
# 查看本地提交
git log --oneline -3

# 查看远程分支
git branch -vv

# 推送到 GitHub
git push origin main
```

**预期结果**：
```
* main -> origin/main [up to date]
```

---

## Cloudflare Dashboard 检查 (3-5 分钟)

### 步骤 1：进入项目

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单 → **Workers and Pages**
3. 点击 **Pages**
4. 选择 **short-url** 项目

### 步骤 2：检查部署状态

**Deployments** 标签：

```
Latest deployments

✅ Deployment #15 - Success
   Deployed just now (1 minute)
   Commit: cba714e docs: add detailed build settings...
   
⏳ Deployment #14 - Building...
   (should finish in ~1 minute)

❌ Deployment #13 - Failed
   (click to view build logs)
```

**检查清单**：
- [ ] 最新部署的时间是最近 5 分钟内
- [ ] 最新部署的状态是 ✅ Success（不是 ⏳ Building 或 ❌ Failed）
- [ ] 最新部署的 Commit 是你刚推送的代码

如果部署时间太久（超过 1 小时），说明 Git 没有关联。重新关联：
1. Settings → Git → 断开连接并重新连接
2. 或者用 Wrangler CLI 部署：`wrangler pages deploy public`

### 步骤 3：检查构建设置

**Settings** → **Build and deployments**：

```
Build settings
┌─────────────────────────────────────────────┐
│ Framework preset:     None                  │
│ Build command:        (empty)               │
│ Build output directory: public              │
└─────────────────────────────────────────────┘
```

**检查清单**：
- [ ] Framework preset = `None`
- [ ] Build command = 空（不要填任何东西）
- [ ] Build output directory = `public`（不是 `/public` 或 `./public`）

如果不对，修改后点 **Save** 然后 **Redeploy**。

### 步骤 4：检查 KV 绑定

**Settings** → **Functions**：

```
KV namespace bindings
┌──────────────────────────────────────────────┐
│ Variable name: URL_STORE                     │
│ KV namespace: url_store (production)         │
└──────────────────────────────────────────────┘
```

**检查清单**：
- [ ] 有一行 binding，Variable name = `URL_STORE`
- [ ] 指向的 KV namespace 不是空的

如果没有 binding：
1. 点击 **Add binding**
2. Variable name 填 `URL_STORE`
3. 从列表选择你的 KV namespace（如果没有，先在 KV 管理处创建）
4. 点 **Save**
5. 点 **Redeploy**

---

## 浏览器测试 (2 分钟)

### 步骤 1：硬刷新

访问你的 Pages 域名（例如 `https://short-url.pages.dev`），然后：

```
Windows: Ctrl + Shift + R
Mac:     Cmd + Shift + R
```

**预期**：看到紫色背景的 "短链接服务" 页面

**如果还是显示 "Hello world"**：
1. 打开浏览器开发者工具 (F12)
2. 进入 **Network** 标签
3. 刷新页面
4. 点击第一个请求（通常是域名本身）
5. 查看 **Response** 标签
   - 应该包含 `<title>短链接服务</title>`
   - 如果看到 "Hello world" 或 `<!DOCTYPE html>` 后面什么都没有，说明是 Cloudflare 默认页面

### 步骤 2：清除 Cloudflare 缓存

如果浏览器硬刷新后还是老页面：

1. Dashboard → 你的域名 → **Caching** （或 **Overview** → **Purge Cache**）
2. 点 **Purge Cache** → **Purge Everything**
3. 等待 1-2 分钟
4. 再次访问，硬刷新

---

## 常见问题快速修复

### 症状 1：显示 "Hello world"

```
问题可能：
1. Build output directory 不对
2. 部署的不是最新代码
3. Cloudflare 缓存

快速修复：
1. 检查 Build output directory = public ✓
2. 确认最新部署时间 ✓
3. Purge Cache ✓
4. Ctrl + Shift + R 硬刷新 ✓
```

### 症状 2：部署失败 ❌

```
查看 Build logs 中的错误，常见错误：

"Cannot find module"
→ 删除 node_modules，运行 npm install，重新推送

"Build output directory not found"
→ 改为 public

"Build script failed"
→ Build command 改为空
```

### 症状 3：API 无法使用（返回 404）

```
可能原因：KV namespace 没有绑定

修复：
1. Settings → Functions
2. 添加 KV namespace binding
3. Variable name: URL_STORE
4. 选择 KV namespace
5. Redeploy
```

### 症状 4：部分页面加载失败

```
可能原因：有些文件被上传漏掉

修复：
1. 检查 public/ 目录中的所有文件都被上传
2. 检查 functions/ 中的代码没有语法错误
3. 查看 Build logs 有没有警告

运行：
npm run dev  # 本地测试
```

---

## 完整排查流程（如果还是不行）

```
1. 运行诊断脚本
   ./DIAGNOSE.sh
   ↓
   有 ❌？→ 修复 → 推送 → 等待部署

2. 检查 Dashboard
   Deployments → 最新部署状态
   ↓
   Failed？→ 查看 Build logs → 修复错误 → Redeploy
   Success？→ 继续

3. 检查构建设置
   Settings → Build settings
   ↓
   不对？→ 修改 → Save → Redeploy

4. 检查 KV 绑定
   Settings → Functions
   ↓
   缺少 binding？→ 添加 → Save → Redeploy

5. 浏览器测试
   访问域名 → Ctrl + Shift + R
   ↓
   还是 "Hello world"？→ 继续下一步

6. 清除缓存
   Dashboard → Purge Cache → Purge Everything
   → 等待 2 分钟 → 重新访问

7. 检查响应内容
   F12 → Network → 查看 Response
   ↓
   不是短链接服务？→ 查看 TROUBLESHOOTING.md 详细版
```

---

## 最后的核弹选项

如果前面的步骤都试过了还是不行：

### 方案 A：使用 Wrangler 强制部署

```bash
npm install -g @cloudflare/wrangler
wrangler pages deploy public
# 选择你的 short-url 项目
# 等待部署完成
```

### 方案 B：删除后重建（核弹）

```bash
# 1. 删除 Pages 项目（Dashboard → Settings → Delete）

# 2. 创建新的 Pages 项目
# - 连接 Git
# - Build settings: None, 空, public
# - 部署

# 3. 添加 KV 绑定
# - Settings → Functions → Add binding
# - URL_STORE → 选择 KV namespace

# 4. 重新部署
# - 点 Redeploy
```

---

## 需要帮助？

- 本地诊断问题 → 运行 `./DIAGNOSE.sh`
- "Hello world" 问题 → 看 `QUICK_FIX.md`
- 详细排查 → 看 `TROUBLESHOOTING.md`
- 构建设置 → 看 `BUILD_SETTINGS_REFERENCE.md`
- 部署步骤 → 看 `DEPLOYMENT.md`
- API 使用 → 看 `README.md`
