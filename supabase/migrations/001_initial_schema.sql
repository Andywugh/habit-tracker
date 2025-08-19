-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户配置表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Asia/Shanghai',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建习惯表
CREATE TABLE IF NOT EXISTS habits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎯',
  type TEXT CHECK (type IN ('positive', 'negative')) NOT NULL DEFAULT 'positive',
  frequency JSONB NOT NULL DEFAULT '{"type": "daily", "count": 1}',
  reminder_time TIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建习惯记录表
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_is_active ON habits(is_active);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_completed_at ON habit_logs(completed_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加更新时间触发器
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 设置行级安全策略 (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- 用户配置表的安全策略
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 习惯表的安全策略
CREATE POLICY "Users can view own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- 习惯记录表的安全策略
CREATE POLICY "Users can view own habit logs" ON habit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habit logs" ON habit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit logs" ON habit_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit logs" ON habit_logs
  FOR DELETE USING (auth.uid() = user_id);

-- 创建用于统计的视图
CREATE OR REPLACE VIEW habit_stats AS
SELECT 
  h.id,
  h.user_id,
  h.name,
  h.type,
  COUNT(hl.id) as total_completions,
  COUNT(CASE WHEN hl.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as completions_last_7_days,
  COUNT(CASE WHEN hl.completed_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as completions_last_30_days,
  MAX(hl.completed_at) as last_completion
FROM habits h
LEFT JOIN habit_logs hl ON h.id = hl.habit_id
WHERE h.is_active = true
GROUP BY h.id, h.user_id, h.name, h.type;

-- 创建函数：获取习惯连续天数
CREATE OR REPLACE FUNCTION get_habit_streak(habit_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  current_date_check DATE := CURRENT_DATE;
  log_exists BOOLEAN;
BEGIN
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM habit_logs 
      WHERE habit_id = habit_id_param 
      AND DATE(completed_at) = current_date_check
    ) INTO log_exists;
    
    IF log_exists THEN
      streak_count := streak_count + 1;
      current_date_check := current_date_check - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 插入一些示例数据（可选）
-- 注意：这些数据只有在开发环境中才应该插入
/*
INSERT INTO habits (user_id, name, icon, type, frequency) VALUES
  ('00000000-0000-0000-0000-000000000000', '每日阅读', '📚', 'positive', '{"type": "daily", "count": 1}'),
  ('00000000-0000-0000-0000-000000000000', '晨练', '🏃', 'positive', '{"type": "daily", "count": 1}'),
  ('00000000-0000-0000-0000-000000000000', '戒烟', '🚭', 'negative', '{"type": "daily", "count": 1}');
*/