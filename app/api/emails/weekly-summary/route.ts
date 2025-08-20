import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { WeeklySummaryEmail } from "../../../../emails/WeeklySummaryEmail";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
            return NextResponse.json(
                { success: false, error: "No token provided" },
                { status: 401 }
            );
        }

        // 验证用户身份
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: "Invalid token" },
                { status: 401 }
            );
        }

        // 获取用户资料
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("name")
            .eq("id", user.id)
            .single();

        // 获取用户的习惯数据
        const { data: userHabits } = await supabase
            .from("habits")
            .select("id, name")
            .eq("user_id", user.id)
            .eq("is_active", true);

        // 获取过去7天的习惯记录
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data: habitLogs } = await supabase
            .from("habit_logs")
            .select("habit_id, date, completed")
            .eq("user_id", user.id)
            .gte("date", sevenDaysAgo.toISOString().split('T')[0])
            .eq("completed", true);

        // 计算每个习惯的完成情况和连续天数
        const habits = userHabits?.map((habit) => {
            const habitLogsForHabit = habitLogs?.filter(log => log.habit_id === habit.id) || [];
            const completedCount = habitLogsForHabit.length;
            
            // 计算连续天数（简化版本）
            let streak = 0;
            const today = new Date();
            for (let i = 0; i < 30; i++) { // 检查最近30天
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                const dateStr = checkDate.toISOString().split('T')[0];
                
                const hasLog = habitLogs?.some(log => 
                    log.habit_id === habit.id && 
                    log.date === dateStr && 
                    log.completed
                );
                
                if (hasLog) {
                    streak++;
                } else {
                    break;
                }
            }
            
            return {
                name: habit.name,
                completedCount,
                totalDays: 7,
                streak
            };
        }) || [];

        const { data, error } = await resend.emails.send({
            from: "每周报告 <reports@your-verified-domain.com>",
            to: [user.email!],
            subject: `📅 ${profile?.name || "用户"}，你的每周习惯报告来啦！`,
            react: WeeklySummaryEmail({
                username: profile?.name || "用户",
                habits,
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
            message: "Weekly summary sent successfully",
            data,
        });
    } catch (error) {
        console.error("Send weekly summary error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}