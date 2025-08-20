import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

// 定义组件期望接收的 props 类型
interface WeeklySummaryEmailProps {
  username: string;
  habits: Array<{
    name: string;
    completedCount: number;
    totalDays: number;
    streak: number;
  }>;
}

export const WeeklySummaryEmail = ({
  username,
  habits,
}: WeeklySummaryEmailProps) => (
  <Html>
    <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f6f9fc" }}>
      <Container
        style={{
          border: "1px solid #eee",
          borderRadius: "5px",
          padding: "20px",
          margin: "40px auto",
          backgroundColor: "#ffffff",
        }}
      >
        <Heading style={{ color: "#333" }}>
          Hi {username}, 这是你的每周习惯总结！
        </Heading>
        <Text style={{ color: "#555" }}>本周你做得非常棒，继续保持！</Text>
        <Hr />
        {habits.map((habit, index) => (
          <div key={index}>
            <Text>
              <strong>{habit.name}</strong>: 本周完成 {habit.completedCount} 次
              {habit.streak > 0 && ` | 连续 ${habit.streak} 天`}
              {habit.completedCount >= 5 ? " 🎉" : ""}
            </Text>
          </div>
        ))}
        <Text style={{ marginTop: "20px", color: "#888", fontSize: "12px" }}>
          来自你的习惯追踪器
        </Text>
      </Container>
    </Body>
  </Html>
);
