import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb'; 
import Log from '@/models/Log'; 

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const action = searchParams.get('action');
    const userRole = searchParams.get('userRole');
    const now = new Date();
    const daysBack = parseInt(timeRange.replace('d', ''));
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    interface LogQuery {
      timestamp: { $gte: Date };
      action?: string;
      userRole?: string;
    }

    const query: LogQuery = {
      timestamp: { $gte: startDate }
    };

    if (action && action !== 'all') {
      query.action = action;
    }

    if (userRole && userRole !== 'all') {
      query.userRole = userRole;
    }

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('userId', 'name email') 
      .lean();

    const totalCount = await Log.countDocuments(query);

    const formattedLogs = logs.map(log => ({
      _id: log._id.toString(),
      logId: log.logId,
      action: log.action,
      userId: log.userId?.toString(),
      userRole: log.userRole,
      userAgent: log.userAgent,
      details: log.details,
      timestamp: log.timestamp.toISOString(),
    }));

    return NextResponse.json({
      logs: formattedLogs,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}