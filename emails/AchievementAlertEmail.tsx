import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Button,
} from "@react-email/components";
import * as React from "react";

// 定义成就类型
type AchievementType = 
  | 'streak_milestone' // 连续天数里程碑
  | 'habit_completion' // 习惯完成度
  | 'weekly_goal' // 周目标达成
  | 'monthly_goal' // 月目标达成
  | 'first_habit' // 第一个习惯
  | 'consistency' // 一致性成就
  | 'comeback'; // 重新开始

// 定义组件期望接收的 props 类型
interface AchievementAlertEmailProps {
  username: string;
  achievement: {
    type: AchievementType;
    title: string;
    description: string;
    habitName?: string;
    milestone?: number;
    emoji?: string;
  };
  stats?: {
    totalHabits: number;
    completedToday: number;
    currentStreak: number;
  };
}

// 获取成就对应的emoji和颜色
function getAchievementStyle(type: AchievementType) {
  const styles = {
    streak_milestone: { emoji: '🔥', color: '#f59e0b', bgColor: '#fef3c7' },
    habit_completion: { emoji: '✅', color: '#10b981', bgColor: '#d1fae5' },
    weekly_goal: { emoji: '🎯', color: '#8b5cf6', bgColor: '#ede9fe' },
    monthly_goal: { emoji: '🏆', color: '#f59e0b', bgColor: '#fef3c7' },
    first_habit: { emoji: '🌱', color: '#10b981', bgColor: '#d1fae5' },
    consistency: { emoji: '💪', color: '#3b82f6', bgColor: '#dbeafe' },
    comeback: { emoji: '🎉', color: '#ec4899', bgColor: '#fce7f3' }
  };
  return styles[type] || styles.habit_completion;
}

export const AchievementAlertEmail = ({
  username,
  achievement,
  stats,
}: AchievementAlertEmailProps) => {
  const style = getAchievementStyle(achievement.type);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <Html>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f6f9fc" }}>
        <Container
          style={{
            border: "1px solid #eee",
            borderRadius: "5px",
            padding: "20px",
            margin: "40px auto",
            backgroundColor: "#ffffff",
            maxWidth: "600px",
          }}
        >
          {/* 成就标题 */}
          <div style={{
            textAlign: "center",
            padding: "20px",
            backgroundColor: style.bgColor,
            borderRadius: "8px",
            marginBottom: "20px"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>
              {achievement.emoji || style.emoji}
            </div>
            <Heading style={{ 
              color: style.color, 
              margin: "0",
              fontSize: "24px"
            }}>
              恭喜你，{username}！
            </Heading>
          </div>

          {/* 成就详情 */}
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <Heading as="h2" style={{ 
              color: "#333", 
              fontSize: "20px",
              margin: "0 0 10px 0"
            }}>
              {achievement.title}
            </Heading>
            <Text style={{ 
              color: "#666", 
              fontSize: "16px",
              lineHeight: "1.5",
              margin: "0"
            }}>
              {achievement.description}
            </Text>
          </div>

          {/* 习惯名称（如果有） */}
          {achievement.habitName && (
            <div style={{
              textAlign: "center",
              padding: "15px",
              backgroundColor: "#f8fafc",
              borderRadius: "6px",
              marginBottom: "20px"
            }}>
              <Text style={{ 
                color: "#374151", 
                fontSize: "16px",
                fontWeight: "bold",
                margin: "0"
              }}>
                习惯：{achievement.habitName}
              </Text>
              {achievement.milestone && (
                <Text style={{ 
                  color: style.color, 
                  fontSize: "18px",
                  fontWeight: "bold",
                  margin: "5px 0 0 0"
                }}>
                  {achievement.milestone} 天连续完成！
                </Text>
              )}
            </div>
          )}

          <Hr style={{ margin: "30px 0" }} />

          {/* 统计信息 */}
          {stats && (
            <div style={{ marginBottom: "30px" }}>
              <Heading as="h3" style={{ 
                color: "#374151", 
                fontSize: "16px",
                textAlign: "center",
                marginBottom: "15px"
              }}>
                📊 你的习惯统计
              </Heading>
              <div style={{
                display: "flex",
                justifyContent: "space-around",
                textAlign: "center",
                padding: "15px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px"
              }}>
                <div>
                  <Text style={{ 
                    color: "#6b7280", 
                    fontSize: "12px",
                    margin: "0 0 5px 0"
                  }}>
                    总习惯数
                  </Text>
                  <Text style={{ 
                    color: "#374151", 
                    fontSize: "18px",
                    fontWeight: "bold",
                    margin: "0"
                  }}>
                    {stats.totalHabits}
                  </Text>
                </div>
                <div>
                  <Text style={{ 
                    color: "#6b7280", 
                    fontSize: "12px",
                    margin: "0 0 5px 0"
                  }}>
                    今日完成
                  </Text>
                  <Text style={{ 
                    color: "#10b981", 
                    fontSize: "18px",
                    fontWeight: "bold",
                    margin: "0"
                  }}>
                    {stats.completedToday}
                  </Text>
                </div>
                <div>
                  <Text style={{ 
                    color: "#6b7280", 
                    fontSize: "12px",
                    margin: "0 0 5px 0"
                  }}>
                    最长连续
                  </Text>
                  <Text style={{ 
                    color: "#f59e0b", 
                    fontSize: "18px",
                    fontWeight: "bold",
                    margin: "0"
                  }}>
                    {stats.currentStreak}
                  </Text>
                </div>
              </div>
            </div>
          )}

          {/* 鼓励文字 */}
          <div style={{
            textAlign: "center",
            padding: "20px",
            backgroundColor: "#f0fdf4",
            borderRadius: "6px",
            marginBottom: "30px"
          }}>
            <Text style={{ 
              color: "#166534", 
              fontSize: "16px",
              fontWeight: "500",
              margin: "0"
            }}>
              🌟 坚持就是胜利！每一个小进步都值得庆祝！
            </Text>
          </div>

          {/* 行动按钮 */}
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <Button
              href={`${appUrl}/habits`}
              style={{
                backgroundColor: style.color,
                color: "white",
                padding: "12px 24px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "bold",
                marginRight: "10px"
              }}
            >
              查看我的习惯
            </Button>
            <Button
              href={`${appUrl}/history`}
              style={{
                backgroundColor: "#6b7280",
                color: "white",
                padding: "12px 24px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "bold"
              }}
            >
              查看历史记录
            </Button>
          </div>

          <Hr style={{ margin: "30px 0 20px 0" }} />
          
          <Text style={{ 
            color: "#888", 
            fontSize: "14px", 
            textAlign: "center",
            fontStyle: "italic"
          }}>
            💫 "成功不是终点，失败不是末日，继续前进的勇气才最可贵。"
          </Text>
          
          <Text style={{ 
            marginTop: "20px", 
            color: "#888", 
            fontSize: "12px", 
            textAlign: "center" 
          }}>
            来自你的习惯追踪器 | 
            <a href={`${appUrl}/settings`} style={{ color: "#10b981" }}>
              管理通知设置
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};