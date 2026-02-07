import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import MedicalReport from "@/models/MedicalReport";
import Applicant from "@/models/Applicant";

/**
 * Query structure for filtering medical reports
 */
interface ReportQuery {
  $or?: Array<{
    [key: string]: { $regex: string; $options: string };
  }>;
  reportType?: string;
}

/**
 * Medical report document shape
 */
interface ReportDocument {
  _id: string;
  reportId: string;
  applicantId: string;
  reportType: string;
  testResults: Record<string, unknown>;
  doctorRemarks?: string;
  physicalExamination?: {
    height?: string;
    weight?: string;
    bloodPressure?: string;
    pulse?: string;
    temperature?: string;
  };
  specialTests?: {
    chestXRay?: string;
    ecg?: string;
    vision?: string;
    hearing?: string;
    urineTest?: string;
    stoolTest?: string;
    pregnancyTest?: string;
  };
  vaccinationStatus?: string;
  createdAt: Date;
}

/**
 * @route   GET /api/medical-reports
 * @desc    Get paginated medical reports with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    // Debug auth info (can be removed in production)
    console.log('=== AUTH DEBUG ===');
    console.log('Session exists:', !!session);
    console.log('User:', session?.user);
    console.log('User role:', session?.user?.role);
    console.log('==================');

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Allow admin and medical organization roles
    const allowedRoles = ['admin', 'medical_organization'];
    const userRole = session.user.role?.toLowerCase();

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log('Access denied. User role:', session.user.role);
      return NextResponse.json(
        {
          error: `Forbidden - Your role (${session.user.role}) is not authorized. Required: admin or medical_organization`
        },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Read query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const reportType = searchParams.get('reportType') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const query: ReportQuery = {};

    // Apply search filters
    if (search) {
      query.$or = [
        { reportId: { $regex: search, $options: 'i' } },
        { applicantId: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply report type filter
    if (reportType !== 'all') {
      query.reportType = reportType;
    }

    console.log('Fetching reports with query:', query);

    // Fetch medical reports
    const reports = await MedicalReport.find(query)
      .select('-pdfData')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean() as unknown as ReportDocument[];

    console.log('Found reports:', reports.length);

    // Attach applicant info to each report
    const reportsWithApplicantInfo = await Promise.all(
      reports.map(async (report) => {
        const applicant = await Applicant.findOne({
          applicantId: report.applicantId
        })
          .select('firstName lastName email')
          .lean() as { firstName: string; lastName: string; email: string } | null;

        return {
          ...report,
          applicantName: applicant
            ? `${applicant.firstName} ${applicant.lastName}`
            : 'Unknown',
          applicantEmail: applicant?.email || 'N/A'
        };
      })
    );

    // Total count for pagination
    const total = await MedicalReport.countDocuments(query);

    // Report type distribution
    const reportTypeStats = await MedicalReport.aggregate([
      {
        $group: {
          _id: "$reportType",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalReports = await MedicalReport.countDocuments();

    // Convert report type stats to object
    const reportTypeBreakdown = reportTypeStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    // Final response payload
    const response = {
      reports: reportsWithApplicantInfo,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total: totalReports,
        reportTypeBreakdown
      }
    };

    console.log(
      'Sending response with',
      reportsWithApplicantInfo.length,
      'reports'
    );

    return NextResponse.json(response);

  } catch (error) {
    // Handle fetch errors
    console.error("Error fetching medical reports:", error);
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
 * @route   POST /api/medical-reports
 * @desc    Get a single medical report by report ID
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Allow admin and medical organization roles
    const allowedRoles = ['admin', 'medical_organization'];
    if (!session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        {
          error: `Forbidden - Your role (${session.user.role}) is not authorized`
        },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Read request body
    const body = await request.json();
    const { reportId } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    // Fetch medical report
    const report = await MedicalReport.findOne({ reportId }).lean();

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const typedReport = report as unknown as ReportDocument;

    // Fetch applicant info
    const applicant = await Applicant.findOne({
      applicantId: typedReport.applicantId
    })
      .select('firstName lastName email')
      .lean() as { firstName: string; lastName: string; email: string } | null;

    return NextResponse.json({
      success: true,
      report: {
        ...typedReport,
        applicantName: applicant
          ? `${applicant.firstName} ${applicant.lastName}`
          : 'Unknown',
        applicantEmail: applicant?.email || 'N/A'
      }
    });

  } catch (error) {
    // Handle fetch errors
    console.error("Error fetching report:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
