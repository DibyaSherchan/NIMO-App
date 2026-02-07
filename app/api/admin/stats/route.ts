import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import Applicant from '@/models/Applicant';
import { connectDB } from '@/lib/mongodb';

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();

    // Read time range from query params
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';

    const now = new Date();
    const startDate = new Date();

    // Set start date based on selected time range
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    // User role distribution
    const userRoleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Applicant status counts
    const totalApplicants = await Applicant.countDocuments();
    const pendingApplicants = await Applicant.countDocuments({ status: 'pending' });
    const approvedApplicants = await Applicant.countDocuments({ status: 'approved' });
    const rejectedApplicants = await Applicant.countDocuments({ status: 'rejected' });

    // Applicant status distribution
    const applicantStatusDistribution = await Applicant.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Regional distribution of applicants
    const regionalDistribution = await Applicant.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          region: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // User growth over time
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Applicant growth over time
    const applicantGrowth = await Applicant.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Recently added applicants
    const recentApplicants = await Applicant.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('applicantId firstName lastName email status paymentStatus region createdAt')
      .lean();

    // Monthly application count for current year
    const monthlyApplications = await Applicant.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(now.getFullYear(), 0, 1),
            $lte: now
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          month: {
            $let: {
              vars: {
                monthsInString: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              },
              in: {
                $arrayElemAt: ['$$monthsInString', '$_id']
              }
            }
          },
          count: 1,
          _id: 0
        }
      }
    ]);

    // Final dashboard response
    const stats = {
      totalUsers,
      totalApplicants,
      activeUsers,
      pendingApplicants,
      approvedApplicants,
      rejectedApplicants,
      userGrowth,
      applicantGrowth,
      applicantStatusDistribution,
      userRoleDistribution,
      regionalDistribution,
      recentApplicants,
      monthlyApplications
    };

    return NextResponse.json(stats);
  } catch (error) {
    // Handle dashboard errors
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
