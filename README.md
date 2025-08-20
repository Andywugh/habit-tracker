# 习惯追踪器 (Habit Tracker)

一个现代化的习惯追踪Web应用，帮助用户建立和维持良好的生活习惯。

## 🚀 功能特性

- **习惯管理**: 创建、编辑和删除习惯
- **进度追踪**: 记录每日完成情况
- **连续天数**: 自动计算习惯坚持的连续天数
- **用户认证**: 安全的用户注册和登录系统
- **头像上传**: 支持用户头像上传到Cloudflare R2
- **内容管理**: 动态内容管理系统
- **邮件通知**: 成就提醒、每日提醒和周报功能
- **响应式设计**: 完美适配桌面和移动设备
- **实时同步**: 基于Supabase的实时数据同步

## 🛠️ 技术栈

- **前端**: Next.js 14 + React 18 + TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **UI组件**: Headless UI + Heroicons
- **后端**: Supabase (PostgreSQL + Auth + Real-time)
- **文件存储**: Cloudflare R2
- **邮件服务**: React Email + Resend
- **部署**: Vercel (推荐)

## 📦 安装和设置

### 1. 克隆项目

```bash
git clone <repository-url>
cd behavior_tracer
```

### 2. 安装依赖

```bash
npm install
```

### 3. 设置环境变量

创建 `.env.local` 文件并添加以下配置：

```env
# Supabase 配置 (必需)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare R2 配置 (头像上传功能)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_REGION=auto

# Next.js 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# Resend 配置
RESEND_API_KEY=your_resend_access_key

# 应用配置
APP_NAME=行为追踪器
APP_URL=http://localhost:3000
```

#### 获取配置信息：

**Supabase配置：**
1. 登录 [Supabase](https://supabase.com)
2. 选择您的项目
3. 在设置 > API 中找到项目URL和anon key

**Cloudflare R2配置：**
1. 登录 [Cloudflare](https://cloudflare.com)
2. 创建R2存储桶
3. 在R2 > 管理API令牌中创建访问密钥
4. 获取Account ID、Access Key ID和Secret Access Key

### 4. 设置Supabase数据库

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 在SQL编辑器中运行 `supabase-init.sql` 脚本
3. 确保启用了行级安全策略 (RLS)

### 5. 运行数据库迁移

在Supabase控制台的SQL编辑器中按顺序执行以下迁移文件：
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_update_user_profiles.sql`
3. `supabase/migrations/003_create_user_notification_settings.sql`
4. `supabase/migrations/004_add_missing_fields.sql`
5. `supabase/migrations/005_add_content_management.sql`

### 6. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

## 🗄️ 数据库结构

### 用户配置表 (user_profiles)
- `id`: 用户ID (关联auth.users)
- `name`: 用户姓名
- `avatar_url`: 头像URL
- `timezone`: 时区设置
- `notification_enabled`: 通知开关

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

### 用户通知设置表 (user_notification_settings)
- `user_id`: 用户ID
- `email_daily_reminder`: 每日提醒邮件
- `email_weekly_summary`: 周报邮件
- `email_achievement_alerts`: 成就提醒邮件
- `push_reminder`: 推送提醒
- `reminder_time`: 提醒时间

### 内容管理表 (app_content)
- `id`: 内容ID
- `key`: 内容键名
- `value`: 内容值
- `category`: 内容分类
- `description`: 内容描述

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
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 类型检查
npm run check

# 代码检查
npm run lint
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