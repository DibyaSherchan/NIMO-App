import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Log from "@/models/Log";

// Define interface for MongoDB duplicate key error
interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

// Type guard to check if error is a MongoError
function isMongoError(error: unknown): error is MongoError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error
  );
}

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const { name, email, password, role } = await request.json();
    
    if (!name || !email || !password || !role) {
      await Log.create({
        logId: crypto.randomUUID(),
        action: "USER_REGISTER_FAILURE",
        userId: null,
        userRole: "anonymous",
        userAgent,
        details: {
          reason: "MISSING_FIELDS",
          error: "All fields are required",
          attemptedData: { name: !!name, email: !!email, password: !!password, role: !!role }
        }
      });
      
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await Log.create({
        logId: crypto.randomUUID(),
        action: "USER_REGISTER_FAILURE",
        userId: null,
        userRole: "anonymous",
        userAgent,
        details: {
          reason: "INVALID_EMAIL",
          error: "Invalid email format",
          attemptedEmail: email
        }
      });
      
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      await Log.create({
        logId: crypto.randomUUID(),
        action: "USER_REGISTER_FAILURE",
        userId: null,
        userRole: "anonymous",
        userAgent,
        details: {
          reason: "PASSWORD_TOO_SHORT",
          error: "Password must be at least 6 characters long",
          passwordLength: password.length
        }
      });
      
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const validRoles = [
      "Admin",
      "Agent",
      "ForeignEmployee",
      "MedicalOrganization",
    ];
    if (!validRoles.includes(role)) {
      await Log.create({
        logId: crypto.randomUUID(),
        action: "USER_REGISTER_FAILURE",
        userId: null,
        userRole: "anonymous",
        userAgent,
        details: {
          reason: "INVALID_ROLE",
          error: "Invalid role specified",
          attemptedRole: role
        }
      });
      
      return NextResponse.json(
        { error: "Invalid role specified" },
        { status: 400 }
      );
    }

    await connectDB();
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      await Log.create({
        logId: crypto.randomUUID(),
        action: "USER_REGISTER_FAILURE",
        userId: null,
        userRole: "anonymous",
        userAgent,
        details: {
          reason: "DUPLICATE_EMAIL",
          error: "User with this email already exists",
          attemptedEmail: email.toLowerCase()
        }
      });
      
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role,
      createdAt: new Date(),
    });

    await newUser.save();
    await Log.create({
      logId: crypto.randomUUID(),
      action: "USER_REGISTER_SUCCESS",
      userId: newUser._id,
      userRole: newUser.role,
      userAgent,
      details: {
        email: newUser.email,
        registrationMethod: "form",
        assignedRole: newUser.role
      }
    });
    
    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);
    await Log.create({
      logId: crypto.randomUUID(),
      action: "USER_REGISTER_FAILURE",
      userId: null,
      userRole: "anonymous",
      userAgent,
      details: {
        reason: "SERVER_ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined
      }
    });
    if (isMongoError(error) && error.code === 11000) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Internal server error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}