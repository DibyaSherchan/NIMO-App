"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  ArrowLeft,
  Save,
  User,
  Search,
  Download,
} from "lucide-react";
import { generateMedicalReportPDF } from "@/lib/pdfGenerator";

// Interface for laboratory test results
interface LabResult {
  result: string;
  reference: string;
  unit?: string;
}

// Interface for the complete medical report form data
interface ReportFormData {
  name: string;
  age: string;
  sex: string;
  maritalStatus: string;
  passportNo: string;
  passportExpiry: string;
  passportIssuePlace: string;
  examinationDate: string;
  destination: string;
  nationality: string;
  height: string;
  weight: string;
  pulse: string;
  temperature: string;
  bloodPressure: string;
  clinicalImpression: string;
  labResults: Record<string, LabResult>;
  physicianName: string;
  physicianLicense: string;
  applicantId: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  medicalHistory: string;
  chestXRay: string;
  ecg: string;
  vision: string;
  hearing: string;
  urineTest: string;
  stoolTest: string;
  pregnancyTest: string;
  vaccinationStatus: string;
  reportId: string;
}

// Interface for applicant data
interface Applicant {
  _id: string;
  applicantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passportNumber: string;
  passportExpiry: string;
  dateOfBirth: string;
  nationality: string;
  gender: string;
  address: string;
  destinationCountry: string;
  medicalHistory: string;
  status: string;
}

/**
 * Main component for generating and editing medical reports
 * Handles both creating new reports and editing existing ones
 */
const GenerateReportContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get parameters from URL
  const applicantIdFromUrl = searchParams.get("applicantId");
  const reportIdFromUrl = searchParams.get("reportId");
  const isEditMode = searchParams.get("edit") === "true";

  // State management
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([]);
  const [showApplicantList, setShowApplicantList] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Default form data with standard lab values
  const [formData, setFormData] = useState<ReportFormData>({
    name: "",
    age: "0",
    sex: "Male",
    maritalStatus: "Single",
    passportNo: "",
    passportExpiry: "",
    passportIssuePlace: "NEPAL",
    examinationDate: new Date().toISOString().split("T")[0], // Today's date
    destination: "",
    nationality: "",
    height: "",
    weight: "",
    pulse: "72",
    temperature: "98.6",
    bloodPressure: "120/80",
    clinicalImpression: "Normal",
    // Default laboratory results with standard reference values
    labResults: {
      "Total WBC Count": {
        result: "6,700",
        reference: "4000-11700",
        unit: "/cmm",
      },
      Neutrophils: { result: "66", reference: "43-75%", unit: "%" },
      Lymphocytes: { result: "27", reference: "25-40%", unit: "%" },
      Eosinophils: { result: "03", reference: "1-6%", unit: "%" },
      Monocytes: { result: "04", reference: "2-8%", unit: "%" },
      Basophils: { result: "00", reference: "0-3%", unit: "%" },
      ESR: { result: "10", reference: "M <15, F <20", unit: "mm/hr" },
      Hemoglobin: {
        result: "12.6",
        reference: "M 13.5-17.5, F 12.0-15.5",
        unit: "g/dL",
      },
      "Random Blood Sugar": {
        result: "102",
        reference: "60-140",
        unit: "mg/dL",
      },
      Urea: { result: "25", reference: "20-40", unit: "mg/dL" },
      Creatinine: { result: "1.0", reference: "0.6-1.4", unit: "mg/dL" },
      "Bilirubin (Total/Direct)": {
        result: "0.9/0.3",
        reference: "0.2-1.2/0.0-0.3",
        unit: "mg/dL",
      },
      SGPT: { result: "29", reference: "Up to 41", unit: "U/L" },
      SGOT: { result: "27", reference: "Up to 41", unit: "U/L" },
      "Anti-HIV (1&2)": { result: "Non Reactive", reference: "Non Reactive" },
      HBsAg: { result: "Negative", reference: "Negative" },
      "Anti-HCV": { result: "Negative", reference: "Negative" },
      "VDIL/RPR": { result: "Non Reactive", reference: "Non Reactive" },
      TPHA: { result: "Non Reactive", reference: "Non Reactive" },
      "ABO-Blood Group & Rh-type": { result: "B+ve", reference: "" },
      "Malaria Parasite": { result: "Not Found", reference: "" },
      "Micro Filaria": { result: "Not Found", reference: "" },
      Opiates: { result: "Negative", reference: "" },
      Cannabis: { result: "Negative", reference: "" },
      "Mantoux Test": { result: "Negative", reference: "" },
    },
    physicianName: "DR. ANUJ SHRESTHA", // Default physician
    physicianLicense: "NMC NO.17681", // Default license
    applicantId: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    medicalHistory: "",
    chestXRay: "Normal",
    ecg: "Normal sinus rhythm",
    vision: "6/6 both eyes",
    hearing: "Normal",
    urineTest: "Normal",
    stoolTest: "Normal",
    pregnancyTest: "Not Applicable",
    vaccinationStatus: "Up to date",
    // Generate unique report ID
    reportId: Math.random().toString(36).substring(2, 10).toUpperCase(),
  });

  // Fetch applicants list on component mount
  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const res = await fetch("/api/applicants");
        const data = await res.json();
        setApplicants(data);
        setFilteredApplicants(data);
      } catch (err) {
        console.error("Error fetching applicants:", err);
      }
    };
    fetchApplicants();
  }, []);

  // Handle URL parameters for editing or pre-selecting applicant
  useEffect(() => {
    if (reportIdFromUrl && isEditMode) {
      fetchExistingReport(reportIdFromUrl);
      setIsEditing(true);
    } else if (applicantIdFromUrl) {
      const applicant = applicants.find(
        (a) => a.applicantId === applicantIdFromUrl
      );
      if (applicant) {
        handleSelectApplicant(applicant);
      }
    }
  }, [applicantIdFromUrl, reportIdFromUrl, isEditMode, applicants]);

  // Fetch existing report data for editing
  const fetchExistingReport = async (reportId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/${reportId}`);
      if (res.ok) {
        const reportData = await res.json();
        
        // Ensure labResults exists with default values
        if (!reportData.labResults || typeof reportData.labResults !== "object") {
          reportData.labResults = {
            "Total WBC Count": {
              result: "6,700",
              reference: "4000-11700",
              unit: "/cmm",
            },
            // ... [rest of default lab results]
          };
        }

        setFormData(reportData);
        setSearchTerm(`${reportData.name} (${reportData.passportNo})`);
        alert("Report loaded for editing");
      } else {
        alert("Failed to load report for editing");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      alert("Error loading report");
    } finally {
      setLoading(false);
    }
  };

  // Handle search input changes for applicant lookup
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    // Filter applicants based on search term
    if (term.length > 1) {
      const filtered = applicants.filter(
        (applicant) =>
          applicant.firstName.toLowerCase().includes(term.toLowerCase()) ||
          applicant.lastName.toLowerCase().includes(term.toLowerCase()) ||
          applicant.passportNumber.toLowerCase().includes(term.toLowerCase()) ||
          applicant.applicantId.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredApplicants(filtered);
      setShowApplicantList(true);
    } else {
      setFilteredApplicants([]);
      setShowApplicantList(false);
    }
  };

  // Handle applicant selection from search results
  const handleSelectApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setShowApplicantList(false);
    setSearchTerm(
      `${applicant.firstName} ${applicant.lastName} (${applicant.passportNumber})`
    );

    // Calculate age from date of birth
    const birthDate = new Date(applicant.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    // Populate form with applicant data
    setFormData((prev) => ({
      ...prev,
      name: `${applicant.firstName} ${applicant.lastName}`,
      age: age.toString(),
      sex: applicant.gender,
      passportNo: applicant.passportNumber,
      passportExpiry: applicant.passportExpiry.split("T")[0],
      nationality: applicant.nationality,
      destination: applicant.destinationCountry,
      applicantId: applicant.applicantId,
      email: applicant.email,
      phone: applicant.phone,
      address: applicant.address,
      dateOfBirth: applicant.dateOfBirth.split("T")[0],
      medicalHistory: applicant.medicalHistory || "",
    }));
  };

  // Handle form input changes for text fields
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle laboratory result field changes
  const handleLabResultChange = (
    testName: string,
    field: keyof LabResult,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      labResults: {
        ...prev.labResults,
        [testName]: {
          ...prev.labResults[testName],
          [field]: value,
        },
      },
    }));
  };

  // Validate required form fields
  const validateForm = () => {
    const requiredFields = [
      "name",
      "age",
      "passportNo",
      "passportExpiry",
      "examinationDate",
      "destination",
      "nationality",
      "height",
      "weight",
      "bloodPressure",
      "applicantId",
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof ReportFormData]) {
        alert(`Please fill in the ${field} field`);
        return false;
      }
    }

    return true;
  };

  // Generate PDF and save to database
  const handleGenerateAndSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Generate PDF from form data
      const pdfBlob = await generateMedicalReportPDF(formData);
      const reader = new FileReader();
      
      // Convert PDF to base64 for database storage
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;

        // Determine API endpoint based on edit mode
        const endpoint = isEditing
          ? `/api/reports/${formData.reportId}`
          : "/api/reports/save";
        const method = isEditing ? "PUT" : "POST";

        // Save report to database
        const response = await fetch(endpoint, {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            pdfData: base64data, // Store PDF as base64 string
          }),
        });

        if (response.ok) {
          const result = await response.json();
          alert(
            isEditing
              ? "Report updated successfully!"
              : "Report saved successfully!"
          );
          console.log("Saved report ID:", result.reportId);
          
          // Create downloadable PDF URL
          const pdfUrl = URL.createObjectURL(pdfBlob);
          setGeneratedPdfUrl(pdfUrl);
        } else {
          throw new Error("Failed to save report");
        }
      };
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  // Generate PDF without saving to database
  const handleGenerateOnly = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const pdfBlob = await generateMedicalReportPDF(formData);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setGeneratedPdfUrl(pdfUrl);
      alert("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 mx-auto min-h-screen bg-gray-100 text-black">
      {/* Page header with back button */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition duration-200 mr-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold">
          {isEditing ? "Edit Medical Report" : "Generate Medical Report"}
        </h1>
      </div>

      {/* Success message with PDF download link */}
      {generatedPdfUrl && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
          <div className="flex justify-between items-center">
            <span>PDF generated successfully!</span>
            <a
              href={generatedPdfUrl}
              download="medical-report.pdf"
              className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Download size={16} className="mr-1" />
              Download PDF
            </a>
          </div>
        </div>
      )}

      {/* Applicant search section (only for new reports) */}
      {!isEditing && (
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Applicant</h2>
          <div className="relative">
            {/* Search input */}
            <div className="flex items-center border rounded-md p-2">
              <Search size={16} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search by name, passport number, or applicant ID"
                value={searchTerm}
                onChange={handleSearchChange}
                className="flex-1 outline-none"
              />
            </div>

            {/* Search results dropdown */}
            {showApplicantList && filteredApplicants.length > 0 && (
              <div className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-60 overflow-y-auto">
                {filteredApplicants.map((applicant) => (
                  <div
                    key={applicant._id}
                    className="p-3 border-b hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectApplicant(applicant)}
                  >
                    <div className="font-medium">
                      {applicant.firstName} {applicant.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      Passport: {applicant.passportNumber} | ID:{" "}
                      {applicant.applicantId}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected applicant confirmation */}
          {selectedApplicant && (
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <div className="flex items-center">
                <User size={16} className="text-green-600 mr-2" />
                <span className="font-medium">
                  Selected: {selectedApplicant.firstName}{" "}
                  {selectedApplicant.lastName}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit mode indicator */}
      {isEditing && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-6">
          <p>
            Editing existing report for: <strong>{formData.name}</strong>
          </p>
        </div>
      )}

      {/* Main form */}
      <div className="bg-white rounded-lg p-6">
        <div className="space-y-6">
          {/* Applicant ID and Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">
                Applicant ID
              </label>
              <input
                type="text"
                name="applicantId"
                value={formData.applicantId}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                readOnly // Applicant ID cannot be changed
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          {/* Demographic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Sex</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                Marital Status
              </label>
              <select
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
          </div>

          {/* Passport Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">
                Passport Number
              </label>
              <input
                type="text"
                name="passportNo"
                value={formData.passportNo}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                Passport Expiry Date
              </label>
              <input
                type="date"
                name="passportExpiry"
                value={formData.passportExpiry}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          {/* Passport and Examination Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">
                Passport Issue Place
              </label>
              <input
                type="text"
                name="passportIssuePlace"
                value={formData.passportIssuePlace}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                Medical Examination Date
              </label>
              <input
                type="date"
                name="examinationDate"
                value={formData.examinationDate}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          {/* Destination and Nationality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">
                Destination Country
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                Nationality
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          {/* Physical Examination Measurements */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">
                Height (cm)
              </label>
              <input
                type="text"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                Weight (kg)
              </label>
              <input
                type="text"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                Pulse (/min)
              </label>
              <input
                type="text"
                name="pulse"
                value={formData.pulse}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                Temperature (°F)
              </label>
              <input
                type="text"
                name="temperature"
                value={formData.temperature}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          {/* Clinical Findings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">
                Blood Pressure
              </label>
              <input
                type="text"
                name="bloodPressure"
                value={formData.bloodPressure}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                Clinical Impression
              </label>
              <input
                type="text"
                name="clinicalImpression"
                value={formData.clinicalImpression}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          {/* Special Test Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">
                Chest X-Ray
              </label>
              <input
                type="text"
                name="chestXRay"
                value={formData.chestXRay}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">ECG</label>
              <input
                type="text"
                name="ecg"
                value={formData.ecg}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Vision</label>
              <input
                type="text"
                name="vision"
                value={formData.vision}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Hearing</label>
              <input
                type="text"
                name="hearing"
                value={formData.hearing}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">
                Urine Test
              </label>
              <input
                type="text"
                name="urineTest"
                value={formData.urineTest}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                Stool Test
              </label>
              <input
                type="text"
                name="stoolTest"
                value={formData.stoolTest}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">
                Pregnancy Test
              </label>
              <input
                type="text"
                name="pregnancyTest"
                value={formData.pregnancyTest}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                Vaccination Status
              </label>
              <input
                type="text"
                name="vaccinationStatus"
                value={formData.vaccinationStatus}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          {/* Physician Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">
                Physician Name
              </label>
              <input
                type="text"
                name="physicianName"
                value={formData.physicianName}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                Physician License
              </label>
              <input
                type="text"
                name="physicianLicense"
                value={formData.physicianLicense}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block mb-1 text-sm font-medium">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows={2}
              required
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block mb-1 text-sm font-medium">
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {/* Medical History */}
          <div>
            <label className="block mb-1 text-sm font-medium">
              Medical History
            </label>
            <textarea
              name="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows={3}
              required
            />
          </div>

          {/* Laboratory Results Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Laboratory Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.labResults &&
                Object.entries(formData.labResults).map(([test, data]) => (
                  <div key={test} className="border p-2 rounded">
                    <label className="block mb-1 text-sm font-medium">
                      {test}
                    </label>
                    <input
                      type="text"
                      value={data.result}
                      onChange={(e) =>
                        handleLabResultChange(test, "result", e.target.value)
                      }
                      className="w-full p-1 border rounded mb-1"
                      placeholder="Result"
                    />
                    <input
                      type="text"
                      value={data.reference}
                      onChange={(e) =>
                        handleLabResultChange(test, "reference", e.target.value)
                      }
                      className="w-full p-1 border rounded"
                      placeholder="Reference Range"
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={handleGenerateOnly}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition duration-200"
            >
              <FileText size={16} className="mr-2" />
              {loading ? "Generating..." : "Generate PDF Only"}
            </button>

            <button
              onClick={handleGenerateAndSave}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300 transition duration-200"
            >
              <Save size={16} className="mr-2" />
              {saving
                ? isEditing
                  ? "Updating..."
                  : "Saving..."
                : isEditing
                ? "Update Report"
                : "Generate & Save to DB"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading fallback component shown during Suspense loading
 */
const LoadingFallback = () => (
  <div className="p-6 mx-auto min-h-screen bg-gray-100 text-black">
    {/* Simulated header */}
    <div className="flex items-center mb-6">
      <div className="w-16 h-8 bg-gray-300 rounded mr-4 animate-pulse"></div>
      <div className="w-48 h-8 bg-gray-300 rounded animate-pulse"></div>
    </div>
    {/* Simulated search section */}
    <div className="bg-white rounded-lg p-6 mb-6">
      <div className="w-32 h-6 bg-gray-300 rounded mb-4 animate-pulse"></div>
      <div className="w-full h-10 bg-gray-300 rounded animate-pulse"></div>
    </div>
    {/* Simulated form fields */}
    <div className="bg-white rounded-lg p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full h-16 bg-gray-300 rounded animate-pulse"></div>
          <div className="w-full h-16 bg-gray-300 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="w-full h-16 bg-gray-300 rounded animate-pulse"></div>
          <div className="w-full h-16 bg-gray-300 rounded animate-pulse"></div>
          <div className="w-full h-16 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Main page component with Suspense wrapper
 * Handles loading state while search params are being accessed
 */
const GenerateReportPage = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GenerateReportContent />
    </Suspense>
  );
};

export default GenerateReportPage;