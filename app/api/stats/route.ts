import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/stats - 获取用户统计数据
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // 默认30天
    const habitId = searchParams.get('habit_id');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    const startDateStr = startDate.toISOString().split('T')[0];

    // 获取用户的活跃习惯
    let habitsQuery = supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (habitId) {
      habitsQuery = habitsQuery.eq('id', habitId);
    }

    const { data: habits, error: habitsError } = await habitsQuery;

    if (habitsError) {
      return NextResponse.json(
        { success: false, error: habitsError.message },
        { status: 400 }
      );
    }

    if (!habits || habits.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalHabits: 0,
          completedToday: 0,
          completionRate: 0,
          streaks: [],
          weeklyStats: [],
          monthlyStats: [],
        },
      });
    }

    // 获取指定时间段内的记录
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_at', startDateStr)
      .in('habit_id', habits.map(h => h.id));

    if (logsError) {
      return NextResponse.json(
        { success: false, error: logsError.message },
        { status: 400 }
      );
    }

    // 计算今日完成情况
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs?.filter(log => 
      log.completed_at && typeof log.completed_at === 'string' && log.completed_at.startsWith(today)
    ) || [];

    // 计算每个习惯的连续天数
    const streaks = await Promise.all(
      habits.map(async (habit) => {
        const { data: streakData, error: streakError } = await supabase
          .rpc('get_habit_streak', { habit_id_param: habit.id });
        
        return {
          habitId: habit.id,
          habitName: habit.name,
          habitIcon: habit.icon,
          streak: streakData || 0,
        };
      })
    );

    // 计算周统计（最近7天）
    const weeklyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = logs?.filter(log => 
        log.completed_at && typeof log.completed_at === 'string' && log.completed_at.startsWith(dateStr)
      ) || [];
      
      weeklyStats.push({
        date: dateStr,
        completed: dayLogs.length,
        total: habits.length,
        completionRate: habits.length > 0 ? (dayLogs.length / habits.length) * 100 : 0,
      });
    }

    // 计算月统计（最近30天，按周分组）
    const monthlyStats = [];
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (week * 7 + 6));
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (week * 7));
      
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      const weekLogs = logs?.filter(log => {
        if (!log.completed_at || typeof log.completed_at !== 'string') return false;
        try {
          const logDate = log.completed_at.split('T')[0];
          return logDate >= weekStartStr && logDate <= weekEndStr;
        } catch (error) {
          console.warn('Invalid date format in stats:', log.completed_at);
          return false;
        }
      }) || [];
      
      monthlyStats.unshift({
        week: `Week ${4 - week}`,
        startDate: weekStartStr,
        endDate: weekEndStr,
        completed: weekLogs.length,
        total: habits.length * 7, // 7天
        completionRate: habits.length > 0 ? (weekLogs.length / (habits.length * 7)) * 100 : 0,
      });
    }

    // 计算总体完成率
    const totalPossible = habits.length * parseInt(period);
    const totalCompleted = logs?.length || 0;
    const overallCompletionRate = totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalHabits: habits.length,
        completedToday: todayLogs.length,
        completionRate: overallCompletionRate,
        streaks,
        weeklyStats,
        monthlyStats,
        period: parseInt(period),
        totalLogs: totalCompleted,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}