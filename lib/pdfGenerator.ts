import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

interface LabResult {
  result: string;
  reference?: string;
  unit?: string;
}

interface LabResults {
  [key: string]: LabResult;
}

interface MedicalFormData {
  name?: string;
  age?: string;
  sex?: string;
  maritalStatus?: string;
  passportNo?: string;
  passportExpiry?: string;
  passportIssuePlace?: string;
  examinationDate?: string;
  destination?: string;
  nationality?: string;
  height?: string;
  weight?: string;
  pulse?: string;
  temperature?: string;
  bloodPressure?: string;
  labResults?: LabResults;
  physicianName?: string;
  physicianLicense?: string;
  reportId?: string;
}
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
    autoTable: (options: any) => void;
  }
}

export const generateMedicalReportPDF = async (
  formData: MedicalFormData
): Promise<Blob> => {
  const doc = new jsPDF("p", "mm", "a4");
  let currentY = 10;

  // === HEADER ===
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Nippon Medical Centre Pvt. Ltd.", 105, currentY, {
    align: "center",
  });

  currentY += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "(An authorized medical centre by the Government of Nepal)",
    105,
    currentY,
    { align: "center" }
  );

  currentY += 3;
  doc.text(
    "Balaju-16, Kathmandu, Ph. +977-1-4338273/E-mail: supply10@hotmail.com",
    105,
    currentY,
    { align: "center" }
  );

  currentY += 3;
  doc.text(
    "(Affiliated to Nepal Medical Occupational&apos;s Organization)",
    105,
    currentY,
    { align: "center" }
  );

  currentY += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(0, 0, 0);
  doc.setTextColor(0, 0, 0);
  doc.text("MEDICAL EXAMINATION REPORT", 105, currentY + 1, {
    align: "center",
  });
  doc.setTextColor(0, 0, 0);

  currentY += 8;
  doc.setFillColor(255, 192, 203);
  doc.rect(95, currentY - 2, 20, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.text("FIT", 105, currentY + 1, { align: "center" });

  // === APPLICANT INFO TABLE ===
  currentY += 8;
  autoTable(doc, {
    startY: currentY,
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 1, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 25, fontStyle: "bold" },
      1: { cellWidth: 35 },
      2: { cellWidth: 25, fontStyle: "bold" },
      3: { cellWidth: 35 },
      4: { cellWidth: 70 },
    },
    body: [
      [
        "Name",
        formData.name || "MR MAHESH NEUPANE",
        "Age",
        formData.age || "28",
        "",
      ],
      ["", "", "Sex", formData.sex || "M", ""],
      ["", "", "Marital Status", formData.maritalStatus || "UNMARRIED", ""],
      [
        "Passport No.",
        formData.passportNo || "10962098",
        "Expired On",
        formData.passportExpiry || "16 JUN 2028",
        "",
      ],
      [
        "",
        "",
        "Passport Issue Place",
        formData.passportIssuePlace || "NEPAL",
        "",
      ],
      [
        "Medical Examination Date",
        formData.examinationDate || "13/09/2024",
        "Working Applied for",
        formData.destination || "JAPAN",
        "",
      ],
      ["", "", "Nationality", formData.nationality || "NEPALI", ""],
    ],
  });

  // === GENERAL EXAMINATION ===
  currentY = (doc.lastAutoTable?.finalY || 0) + 3;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(64, 64, 64);
  doc.rect(10, currentY - 2, 190, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("GENERAL EXAMINATION", 12, currentY + 1);
  doc.setTextColor(0, 0, 0);

  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "1. Past history of serious illness, Major surgery, and significant psychological problem including (Epilepsy and Depression) None",
    12,
    currentY
  );
  currentY += 3;
  doc.text("2. Past history of allergy None", 12, currentY);

  // Physical measurements table
  currentY += 5;
  autoTable(doc, {
    startY: currentY,
    theme: "grid",
    styles: { fontSize: 6, cellPadding: 1, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 12 },
      2: { cellWidth: 8 },
      3: { cellWidth: 18 },
      4: { cellWidth: 12 },
      5: { cellWidth: 8 },
      6: { cellWidth: 18 },
      7: { cellWidth: 12 },
      8: { cellWidth: 8 },
      9: { cellWidth: 25 },
      10: { cellWidth: 12 },
      11: { cellWidth: 8 },
    },
    body: [
      [
        "Height",
        formData.height || "166",
        "cm",
        "Weight",
        formData.weight || "48",
        "kg",
        "Pulse",
        formData.pulse || "82",
        "/min",
        "Temperature",
        formData.temperature || "98",
        "°F",
      ],
      [
        "B/P",
        formData.bloodPressure || "110/70",
        "mmHg",
        "Jaundice",
        "Absent",
        "",
        "Pallor",
        "Absent",
        "",
        "Cyanosis",
        "Absent",
        "",
      ],
      [
        "Clubbing",
        "Absent",
        "",
        "Oedema",
        "Absent",
        "",
        "Ascites",
        "Absent",
        "",
        "Lymph Node",
        "Absent",
        "",
      ],
    ],
  });

  // === SYSTEMIC & LABORATORY EXAMINATION ===
  currentY = (doc as any).lastAutoTable.finalY + 3;
  const leftColumnX = 12;
  const rightColumnX = 110;
  const columnWidth = 90;

  // Left column
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(64, 64, 64);
  doc.rect(leftColumnX, currentY - 2, columnWidth, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("SYSTEMIC EXAMINATION", leftColumnX + 2, currentY + 1);

  // Right column
  doc.rect(rightColumnX, currentY - 2, columnWidth, 4, "F");
  doc.text("LABORATORY EXAMINATION", rightColumnX + 2, currentY + 1);
  doc.setTextColor(0, 0, 0);

  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);

  const systemicExams = [
    ["Type of Medical Examination", "Findings"],
    ["Cardiovascular", "NAD"],
    ["Pulmonary", "NAD"],
    ["Gastroenterology", "NAD"],
    ["Neurology", "NAD"],
    ["Musculoskeletal", "NAD"],
    ["Genitourinary", "NAD"],
    ["Oro - Dental", "Normal"],
    ["Extremities / Deformities", "NAD"],
    ["Varicose Veins", "Absent"],
    ["Hernia", "Absent"],
    ["Hydrocele", "N/A"],
    ["Eye (Vision)", "R Eye: 6/6, L Eye: 6/6"],
    ["Ear", "R Ear: Normal, L Ear: Normal"],
    ["Gynecological Examination", ""],
    ["Radiological (Chest X-Ray):", "Normal"],
    ["ECG", ""],
    ["CLINICAL IMPRESSION:", "Normal"],
  ];

  const labExams = [
    ["", "Blood Examination", "Result", "Reference Ranges"],
    ["", "Total WBC Count", formData.labResults?.wbc?.result || "6,700", ""],
    ["", "Differential Count", "", ""],
    [
      "HEMATOLOGY",
      "Neutrophils",
      formData.labResults?.neutrophils?.result || "66",
      "51-75%",
    ],
    [
      "",
      "Lymphocytes",
      formData.labResults?.lymphocytes?.result || "27",
      "25-40%",
    ],
    [
      "",
      "Eosinophils",
      formData.labResults?.eosinophils?.result || "03",
      "1-6%",
    ],
    ["", "Monocytes", formData.labResults?.monocytes?.result || "04", "2-8%"],
    ["", "Basophils", formData.labResults?.basophils?.result || "00", "0-3%"],
    ["", "ESR", formData.labResults?.esr?.result || "10", "M-15mm/hr, F-20"],
    [
      "",
      "Hemoglobin",
      formData.labResults?.hemoglobin?.result || "12.6",
      "M: 14g/100ml, F:12g/100ml",
    ],
    ["", "Malaria Parasite", "Not Found", ""],
    ["", "Micro Filaria", "Not Found", ""],
    [
      "BIOCHEMISTRY",
      "Random Blood Sugar",
      formData.labResults?.rbs?.result || "102",
      "60-140 mg%",
    ],
    ["", "Urea", formData.labResults?.urea?.result || "25", "20-40mg%"],
    [
      "",
      "Creatinine",
      formData.labResults?.creatinine?.result || "1.0",
      "0.6-1.4 mg%",
    ],
    [
      "",
      "Bilirubin Total (Direct)",
      formData.labResults?.bilirubin?.result || "0.90/0.3",
      "0.6-1.2 mg% (T) 0.2-0.6(D)",
    ],
    ["", "SGPT", formData.labResults?.sgpt?.result || "29", "Up to 41U"],
    ["", "SGOT", formData.labResults?.sgot?.result || "27", "Up to 41U"],
    ["SEROLOGY", "Anti-HIV (1&2)", "None Reactive", ""],
    ["", "HBs-Ag", "Negative", ""],
    ["", "Anti-HCV", "Negative", ""],
    ["", "VDRL/RPR", "None Reactive", ""],
    ["", "TPHA", "None Reactive", ""],
    ["", "ABO-Blood Group & Rh-type", "B+ve", ""],
    ["URINE", "Albumin-Sugar", "Nil/Nil", ""],
    ["", "Pus Cells /hpf", "1-2", ""],
    ["", "RBCs /hpf", "Nil", ""],
    ["", "Epithelial cells /hpf", "1-2", ""],
    ["OTHER", "Opiates", "Negative", ""],
    ["", "Cannabis", "Negative", ""],
    ["", "Mantoux Test", "Negative", ""],
  ];

  // Systemic exam rendering
  let yPos = currentY;
  systemicExams.forEach((row, index) => {
    doc.setFont("helvetica", index === 0 ? "bold" : "normal");
    doc.text(row[0], leftColumnX, yPos);
    doc.text(row[1], leftColumnX + 45, yPos);
    yPos += 3.5;
  });

  // Lab exam rendering
  yPos = currentY;
  labExams.forEach((row, index) => {
    doc.setFont(
      "helvetica",
      index === 0 ||
        ["HEMATOLOGY", "BIOCHEMISTRY", "SEROLOGY", "URINE", "OTHER"].includes(
          row[0]
        )
        ? "bold"
        : "normal"
    );
    if (
      ["HEMATOLOGY", "BIOCHEMISTRY", "SEROLOGY", "URINE", "OTHER"].includes(
        row[0]
      )
    ) {
      doc.text(row[0], rightColumnX, yPos);
    } else {
      doc.text(row[1], rightColumnX, yPos);
      doc.text(row[2], rightColumnX + 35, yPos);
      doc.text(row[3], rightColumnX + 50, yPos);
    }
    yPos += 2.8;
  });

  // === CERTIFICATION ===
  currentY = 220;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("DEAR SIR,", 12, currentY);

  currentY += 5;
  doc.text(
    `THIS IS TO CERTIFY THAT MR. ${(
      formData.name || "MAHESH NEUPANE"
    ).toUpperCase()} IS CLINICALLY AND MENTALLY FIT AND THERE IS NO EVIDENCE OF COMMUNICABLE DISEASE IN HIM.`,
    12,
    currentY,
    { maxWidth: 180 }
  );

  // === SIGNATURE BLOCK ===
  currentY += 15;
  doc.setFont("helvetica", "bold");
  doc.text(`*${formData.physicianName || "DR. ANUJ SHRESTHA"}`, 12, currentY);
  currentY += 3;
  doc.text(`${formData.physicianLicense || "NMC NO. 17681"}`, 12, currentY);
  currentY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("(Name of Health Care Organization)", 12, currentY);
  doc.text("(Stamp & Signature of Physician)", 12, currentY + 3);

  // Right side signature
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Bishow Sherchan", 150, currentY - 8);
  doc.setFontSize(7);
  doc.text("Reg.:B2253MLT", 150, currentY - 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("Lab Technician", 150, currentY - 2);

  // === VALIDITY NOTE ===
  currentY += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text(
    "This Report is valid for Two months from the date of Medical Examination",
    12,
    currentY
  );

  // Government registration number
  doc.text("Gov. Reg. No. 69847 066/067", 160, 12);

  // === QR CODE ===
  const verifyUrl = `https://localhost:3000/verify/${
    formData.reportId || "sample-id"
  }`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl);
  doc.addImage(qrDataUrl, "PNG", 14, 260, 30, 30);
  doc.setFontSize(6);
  doc.text("Scan to verify", 14, 293);

  // Save file
  const pdfBlob = doc.output("blob");
  return pdfBlob;
};
