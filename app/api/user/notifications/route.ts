import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/user/notifications - 获取用户通知设置
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // 获取用户通知设置
    const { data: settings, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // 如果没有设置记录，返回默认设置
    const defaultSettings = {
      user_id: user.id,
      daily_reminder: true,
      weekly_summary: true,
      achievement_alerts: true,
      reminder_time: '09:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: settings || defaultSettings,
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/user/notifications - 更新用户通知设置
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { daily_reminder, weekly_summary, achievement_alerts, reminder_time } = await request.json();

    // 尝试更新现有设置
    const { data: updatedSettings, error: updateError } = await supabase
      .from('user_notification_settings')
      .update({
        daily_reminder,
        weekly_summary,
        achievement_alerts,
        reminder_time,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    // 如果更新失败（记录不存在），则创建新记录
    if (updateError && updateError.code === 'PGRST116') {
      const { data: newSettings, error: insertError } = await supabase
        .from('user_notification_settings')
        .insert({
          user_id: user.id,
          daily_reminder,
          weekly_summary,
          achievement_alerts,
          reminder_time,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Notification settings created successfully',
        data: newSettings,
      });
    }

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: updatedSettings,
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}