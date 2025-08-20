import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

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

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "请选择图片文件" },
        { status: 400 }
      );
    }

    // 验证文件大小 (5MB限制)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "图片大小不能超过5MB" },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const fileExtension = file.name.split(".").pop();
    const fileName = `avatars/${user.id}-${Date.now()}.${fileExtension}`;

    // 上传到 R2
    const arrayBuffer = await file.arrayBuffer();
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileName,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
    });

    await r2.send(command);

    // 生成公共访问URL
    const publicUrl = `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.dev/${fileName}`;

    // 更新用户资料
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "头像上传成功",
      data: { url: publicUrl },
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
