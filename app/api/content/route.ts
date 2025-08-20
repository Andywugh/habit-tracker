import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/content - 获取内容配置
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "general";

    const { data: content, error } = await supabase
      .from("app_content")
      .select("key, value")
      .eq("category", category);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // 转换为键值对对象
    const contentMap = content.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      success: true,
      data: contentMap,
    });
  } catch (error) {
    console.error("Get content error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/content - 更新内容配置
export async function PUT(request: NextRequest) {
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

    const { key, value, category = "general" } = await request.json();

    if (!key || !value) {
      return NextResponse.json(
        { success: false, error: "Key and value are required" },
        { status: 400 }
      );
    }

    // 更新或插入内容
    const { data, error } = await supabase
      .from("app_content")
      .upsert({
        key,
        value,
        category,
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Content updated successfully",
      data,
    });
  } catch (error) {
    console.error("Update content error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
