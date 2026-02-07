import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import Log from "@/models/Log";

// Define the structure for payment update data
interface PaymentUpdateData {
  paymentMethod: string;
  paymentStatus: string;
  paymentProof?: string;
  updatedAt: Date;
}

// Define the structure for JSON payment requests
interface JsonPaymentRequest {
  applicantId: string;
  paymentMethod: string;
  paymentStatus?: string;
}

/**
 * POST endpoint for recording a payment
 * Supports both JSON and form-data for flexibility
 */
export async function POST(request: NextRequest) {
  // Capture user agent for logging purposes
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Connect to the database
    await connectDB();

    // Check the content type to handle both JSON and form-data
    const contentType = request.headers.get('content-type') || '';
    
    // Declare variables for payment data
    let applicantId: string;
    let paymentMethod: string;
    let paymentStatus: string;
    let paymentProof: File | null = null;
    
    // Handle JSON requests (typically from API calls)
    if (contentType.includes('application/json')) {
      const jsonData: JsonPaymentRequest = await request.json();
      applicantId = jsonData.applicantId;
      paymentMethod = jsonData.paymentMethod;
      // Default status for JSON requests
      paymentStatus = jsonData.paymentStatus || "pending_reception";
    } 
    // Handle form-data requests (typically from file uploads)
    else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      applicantId = formData.get("applicantId") as string;
      paymentMethod = formData.get("paymentMethod") as string;
      // Default status for form-data with proof upload
      paymentStatus = formData.get("paymentStatus") as string || "pending_verification";
      paymentProof = formData.get("paymentProof") as File;
    } 
    // Reject unsupported content types
    else {
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
    
    // Find the applicant in the database
    const applicant = await Applicant.findOne({ applicantId });
    if (!applicant) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 }
      );
    }

    // Handle payment proof file upload for QR PhonePay method
    let paymentProofPath = "";
    if (paymentProof && paymentMethod === "qr_phonepay") {
      // Set up upload directory
      const uploadDir = path.join(process.cwd(), "public", "uploads", "payments");
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        console.log("Upload directory already exists");
      }

      // Process the uploaded file
      const bytes = await paymentProof.arrayBuffer();
      const buffer = Buffer.from(bytes);
      // Create a unique filename
      const fileName = `payment_${applicantId}_${Date.now()}${path.extname(paymentProof.name)}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      // Store the relative path for database
      paymentProofPath = `/uploads/payments/${fileName}`;
    }
    
    // Prepare the update data
    const updateData: PaymentUpdateData = {
      paymentMethod,
      paymentStatus,
      updatedAt: new Date()
    };

    // Add proof path if file was uploaded
    if (paymentProofPath) {
      updateData.paymentProof = paymentProofPath;
    }

    // Update the applicant's payment information
    await Applicant.findOneAndUpdate(
      { applicantId },
      updateData
    );
    
    // Log the successful payment recording
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

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Payment recorded successfully",
        paymentStatus: updateData.paymentStatus
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    // Handle any errors that occur during processing
    console.error("Payment processing error:", error);
    
    // Log the failure for audit trail
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

    // Return error response
    return NextResponse.json(
      { error: "Failed to process payment. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for retrieving payment information
 * Used to check payment status and details
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await connectDB();

    // Extract the applicant ID from query parameters
    const { searchParams } = new URL(request.url);
    const applicantId = searchParams.get("applicantId");

    // Validate required parameter
    if (!applicantId) {
      return NextResponse.json(
        { error: "Applicant ID is required" },
        { status: 400 }
      );
    }

    // Find the applicant with only payment-related fields
    const applicant = await Applicant.findOne(
      { applicantId },
      "paymentMethod paymentStatus paymentProof updatedAt"
    );

    // Handle case where applicant is not found
    if (!applicant) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 }
      );
    }

    // Return the payment information
    return NextResponse.json({
      paymentMethod: applicant.paymentMethod,
      paymentStatus: applicant.paymentStatus,
      paymentProof: applicant.paymentProof,
      lastUpdated: applicant.updatedAt
    });

  } catch (error: unknown) {
    // Handle any errors that occur during fetch
    console.error("Payment fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment information" },
      { status: 500 }
    );
  }
}