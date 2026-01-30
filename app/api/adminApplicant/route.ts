import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";

interface ApplicantQuery {
  $or?: Array<{
    [key: string]: { $regex: string; $options: string };
  }>;
  status?: string;
}

interface StatusBreakdown {
  [key: string]: number;
}

interface UpdateRequestBody {
  applicantId: string;
  status: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.user.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const query: ApplicantQuery = {};
    
    if (search) {
      query.$or = [
        { applicantId: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status !== 'all') {
      query.status = status;
    }
    console.log('Query:', query);
    console.log('Skip:', skip, 'Limit:', limit);
    const applicants = await Applicant.find(query)
      .select('-biometricData -passportScan -medicalReport') 
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); 

    console.log('Found applicants:', applicants.length);
    const total = await Applicant.countDocuments(query);
    const statusStats = await Applicant.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    const totalApplicants = await Applicant.countDocuments();
    const statusBreakdown: StatusBreakdown = statusStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as StatusBreakdown);

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

    console.log('Sending response with', applicants.length, 'applicants');
    
    return NextResponse.json(response);

  } catch (error) {
    console.error("Error fetching applicants:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.user.role || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const body: UpdateRequestBody = await request.json();
    const { applicantId, status } = body;

    if (!applicantId || !status) {
      return NextResponse.json(
        { error: "Applicant ID and status are required" },
        { status: 400 }
      );
    }

    const validStatuses: readonly string[] = ["pending", "under_review", "verified", "approved", "rejected"] as const;
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const applicant = await Applicant.findOneAndUpdate(
      { applicantId },
      { status },
      { new: true }
    ).select('-biometricData -passportScan -medicalReport')
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
    console.error("Error updating applicant status:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}