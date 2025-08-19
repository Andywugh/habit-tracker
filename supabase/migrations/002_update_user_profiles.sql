-- 添加缺失的字段到user_profiles表
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';

-- 确保anon和authenticated角色有适当的权限
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;