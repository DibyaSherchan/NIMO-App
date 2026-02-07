import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb'; 
import Log from '@/models/Log'; 

/**
 * GET endpoint for retrieving system logs with filtering and pagination.
 * This is typically used by administrators to audit system activity.
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connectDB();

    // Parse query parameters from the URL
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d'; // Default to 7 days
    const page = parseInt(searchParams.get('page') || '1'); // Current page number
    const limit = parseInt(searchParams.get('limit') || '1000'); // Logs per page
    const action = searchParams.get('action'); // Filter by specific action type
    const userRole = searchParams.get('userRole'); // Filter by user role
    const now = new Date();
    
    // Calculate the start date based on the time range (e.g., '7d' = 7 days)
    const daysBack = parseInt(timeRange.replace('d', ''));
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Define the query interface for filtering logs
    interface LogQuery {
      timestamp: { $gte: Date };
      action?: string;
      userRole?: string;
    }

    // Build the query object with the time range filter
    const query: LogQuery = {
      timestamp: { $gte: startDate }
    };

    // Add optional filters if provided and not set to 'all'
    if (action && action !== 'all') {
      query.action = action;
    }

    if (userRole && userRole !== 'all') {
      query.userRole = userRole;
    }

    // Fetch logs from the database with pagination and sorting
    const logs = await Log.find(query)
      .sort({ timestamp: -1 }) // Sort by newest first
      .limit(limit) // Limit results per page
      .skip((page - 1) * limit) // Skip for pagination
      .populate('userId', 'name email') // Get user details
      .lean(); // Return plain JavaScript objects for better performance

    // Get total count for pagination info
    const totalCount = await Log.countDocuments(query);

    // Format the logs for the response (converting MongoDB objects to strings)
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

    // Return the paginated and formatted logs
    return NextResponse.json({
      logs: formattedLogs,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1
    });

  } catch (error) {
    // Log and handle any errors that occur during the process
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}