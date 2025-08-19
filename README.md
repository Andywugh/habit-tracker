# 习惯追踪器 (Habit Tracker)

一个现代化的习惯追踪Web应用，帮助用户建立和维持良好的生活习惯。

## 🚀 功能特性

- **习惯管理**: 创建、编辑和删除习惯
- **进度追踪**: 记录每日完成情况
- **连续天数**: 自动计算习惯坚持的连续天数
- **用户认证**: 安全的用户注册和登录系统
- **响应式设计**: 完美适配桌面和移动设备
- **实时同步**: 基于Supabase的实时数据同步

## 🛠️ 技术栈

- **前端**: React 18 + TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **UI组件**: Headless UI + Heroicons
- **后端**: Supabase (PostgreSQL + Auth + Real-time)
- **构建工具**: Vite
- **部署**: Vercel (推荐)

## 📦 安装和设置

### 1. 克隆项目

```bash
git clone <repository-url>
cd behavior_tracer
```

### 2. 安装依赖

```bash
pnpm install
# 或者
npm install
```

### 3. 设置环境变量

复制 `.env.example` 到 `.env.local` 并填入您的Supabase配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:5173
NODE_ENV=development
```

### 4. 设置Supabase数据库

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 在SQL编辑器中运行 `supabase-init.sql` 脚本
3. 确保启用了行级安全策略 (RLS)

### 5. 启动开发服务器

```bash
pnpm dev
# 或者
npm run dev
```

应用将在 `http://localhost:5173` 启动。

## 🗄️ 数据库结构

### 用户配置表 (user_profiles)
- `id`: 用户ID (关联auth.users)
- `name`: 用户姓名
- `avatar_url`: 头像URL
- `timezone`: 时区设置

### 习惯表 (habits)
- `id`: 习惯ID
- `user_id`: 用户ID
- `name`: 习惯名称
- `icon`: 习惯图标
- `type`: 习惯类型 (positive/negative)
- `frequency`: 频率设置 (JSON)
- `reminder_time`: 提醒时间
- `is_active`: 是否激活

### 习惯记录表 (habit_logs)
- `id`: 记录ID
- `habit_id`: 习惯ID
- `user_id`: 用户ID
- `completed_at`: 完成时间
- `notes`: 备注

## 🚀 部署

### Vercel部署 (推荐)

1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 设置环境变量
4. 部署

### 其他平台

项目支持部署到任何支持Node.js的平台：
- Netlify
- Railway
- Render
- 自托管服务器

## 📱 使用指南

### 创建习惯
1. 点击"添加习惯"按钮
2. 填写习惯名称和选择图标
3. 选择习惯类型（积极/消极）
4. 设置频率和提醒时间
5. 保存习惯

### 记录进度
1. 在习惯卡片上点击"标记完成"
2. 系统自动记录完成时间
3. 查看连续天数统计

### 管理习惯
- 编辑：点击习惯卡片上的编辑按钮
- 删除：点击删除按钮（软删除）

## 🔧 开发

### 项目结构

```
src/
├── components/          # React组件
│   ├── ui/             # 基础UI组件
│   ├── layout/         # 布局组件
│   ├── habits/         # 习惯相关组件
│   └── auth/           # 认证组件
├── store/              # Zustand状态管理
├── lib/                # 工具库和配置
└── types/              # TypeScript类型定义
```

### 可用脚本

```bash
# 开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview

# 类型检查
pnpm type-check

# 代码格式化
pnpm format
```

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 🆘 支持

如果您遇到问题或有建议，请：
1. 查看现有的Issues
2. 创建新的Issue
3. 联系开发团队

---

**开始您的习惯追踪之旅！** 🎯