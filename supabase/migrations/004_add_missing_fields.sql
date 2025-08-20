-- 添加缺失的字段到 habits 表
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 添加缺失的字段到 habit_logs 表
ALTER TABLE habit_logs 
ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT true;

-- 为新字段创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_completed ON habit_logs(completed);

-- 为已存在的记录填充 date 字段（基于 completed_at）
UPDATE habit_logs 
SET date = DATE(completed_at) 
WHERE date IS NULL;

-- 为已存在的记录设置 completed 为 true（因为已存在的记录都是完成的记录）
UPDATE habit_logs 
SET completed = true 
WHERE completed IS NULL;
