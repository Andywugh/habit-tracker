import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

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

        // 获取用户资料以个性化邮件
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("name")
            .eq("id", user.id)
            .single();

        const { data, error } = await resend.emails.send({
            from: "习惯追踪器 <welcome@your-verified-domain.com>",
            to: [user.email!],
            subject: "欢迎加入习惯追踪器！",
            html: `
            <h2>欢迎，${profile?.name || "用户"}！</h2>
            <p>感谢您注册我们的习惯追踪应用。</p>
            <p>开始您的习惯养成之旅，每天进步一点点！</p>
            <p>祝您使用愉快！</p>
          `,
        });

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Welcome email sent successfully",
            data,
        });
    } catch (error) {
        console.error("Send welcome email error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}