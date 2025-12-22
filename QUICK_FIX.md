# 快速修复：部署后显示 "Hello world"

如果你部署到 Cloudflare Pages 后，主页显示 "Hello world"，说明**构建输出目录设置错误**。

## 解决方案

### 步骤 1：检查 Pages 项目设置

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers and Pages** → **Pages**
3. 选择你的 **short-url** 项目
4. 点击 **Settings**

### 步骤 2：修正构建设置

在 **Settings** 页面，找到 **Build settings** 部分：

```
Build command:        （留空 - 不要填写任何内容）
Build output directory: public
Framework preset:      None
```

**重要检查项：**
- ✅ Build output directory = `public`（必须）
- ✅ Build command = 空（留空）
- ✅ Framework preset = `None`

### 步骤 3：重新部署

选择以下任意方式：

**方式 A：手动触发部署**
1. 在 Pages 项目页面，找到 **Deployments**
2. 点击最近的部署 → **Redeploy**

**方式 B：推送代码重新部署**
```bash
git add .
git commit -m "update configuration"
git push origin main
```

**方式 C：使用 Wrangler 部署**
```bash
npm install -g @cloudflare/wrangler
wrangler pages deploy public
```

### 步骤 4：验证部署

部署完成后，访问你的 Pages 域名，应该看到美化的 API 文档页面，而不是 "Hello world"。

---

## 常见问题

**Q: 为什么还是显示 "Hello world"？**

A: 可能是缓存问题。可以尝试：
- 硬刷新（Ctrl+Shift+R 或 Cmd+Shift+R）
- 清除浏览器缓存
- 等待 5-10 分钟让 Pages 完全部署

**Q: 部署了新代码但没生效？**

A: 检查 Pages 项目的 **Deployments** 标签，确保最新部署的状态是 ✅ **Success**，而不是 ⏳ **Building** 或 ❌ **Failed**。

**Q: API 无法使用怎么办？**

A: 检查 KV 命名空间绑定：
1. Pages 项目 → Settings → Functions
2. 确认 KV namespace bindings 中：
   - Variable name = `URL_STORE`
   - KV namespace = 你创建的命名空间

如果没有绑定，点击 **Add binding** 添加。

---

## 调试建议

如果问题仍未解决，可以检查部署日志：

1. 进入 Pages 项目 → **Deployments**
2. 点击最新部署，查看 **Build logs**
3. 查找任何错误消息

常见错误：
- `Page not found` - 确认构建输出目录设置
- `KV binding error` - 确认 KV 命名空间绑定
- `Function error` - 检查 `/functions` 代码是否有语法错误

---

## 快速检查清单

部署前确认：

- [ ] GitHub 代码已推送
- [ ] Cloudflare Pages 已关联 Git 仓库
- [ ] **构建输出目录** = `public`
- [ ] **构建命令** = 空
- [ ] KV 命名空间已创建和绑定
- [ ] Pages 项目部署状态 = ✅ Success

所有项都勾选后，访问 Pages 域名应该就能看到正确的页面了。
