import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/notifications/trigger - 触发消息推送
export async function POST(request: NextRequest) {
  try {
    const { type, user_id, data } = await request.json();

    // 验证必需参数
    if (!type) {
      return NextResponse.json(
        { success: false, error: "Notification type is required" },
        { status: 400 }
      );
    }

    // 如果指定了用户ID，则为该用户发送通知
    if (user_id) {
      const result = await sendNotificationToUser(user_id, type, data);
      return NextResponse.json(result);
    }

    // 如果没有指定用户ID，则根据类型为所有符合条件的用户发送通知
    const result = await sendNotificationToAllUsers(type, data);
    return NextResponse.json(result);

  } catch (error) {
    console.error("Trigger notification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 为指定用户发送通知
async function sendNotificationToUser(userId: string, type: string, data?: any) {
  try {
    // 获取用户通知设置
    const { data: settings } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    // 获取用户信息
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // 根据通知类型和用户设置决定是否发送
    const shouldSend = shouldSendNotification(type, settings);
    
    if (!shouldSend) {
      return { 
        success: true, 
        message: "Notification skipped based on user preferences",
        skipped: true 
      };
    }

    // 发送通知
    const result = await sendNotificationByType(user, type, data);
    return result;

  } catch (error) {
    console.error("Send notification to user error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Detailed error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

// 为所有用户发送通知
async function sendNotificationToAllUsers(type: string, data?: any) {
  try {
    // 获取所有启用了该类型通知的用户
    const { data: users } = await getEligibleUsers(type);
    
    if (!users || users.length === 0) {
      return { 
        success: true, 
        message: "No eligible users found",
        sent: 0 
      };
    }

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    // 为每个用户发送通知
    for (const userSettings of users) {
      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(userSettings.user_id);
        
        if (user) {
          const result = await sendNotificationByType(user, type, data);
          if (result.success) {
            successCount++;
          } else {
            failureCount++;
            errors.push({ userId: user.id, error: result.error });
          }
        }
      } catch (error) {
        failureCount++;
        errors.push({ userId: userSettings.user_id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return {
      success: true,
      message: `Notifications sent to ${successCount} users, ${failureCount} failed`,
      sent: successCount,
      failed: failureCount,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error("Send notification to all users error:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// 根据通知类型获取符合条件的用户
async function getEligibleUsers(type: string) {
  let query = supabase.from("user_notification_settings").select("*");

  switch (type) {
    case "daily_reminder":
      query = query.eq("daily_reminder", true);
      break;
    case "weekly_summary":
      query = query.eq("weekly_summary", true);
      break;
    case "achievement_alert":
      query = query.eq("achievement_alerts", true);
      break;
    case "welcome":
      // 欢迎邮件不需要特定设置，返回所有用户
      break;
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }

  return await query;
}

// 判断是否应该发送通知
function shouldSendNotification(type: string, settings: any) {
  if (!settings) {
    // 如果没有设置，使用默认值
    return true;
  }

  switch (type) {
    case "daily_reminder":
      return settings.daily_reminder;
    case "weekly_summary":
      return settings.weekly_summary;
    case "achievement_alert":
      return settings.achievement_alerts;
    case "welcome":
      return true; // 欢迎邮件总是发送
    default:
      return false;
  }
}

// 根据类型发送通知
async function sendNotificationByType(user: any, type: string, data?: any) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const token = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    let endpoint = "";
    
    switch (type) {
      case "welcome":
        endpoint = `${baseUrl}/api/emails/welcome`;
        break;
      case "weekly_summary":
        endpoint = `${baseUrl}/api/emails/weekly-summary`;
        break;
      case "daily_reminder":
        endpoint = `${baseUrl}/api/emails/daily-reminder`;
        break;
      case "achievement_alert":
        endpoint = `${baseUrl}/api/emails/achievement-alert`;
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    // 使用服务角色密钥直接调用API，不需要用户会话
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        ...data,
        user_id: user.id
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error(`API response error for ${type}:`, {
        status: response.status,
        statusText: response.statusText,
        result
      });
      throw new Error(result.error || result.details || `Failed to send notification (${response.status})`);
    }

    return {
      success: true,
      message: `${type} notification sent successfully`,
      data: result.data
    };

  } catch (error) {
    console.error(`Send ${type} notification error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Detailed ${type} error:`, errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
}