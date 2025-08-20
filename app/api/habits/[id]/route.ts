import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 验证用户身份和权限
async function validateUserAndHabit(request: NextRequest, habitId: string) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return { error: 'No token provided', status: 401 };
  }

  // 验证用户身份
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return { error: 'Invalid token', status: 401 };
  }

  // 验证习惯所有权
  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single();

  if (habitError || !habit) {
    return { error: 'Habit not found or access denied', status: 404 };
  }

  return { user, habit };
}

// GET /api/habits/[id] - 获取单个习惯
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const habitId = params.id;
    const result = await validateUserAndHabit(request, habitId);
    
    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    // 获取习惯的连续天数
    const { data: streakData, error: streakError } = await supabase
      .rpc('get_habit_streak', { habit_id_param: habitId });

    // 获取习惯的完成记录
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .order('completed_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        habit: result.habit,
        streak: streakData || 0,
        logs: logs || [],
      },
    });
  } catch (error) {
    console.error('Get habit error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/habits/[id] - 更新习惯
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const habitId = params.id;
    const result = await validateUserAndHabit(request, habitId);
    
    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const { name, icon, type, frequency, reminder_time, is_active } = await request.json();
    
    // 更新习惯
    const { data: updatedHabit, error } = await supabase
      .from('habits')
      .update({
        name,
        icon,
        type,
        frequency,
        reminder_time,
        is_active,
        updated_at: new Date(),
      })
      .eq('id', habitId)
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
      message: 'Habit updated successfully',
      data: updatedHabit,
    });
  } catch (error) {
    console.error('Update habit error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/habits/[id] - 删除习惯
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const habitId = params.id;
    const result = await validateUserAndHabit(request, habitId);
    
    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    // 删除习惯
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Habit deleted successfully',
    });
  } catch (error) {
    console.error('Delete habit error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}