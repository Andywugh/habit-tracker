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

// 定义组件期望接收的 props 类型
interface DailyReminderEmailProps {
  username: string;
  todayHabits: Array<{
    id: string;
    name: string;
    description?: string;
    streak: number;
    isCompleted: boolean;
  }>;
  reminderTime?: string;
}

const DailyReminderEmail = ({
  username,
  todayHabits,
  reminderTime,
}: DailyReminderEmailProps) => {
  const pendingHabits = todayHabits.filter(habit => !habit.isCompleted);
  const completedHabits = todayHabits.filter(habit => habit.isCompleted);
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
          <Heading style={{ color: "#333", textAlign: "center" }}>
            🌅 早安，{username}！
          </Heading>
          
          <Text style={{ color: "#555", fontSize: "16px", lineHeight: "1.5" }}>
            新的一天开始了！让我们一起回顾今天的习惯目标吧。
          </Text>

          {reminderTime && (
            <Text style={{ color: "#888", fontSize: "14px", fontStyle: "italic" }}>
              提醒时间：{reminderTime}
            </Text>
          )}

          <Hr style={{ margin: "20px 0" }} />

          {/* 已完成的习惯 */}
          {completedHabits.length > 0 && (
            <>
              <Heading as="h2" style={{ color: "#10b981", fontSize: "18px" }}>
                ✅ 已完成的习惯
              </Heading>
              {completedHabits.map((habit, index) => (
                <div key={index} style={{ marginBottom: "10px" }}>
                  <Text style={{ color: "#10b981", margin: "5px 0" }}>
                    <strong>{habit.name}</strong>
                    {habit.streak > 0 && ` | 连续 ${habit.streak} 天 🔥`}
                  </Text>
                  {habit.description && (
                    <Text style={{ color: "#666", fontSize: "14px", margin: "0 0 10px 20px" }}>
                      {habit.description}
                    </Text>
                  )}
                </div>
              ))}
              <Hr style={{ margin: "20px 0" }} />
            </>
          )}

          {/* 待完成的习惯 */}
          {pendingHabits.length > 0 ? (
            <>
              <Heading as="h2" style={{ color: "#f59e0b", fontSize: "18px" }}>
                ⏰ 今日待完成
              </Heading>
              {pendingHabits.map((habit, index) => (
                <div key={index} style={{ marginBottom: "15px" }}>
                  <Text style={{ color: "#333", margin: "5px 0" }}>
                    <strong>{habit.name}</strong>
                    {habit.streak > 0 && ` | 当前连续 ${habit.streak} 天`}
                  </Text>
                  {habit.description && (
                    <Text style={{ color: "#666", fontSize: "14px", margin: "0 0 10px 20px" }}>
                      {habit.description}
                    </Text>
                  )}
                </div>
              ))}
              
              <div style={{ textAlign: "center", margin: "30px 0" }}>
                <Button
                  href={`${appUrl}/habits`}
                  style={{
                    backgroundColor: "#10b981",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  立即记录习惯
                </Button>
              </div>
            </>
          ) : (
            <>
              <Heading as="h2" style={{ color: "#10b981", fontSize: "18px" }}>
                🎉 太棒了！
              </Heading>
              <Text style={{ color: "#10b981", fontSize: "16px" }}>
                你今天的所有习惯都已完成！继续保持这个好势头！
              </Text>
            </>
          )}

          <Hr style={{ margin: "30px 0 20px 0" }} />
          
          <Text style={{ color: "#888", fontSize: "14px", textAlign: "center" }}>
            💪 每一个小习惯都是通向更好自己的一步
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

export default DailyReminderEmail;