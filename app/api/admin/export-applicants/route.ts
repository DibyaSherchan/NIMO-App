import { NextResponse } from 'next/server';
import Applicant from '@/models/Applicant';
import { connectDB } from '@/lib/mongodb';

/**
 * @route   GET /api/applicants/export
 * @desc    Export all applicants as CSV
 */
export async function GET() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Fetch applicants with required fields only
    const applicants = await Applicant.find()
      .select(
        'applicantId firstName lastName email phone nationality gender maritalStatus destinationCountry jobPosition status paymentStatus paymentMethod region createdAt'
      )
      .lean();

    // CSV column headers
    const csvHeaders = [
      'Applicant ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Nationality',
      'Gender',
      'Marital Status',
      'Destination Country',
      'Job Position',
      'Status',
      'Payment Status',
      'Payment Method',
      'Region',
      'Created At'
    ];

    // Map applicant data to CSV rows
    const csvContent = applicants.map(applicant => [
      applicant.applicantId,
      applicant.firstName,
      applicant.lastName,
      applicant.email,
      applicant.phone,
      applicant.nationality,
      applicant.gender,
      applicant.maritalStatus,
      applicant.destinationCountry,
      applicant.jobPosition,
      applicant.status,
      applicant.paymentStatus,
      applicant.paymentMethod || 'N/A',
      applicant.region,
      new Date(applicant.createdAt).toLocaleDateString()
    ]);

    // Build CSV string
    const csv = [csvHeaders, ...csvContent]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Return CSV file as download
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="applicants-${new Date()
          .toISOString()
          .split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    // Handle export errors
    console.error('Error exporting applicants:', error);
    return NextResponse.json(
      { error: 'Failed to export applicants' },
      { status: 500 }
    );
  }
}
