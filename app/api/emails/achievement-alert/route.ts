import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { AchievementAlertEmail } from "../../../../emails/AchievementAlertEmail";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 成就类型定义
type AchievementType = 
  | 'streak_milestone'
  | 'habit_completion'
  | 'weekly_goal'
  | 'monthly_goal'
  | 'first_habit'
  | 'consistency'
  | 'comeback';

// POST /api/emails/achievement-alert - 发送成就提醒邮件
export async function POST(request: NextRequest) {
  try {
    // 获取认证用户
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // 获取请求参数
    const { achievementType, habitId, milestone } = await request.json();

    // 获取用户资料
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // 获取用户通知设置
    const { data: notificationSettings } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // 检查是否启用了成就提醒
    if (notificationSettings && !notificationSettings.achievement_alerts) {
      return NextResponse.json({
        success: true,
        message: "Achievement alerts are disabled for this user",
        skipped: true
      });
    }

    // 获取成就相关的习惯信息（如果有）
    let habitName = undefined;
    if (habitId) {
      const { data: habit } = await supabase
        .from("habits")
        .select("name")
        .eq("id", habitId)
        .eq("user_id", user.id)
        .single();
      
      habitName = habit?.name;
    }

    // 获取用户统计信息
    const stats = await getUserStats(user.id);

    // 根据成就类型生成成就信息
    const achievement = generateAchievementInfo(
      achievementType || 'habit_completion',
      habitName,
      milestone
    );

    // 发送邮件
    const { data, error } = await resend.emails.send({
      from: "成就通知 <achievements@your-verified-domain.com>",
      to: [user.email!],
      subject: `🎉 ${profile?.name || "用户"}，你获得了新成就！`,
      react: AchievementAlertEmail({
        username: profile?.name || "用户",
        achievement,
        stats,
      }),
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Achievement alert email sent successfully",
      data: {
        emailId: data?.id,
        achievementType: achievement.type,
        achievementTitle: achievement.title
      }
    });

  } catch (error) {
    console.error("Achievement alert email error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 获取用户统计信息
async function getUserStats(userId: string) {
  try {
    // 获取总习惯数
    const { count: totalHabits } = await supabase
      .from("habits")
      .select("*", { count: 'exact' })
      .eq("user_id", userId)
      .eq("is_active", true);

    // 获取今天完成的习惯数
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const { count: completedToday } = await supabase
      .from("habit_logs")
      .select("*", { count: 'exact' })
      .eq("user_id", userId)
      .gte("completed_at", todayStart.toISOString())
      .lt("completed_at", todayEnd.toISOString());

    // 计算最长连续天数
    const { data: allLogs } = await supabase
      .from("habit_logs")
      .select("completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    let currentStreak = 0;
    if (allLogs && allLogs.length > 0) {
      // 简化的连续天数计算 - 基于completed_at日期
      const dates = allLogs.map(log => new Date(log.completed_at).toISOString().split('T')[0]).sort();
      let streak = 1;
      let maxStreak = 1;
      
      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 1;
        }
      }
      currentStreak = maxStreak;
    }

    return {
      totalHabits: totalHabits || 0,
      completedToday: completedToday || 0,
      currentStreak
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return {
      totalHabits: 0,
      completedToday: 0,
      currentStreak: 0
    };
  }
}

// 生成成就信息
function generateAchievementInfo(
  type: AchievementType,
  habitName?: string,
  milestone?: number
) {
  const achievements = {
    streak_milestone: {
      type: 'streak_milestone' as const,
      title: `${milestone || 7}天连续完成！`,
      description: `你已经连续${milestone || 7}天完成习惯，这是一个了不起的成就！坚持就是胜利！`,
      emoji: '🔥',
      habitName,
      milestone
    },
    habit_completion: {
      type: 'habit_completion' as const,
      title: '习惯完成成就！',
      description: '恭喜你完成了一个重要的习惯目标！每一次的坚持都让你更接近理想的自己。',
      emoji: '✅',
      habitName
    },
    weekly_goal: {
      type: 'weekly_goal' as const,
      title: '周目标达成！',
      description: '太棒了！你成功完成了本周的习惯目标。持续的努力正在带来积极的改变！',
      emoji: '🎯'
    },
    monthly_goal: {
      type: 'monthly_goal' as const,
      title: '月度目标达成！',
      description: '恭喜你完成了整个月的习惯挑战！这种坚持不懈的精神值得庆祝！',
      emoji: '🏆'
    },
    first_habit: {
      type: 'first_habit' as const,
      title: '第一个习惯！',
      description: '欢迎开始你的习惯养成之旅！每一个伟大的改变都始于第一步。',
      emoji: '🌱',
      habitName
    },
    consistency: {
      type: 'consistency' as const,
      title: '一致性大师！',
      description: '你展现了令人钦佩的一致性！规律的习惯是成功的基石。',
      emoji: '💪'
    },
    comeback: {
      type: 'comeback' as const,
      title: '重新出发！',
      description: '欢迎回来！重新开始需要勇气，你已经迈出了重要的一步！',
      emoji: '🎉'
    }
  };

  return achievements[type] || achievements.habit_completion;
}

// GET /api/emails/achievement-alert - 检查并触发成就
export async function GET(request: NextRequest) {
  try {
    // 获取认证用户
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // 检查用户是否有新的成就
    const achievements = await checkForNewAchievements(user.id);
    
    return NextResponse.json({
      success: true,
      achievements
    });

  } catch (error) {
    console.error("Check achievements error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 检查新成就
async function checkForNewAchievements(userId: string) {
  const achievements: any[] = [];
  
  try {
    // 检查连续天数成就
    const streakAchievements = await checkStreakAchievements(userId);
    achievements.push(...streakAchievements);
    
    // 检查其他类型的成就...
    // 这里可以添加更多成就检查逻辑
    
    return achievements;
  } catch (error) {
    console.error("Error checking achievements:", error);
    return [];
  }
}

// 检查连续天数成就
async function checkStreakAchievements(userId: string) {
  const achievements: any[] = [];
  const milestones = [7, 14, 30, 60, 100]; // 连续天数里程碑
  
  // 获取用户的活跃习惯
  const { data: habits } = await supabase
    .from("habits")
    .select("id, name")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!habits) return achievements;

  for (const habit of habits) {
    // 计算该习惯的连续天数
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("completed_at")
      .eq("habit_id", habit.id)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(100); // 限制查询数量

    if (logs && logs.length > 0) {
      let currentStreak = 0;
      const today = new Date();
      
      // 计算当前连续天数
      for (let i = 0; i < logs.length; i++) {
        const logDate = new Date(logs[i].completed_at);
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        
        if (logDate.toDateString() === expectedDate.toDateString()) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      // 检查是否达到里程碑
      for (const milestone of milestones) {
        if (currentStreak === milestone) {
          achievements.push({
            type: 'streak_milestone',
            habitId: habit.id,
            habitName: habit.name,
            milestone,
            triggered: false // 标记为未触发，需要发送邮件
          });
        }
      }
    }
  }
  
  return achievements;
}