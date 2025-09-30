import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import MedicalReport from "@/models/MedicalReport";
import Applicant from "@/models/Applicant";

interface ReportQuery {
  $or?: Array<{
    [key: string]: { $regex: string; $options: string };
  }>;
  reportType?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('=== AUTH DEBUG ===');
    console.log('Session exists:', !!session);
    console.log('User:', session?.user);
    console.log('User role:', session?.user?.role);
    console.log('==================');
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }
    
    const allowedRoles = ['admin', 'medical_organization'];
    const userRole = session.user.role?.toLowerCase();
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log('Access denied. User role:', session.user.role, 'Allowed:', allowedRoles);
      return NextResponse.json({ 
        error: `Forbidden - Your role (${session.user.role}) is not authorized. Required: admin or medical_organization` 
      }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const reportType = searchParams.get('reportType') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    const query: ReportQuery = {};
    
    if (search) {
      query.$or = [
        { reportId: { $regex: search, $options: 'i' } },
        { applicantId: { $regex: search, $options: 'i' } }
      ];
    }

    if (reportType !== 'all') {
      query.reportType = reportType;
    }

    console.log('Fetching reports with query:', query);

    const reports = await MedicalReport.find(query)
      .select('-pdfData')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log('Found reports:', reports.length);

    const reportsWithApplicantInfo = await Promise.all(
      reports.map(async (report) => {
        const applicant = await Applicant.findOne({ applicantId: report.applicantId })
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

    const total = await MedicalReport.countDocuments(query);
    
    const reportTypeStats = await MedicalReport.aggregate([
      {
        $group: {
          _id: "$reportType",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalReports = await MedicalReport.countDocuments();

    const reportTypeBreakdown = reportTypeStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

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

    console.log('Sending response with', reportsWithApplicantInfo.length, 'reports');
    
    return NextResponse.json(response);

  } catch (error) {
    console.error("Error fetching medical reports:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    const allowedRoles = ['admin', 'medical_organization'];
    if (!session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ 
        error: `Forbidden - Your role (${session.user.role}) is not authorized` 
      }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { reportId } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    const report = await MedicalReport.findOne({ reportId })
      .lean();

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const applicant = await Applicant.findOne({ applicantId: report.applicantId })
      .select('firstName lastName email')
      .lean() as { firstName: string; lastName: string; email: string } | null;

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        applicantName: applicant 
          ? `${applicant.firstName} ${applicant.lastName}`
          : 'Unknown',
        applicantEmail: applicant?.email || 'N/A'
      }
    });

  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}