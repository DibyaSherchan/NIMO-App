import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB(); // Try connecting to MongoDB
    return NextResponse.json({ message: "Connected to MongoDB successfully" }, { status: 200 });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({ message: "Failed to connect to MongoDB" }, { status: 500 });
  }
}
