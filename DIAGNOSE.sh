#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 短链接项目部署诊断 ===${NC}\n"

# 检查 1: public/index.html 是否存在
echo -e "${BLUE}检查 1: public/index.html 文件${NC}"
if [ -f "public/index.html" ]; then
    echo -e "${GREEN}✅ 文件存在${NC}"
    filesize=$(wc -c < public/index.html)
    echo "   文件大小: $filesize 字节"
    if grep -q "短链接服务" public/index.html; then
        echo -e "${GREEN}✅ 文件包含正确内容${NC}"
    else
        echo -e "${RED}❌ 文件内容不正确${NC}"
    fi
else
    echo -e "${RED}❌ 文件不存在${NC}"
fi

echo ""

# 检查 2: 文件是否被 Git 追踪
echo -e "${BLUE}检查 2: Git 追踪状态${NC}"
if git ls-files | grep -q "public/index.html"; then
    echo -e "${GREEN}✅ public/index.html 已被 Git 追踪${NC}"
else
    echo -e "${RED}❌ public/index.html 未被 Git 追踪${NC}"
    echo "   需要运行: git add public/index.html"
fi

echo ""

# 检查 3: .gitignore 配置
echo -e "${BLUE}检查 3: .gitignore 配置${NC}"
if grep -q "^public/$" .gitignore || grep -q "^public/\*$" .gitignore; then
    echo -e "${RED}❌ .gitignore 中有 'public/' 规则，导致文件被忽略${NC}"
    echo "   需要从 .gitignore 删除相关行"
else
    echo -e "${GREEN}✅ .gitignore 配置正确${NC}"
fi

echo ""

# 检查 4: functions 目录
echo -e "${BLUE}检查 4: functions 目录结构${NC}"
if [ -d "functions" ]; then
    echo -e "${GREEN}✅ functions 目录存在${NC}"
    filecount=$(find functions -type f | wc -l)
    echo "   包含 $filecount 个文件:"
    find functions -type f -name "*.js" | sed 's/^/   /'
else
    echo -e "${RED}❌ functions 目录不存在${NC}"
fi

echo ""

# 检查 5: 最新的 Git 提交
echo -e "${BLUE}检查 5: Git 提交历史${NC}"
echo "最近 3 个提交:"
git log --oneline -3 | sed 's/^/   /'

echo ""
echo "涉及 public/index.html 的提交:"
git log --oneline -- public/index.html | head -3 | sed 's/^/   /'

echo ""

# 检查 6: 当前 Git 状态
echo -e "${BLUE}检查 6: 当前 Git 状态${NC}"
if git status --porcelain | grep -q .; then
    echo -e "${YELLOW}⚠️  有未提交的更改:${NC}"
    git status --short | sed 's/^/   /'
    echo ""
    echo "需要运行:"
    echo "   git add ."
    echo "   git commit -m 'your message'"
    echo "   git push origin main"
else
    echo -e "${GREEN}✅ 工作目录干净，所有更改已提交${NC}"
fi

echo ""

# 检查 7: wrangler.toml
echo -e "${BLUE}检查 7: wrangler.toml 配置${NC}"
if grep -q "^name = \"short-url\"" wrangler.toml; then
    echo -e "${GREEN}✅ wrangler.toml 存在且配置正确${NC}"
else
    echo -e "${YELLOW}⚠️  wrangler.toml 可能配置不当${NC}"
fi

echo ""

# 检查 8: package.json
echo -e "${BLUE}检查 8: package.json${NC}"
if grep -q "\"short-url\"" package.json; then
    echo -e "${GREEN}✅ package.json 存在${NC}"
    if grep -q "\"dev\":" package.json; then
        echo -e "${GREEN}✅ 包含 dev 脚本${NC}"
    fi
else
    echo -e "${RED}❌ package.json 不存在或内容不对${NC}"
fi

echo ""
echo -e "${BLUE}=== 诊断完成 ===${NC}"
echo ""
echo -e "${YELLOW}接下来的步骤:${NC}"
echo "1. 如果有 ❌ 错误，参考 TROUBLESHOOTING.md"
echo "2. 如果有 ⚠️ 警告，确认是否需要修复"
echo "3. 确保所有检查都是 ✅，然后："
echo "   git push origin main"
echo "4. 访问 Cloudflare Dashboard 检查部署状态"
echo "5. 如果仍有问题，查看 QUICK_FIX.md"
