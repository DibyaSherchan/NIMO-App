import { NextResponse } from 'next/server';
import Applicant from '@/models/Applicant';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    await connectDB();

    const applicants = await Applicant.find()
      .select('applicantId firstName lastName email phone nationality gender maritalStatus destinationCountry jobPosition status paymentStatus paymentMethod region createdAt')
      .lean();

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

    const csv = [csvHeaders, ...csvContent]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="applicants-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting applicants:', error);
    return NextResponse.json(
      { error: 'Failed to export applicants' },
      { status: 500 }
    );
  }
}