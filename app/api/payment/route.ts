// app/api/payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import Log from "@/models/Log";

interface PaymentUpdateData {
  paymentMethod: string;
  paymentStatus: string;
  paymentProof?: string;
  updatedAt: Date;
}

interface JsonPaymentRequest {
  applicantId: string;
  paymentMethod: string;
  paymentStatus?: string;
}

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    await connectDB();

    const contentType = request.headers.get('content-type') || '';

    let applicantId: string;
    let paymentMethod: string;
    let paymentStatus: string;
    let paymentProof: File | null = null;

    // Handle both JSON and FormData requests
    if (contentType.includes('application/json')) {
      const jsonData: JsonPaymentRequest = await request.json();
      applicantId = jsonData.applicantId;
      paymentMethod = jsonData.paymentMethod;
      paymentStatus = jsonData.paymentStatus || "pending_reception";
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      applicantId = formData.get("applicantId") as string;
      paymentMethod = formData.get("paymentMethod") as string;
      paymentStatus = formData.get("paymentStatus") as string || "pending_verification";
      paymentProof = formData.get("paymentProof") as File;
    } else {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!applicantId || !paymentMethod) {
      return NextResponse.json(
        { error: "Applicant ID and payment method are required" },
        { status: 400 }
      );
    }

    // Find applicant
    const applicant = await Applicant.findOne({ applicantId });
    if (!applicant) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 }
      );
    }

    let paymentProofPath = "";

    // Handle file upload for QR payments
    if (paymentProof && paymentMethod === "qr_phonepay") {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "payments");
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        console.log("Upload directory already exists");
      }

      const bytes = await paymentProof.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `payment_${applicantId}_${Date.now()}${path.extname(paymentProof.name)}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      paymentProofPath = `/uploads/payments/${fileName}`;
    }

    // Update applicant payment info
    const updateData: PaymentUpdateData = {
      paymentMethod,
      paymentStatus,
      updatedAt: new Date()
    };

    if (paymentProofPath) {
      updateData.paymentProof = paymentProofPath;
    }

    await Applicant.findOneAndUpdate(
      { applicantId },
      updateData
    );

    // Log the payment action
    await Log.create({
      logId: uuidv4(),
      action: "PAYMENT_RECORDED",
      userRole: "applicant",
      userAgent,
      details: {
        applicantId,
        paymentMethod,
        paymentStatus,
        hasProof: !!paymentProofPath,
        applicantEmail: applicant.email
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payment recorded successfully",
        paymentStatus: updateData.paymentStatus
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error("Payment processing error:", error);
    
    await Log.create({
      logId: uuidv4(),
      action: "PAYMENT_PROCESSING_FAILED",
      userRole: "system",
      userAgent,
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined
      }
    });

    return NextResponse.json(
      { error: "Failed to process payment. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const applicantId = searchParams.get("applicantId");

    if (!applicantId) {
      return NextResponse.json(
        { error: "Applicant ID is required" },
        { status: 400 }
      );
    }

    const applicant = await Applicant.findOne(
      { applicantId },
      "paymentMethod paymentStatus paymentProof updatedAt"
    );

    if (!applicant) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      paymentMethod: applicant.paymentMethod,
      paymentStatus: applicant.paymentStatus,
      paymentProof: applicant.paymentProof,
      lastUpdated: applicant.updatedAt
    });

  } catch (error: unknown) {
    console.error("Payment fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment information" },
      { status: 500 }
    );
  }
}