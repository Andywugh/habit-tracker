import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import DailyReminderEmail from "../../../../emails/DailyReminderEmail";

// Create admin client for service role operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/emails/daily-reminder - 发送日常提醒邮件
export async function POST(request: NextRequest) {
  try {
    let user;
    let userId;
    
    // Check if using service role key authentication
    const authHeader = request.headers.get('authorization');
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (authHeader && authHeader === `Bearer ${serviceRoleKey}`) {
      // Service role authentication - get user_id from request body
      const body = await request.json();
      userId = body.user_id;
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Missing user_id in request body for service role authentication' },
          { status: 400 }
        );
      }
      
      // Use admin client to get user by ID
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      user = userData.user;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // Regular user token authentication
      const token = authHeader.split(' ')[1];
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
      
      user = authUser;
      userId = user.id;
    } else {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Use appropriate client based on authentication method
    const dbClient = authHeader && authHeader === `Bearer ${serviceRoleKey}` ? supabaseAdmin : supabase;

    // 获取用户资料
    const { data: profile } = await dbClient
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // 获取用户通知设置
    const { data: notificationSettings } = await dbClient
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    // 检查是否启用了日常提醒
    if (notificationSettings && !notificationSettings.daily_reminder) {
      return NextResponse.json({
        success: true,
        message: "Daily reminder is disabled for this user",
        skipped: true
      });
    }

    // 获取用户的习惯
    const { data: habits, error: habitsError } = await dbClient
      .from("habits")
      .select(`
        id,
        name,
        frequency,
        created_at
      `)
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (habitsError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch habits" },
        { status: 500 }
      );
    }

    if (!habits || habits.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active habits found for user",
        skipped: true
      });
    }

    // 获取今天的日期
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // 获取今天的习惯记录
    const { data: todayLogs } = await dbClient
      .from("habit_logs")
      .select("habit_id, completed_at")
      .eq("user_id", userId)
      .gte("completed_at", todayStart.toISOString())
      .lt("completed_at", todayEnd.toISOString());

    // 计算每个习惯的连续天数
    const habitsWithStreaks = await Promise.all(
      habits.map(async (habit) => {
        // 获取该习惯的所有记录，按完成时间倒序
        const { data: logs } = await dbClient
          .from("habit_logs")
          .select("completed_at")
          .eq("habit_id", habit.id)
          .eq("user_id", userId)
          .order("completed_at", { ascending: false });

        // 计算连续天数 - 简化版本，只计算总记录数作为"连续天数"
        let streak = 0;
        if (logs && logs.length > 0) {
          // 获取最近7天的记录来计算连续天数
          const recentLogs = logs.slice(0, 7);
          const today = new Date();
          
          for (let i = 0; i < 7; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const checkDateStart = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
            const checkDateEnd = new Date(checkDateStart);
            checkDateEnd.setDate(checkDateEnd.getDate() + 1);
            
            const hasLogForDay = logs.some(log => {
              const logDate = new Date(log.completed_at);
              return logDate >= checkDateStart && logDate < checkDateEnd;
            });
            
            if (hasLogForDay) {
              streak++;
            } else {
              break;
            }
          }
        }

        // 检查今天是否已完成
        const todayLog = todayLogs?.find(log => log.habit_id === habit.id);
        const isCompleted = !!todayLog;

        return {
          id: habit.id,
          name: habit.name,
          description: '', // 暂时为空，因为数据库中没有这个字段
          streak,
          isCompleted
        };
      })
    );

    // 过滤出今天需要执行的习惯（根据频率）
    const todayHabits = habitsWithStreaks.filter(habit => {
      const habitData = habits.find(h => h.id === habit.id);
      if (!habitData?.frequency) return true; // 默认每日
      
      const frequency = habitData.frequency;
      if (frequency.type === 'daily') return true;
      
      if (frequency.type === 'weekly' && frequency.days) {
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
        return frequency.days.includes(dayOfWeek);
      }
      
      return true; // 默认包含
    });

    if (todayHabits.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No habits scheduled for today",
        skipped: true
      });
    }

    // 发送邮件
    const { data, error } = await resend.emails.send({
      from: "习惯提醒 <onboarding@resend.dev>", // 使用Resend的测试域名
      to: [user.email!],
      subject: `🌅 ${profile?.name || "用户"}，新的一天开始了！`,
      text: `早安，${profile?.name || "用户"}！

新的一天开始了！让我们一起回顾今天的习惯目标吧。

今天的习惯：
${todayHabits.map(h => `${h.isCompleted ? '✅' : '⏰'} ${h.name}${h.streak > 0 ? ` (连续${h.streak}天)` : ''}`).join('\n')}

${todayHabits.filter(h => !h.isCompleted).length > 0 ? 
  `还有 ${todayHabits.filter(h => !h.isCompleted).length} 个习惯待完成，继续加油！` : 
  '太棒了！今天的所有习惯都已完成！'
}

💪 每一个小习惯都是通向更好自己的一步

来自你的习惯追踪器`,
    });

    if (error) {
      console.error("Resend email error:", error);
      return NextResponse.json(
        { success: false, error: `Email sending failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Daily reminder email sent successfully",
      data: {
        emailId: data?.id,
        habitsCount: todayHabits.length,
        completedCount: todayHabits.filter(h => h.isCompleted).length,
        pendingCount: todayHabits.filter(h => !h.isCompleted).length
      }
    });

  } catch (error) {
    console.error("Daily reminder email error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}