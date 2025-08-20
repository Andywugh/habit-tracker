-- 创建内容管理数据表
CREATE TABLE IF NOT EXISTS app_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加更新时间触发器
CREATE TRIGGER update_app_content_updated_at
  BEFORE UPDATE ON app_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 设置行级安全策略 (RLS)
ALTER TABLE app_content ENABLE ROW LEVEL SECURITY;

-- 允许所有认证用户读取内容
CREATE POLICY "Anyone can view app content" ON app_content
  FOR SELECT USING (true);

-- 只允许管理员用户修改内容（暂时允许所有认证用户）
CREATE POLICY "Authenticated users can modify content" ON app_content
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 插入一些示例内容
INSERT INTO app_content (key, value, category) VALUES 
  ('page_title', '设置', 'settings'),
  ('profile_section_title', '用户资料', 'settings'),
  ('notification_section_title', '通知设置', 'settings'),
  ('habits_page_title', '我的习惯', 'habits'),
  ('analytics_page_title', '数据分析', 'analytics'),
  ('welcome_message', '欢迎使用行为追踪器！', 'general'),
  ('footer_text', '© 2024 行为追踪器. 保留所有权利。', 'general')
ON CONFLICT (key) DO NOTHING;
