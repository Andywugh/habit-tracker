-- 创建用户通知设置表
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_reminder BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT true,
  achievement_alerts BOOLEAN DEFAULT true,
  reminder_time TEXT DEFAULT '09:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 启用行级安全策略
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能访问自己的通知设置
CREATE POLICY "Users can view own notification settings" ON user_notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON user_notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON user_notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification settings" ON user_notification_settings
  FOR DELETE USING (auth.uid() = user_id);

-- 授予权限
GRANT ALL PRIVILEGES ON user_notification_settings TO authenticated;
GRANT SELECT ON user_notification_settings TO anon;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id);