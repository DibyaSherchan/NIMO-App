import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";

/**
 * Query structure for filtering applicants
 */
interface ApplicantQuery {
  $or?: Array<{
    [key: string]: { $regex: string; $options: string };
  }>;
  status?: string;
}

/**
 * Status count mapping
 */
interface StatusBreakdown {
  [key: string]: number;
}

/**
 * Request body for status update
 */
interface UpdateRequestBody {
  applicantId: string;
  status: string;
}

/**
 * @route   GET /api/applicants
 * @desc    Get paginated applicants with search and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Allow admin users only
    if (!session.user.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Connect to MongoDB
    await connectDB();

    // Read query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const query: ApplicantQuery = {};

    // Apply search filters
    if (search) {
      query.$or = [
        { applicantId: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Fetch applicants with pagination
    const applicants = await Applicant.find(query)
      .select('-biometricData -passportScan -medicalReport')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Total count for pagination
    const total = await Applicant.countDocuments(query);

    // Status-wise count
    const statusStats = await Applicant.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApplicants = await Applicant.countDocuments();

    // Convert status stats to object format
    const statusBreakdown: StatusBreakdown = statusStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as StatusBreakdown);

    // Final response payload
    const response = {
      applicants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total: totalApplicants,
        statusBreakdown
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    // Handle fetch errors
    console.error("Error fetching applicants:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * @route   PATCH /api/applicants
 * @desc    Update applicant status
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Allow admin users only
    if (!session.user.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Connect to MongoDB
    await connectDB();

    // Read request body
    const body: UpdateRequestBody = await request.json();
    const { applicantId, status } = body;

    // Validate input
    if (!applicantId || !status) {
      return NextResponse.json(
        { error: "Applicant ID and status are required" },
        { status: 400 }
      );
    }

    // Allowed status values
    const validStatuses: readonly string[] = [
      "pending",
      "under_review",
      "verified",
      "approved",
      "rejected"
    ] as const;

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Update applicant status
    const applicant = await Applicant.findOneAndUpdate(
      { applicantId },
      { status },
      { new: true }
    )
      .select('-biometricData -passportScan -medicalReport')
      .lean();

    if (!applicant) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      applicant
    });

  } catch (error) {
    // Handle update errors
    console.error("Error updating applicant status:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
