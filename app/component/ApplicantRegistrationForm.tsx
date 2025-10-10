"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  User,
  FileText,
  Calendar,
  Phone,
  Mail,
  Heart,
  Briefcase,
} from "lucide-react";

const MIN_WIDTH = 600;
const MIN_HEIGHT = 600;
const DESTINATION_COUNTRIES = [
  "UAE",
  "Qatar",
  "Saudi Arabia",
  "Kuwait",
  "Oman",
  "Bahrain",
  "Malaysia",
  "Singapore",
  "Japan",
  "South Korea",
  "Israel",
  "USA",
  "Canada",
  "UK",
  "Australia",
  "Other",
];

const ApplicantRegistrationForm = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    passportNumber: "",
    passportExpiry: "",
    passportIssuePlace: "",
    dateOfBirth: "",
    nationality: "Nepali", 
    gender: "",
    maritalStatus: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    destinationCountry: "",
    jobPosition: "",
    medicalHistory: "",
    passportScan: null as File | null,
    medicalReport: null as File | null,
    biometricData: null as File | null,
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const checkImageResolution = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) return resolve(true); 

      const img = new Image();
      img.onload = () => {
        resolve(img.width >= MIN_WIDTH && img.height >= MIN_HEIGHT);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  };

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.passportNumber)
      newErrors.passportNumber = "Passport number is required";
    if (!formData.passportExpiry)
      newErrors.passportExpiry = "Passport expiry date is required";
    if (!formData.passportIssuePlace)
      newErrors.passportIssuePlace = "Passport issue place is required";
    if (!formData.dateOfBirth)
      newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.nationality)
      newErrors.nationality = "Nationality is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.maritalStatus)
      newErrors.maritalStatus = "Marital status is required";
    if (!formData.address) newErrors.address = "Address is required";
    if (!formData.emergencyContact)
      newErrors.emergencyContact = "Emergency contact is required";
    if (!formData.emergencyPhone)
      newErrors.emergencyPhone = "Emergency phone is required";
    if (!formData.destinationCountry)
      newErrors.destinationCountry = "Destination country is required";
    if (!formData.jobPosition)
      newErrors.jobPosition = "Job position is required";

    const passportRegex = /^[A-Z0-9]{6,12}$/i;
    if (
      formData.passportNumber &&
      !passportRegex.test(formData.passportNumber)
    ) {
      newErrors.passportNumber =
        "Invalid passport number format (6–12 alphanumeric characters)";
    }

    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    if (formData.emergencyPhone && !phoneRegex.test(formData.emergencyPhone)) {
      newErrors.emergencyPhone = "Invalid emergency phone number format";
    }
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    const filesToCheck: Array<[string, File | null]> = [
      ["passportScan", formData.passportScan],
      ["medicalReport", formData.medicalReport],
      ["biometricData", formData.biometricData],
    ];

    for (const [field, file] of filesToCheck) {
      if (file) {
        if (!validTypes.includes(file.type)) {
          newErrors[field] = "Only JPG, PNG, and PDF files are allowed";
        }
        if (file.size > 5 * 1024 * 1024) {
          newErrors[field] = "File size must be less than 5MB";
        }
        if (file.type.startsWith("image/")) {
          const isValidRes = await checkImageResolution(file);
          if (!isValidRes) {
            newErrors[
              field
            ] = `Image resolution must be at least ${MIN_WIDTH}x${MIN_HEIGHT}px`;
          }
        }
      }
    }

    if (!formData.passportScan) {
      newErrors.passportScan = "Passport scan is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          submitData.append(key, value as string | Blob);
        }
      });

      const response = await fetch("/api/applicants", {
        method: "POST",
        body: submitData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(
          `Application submitted successfully! Redirecting to payment...`
        );
        
        // Redirect to payment page after 2 seconds
        setTimeout(() => {
          router.push(`/payment?applicantId=${result.applicantId}`);
        }, 2000);
      } else {
        setMessage(result.error || "Failed to submit application");
      }
    } catch (error) {
      setMessage("An error occurred while submitting the application");
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <User className="mr-2" size={24} />
        Foreign Employment Application
      </h2>

      {message && (
        <div
          className={`p-4 mb-4 rounded ${
            message.includes("successfully")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <User size={18} className="mr-2" />
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.firstName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.lastName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 flex items-center">
                <Mail size={14} className="mr-1" /> Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 flex items-center">
                <Phone size={14} className="mr-1" /> Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="+977XXXXXXXXX"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.gender ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Marital Status *
              </label>
              <select
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.maritalStatus ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
              {errors.maritalStatus && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.maritalStatus}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={2}
              className={`w-full p-2 border rounded ${
                errors.address ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Full permanent address"
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileText size={18} className="mr-2" />
            Passport Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Passport Number *
              </label>
              <input
                type="text"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.passportNumber ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 1234567"
              />
              {errors.passportNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.passportNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Nationality *
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.nationality ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.nationality && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.nationality}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 flex items-center">
                <Calendar size={14} className="mr-1" /> Passport Expiry *
              </label>
              <input
                type="date"
                name="passportExpiry"
                value={formData.passportExpiry}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.passportExpiry ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.passportExpiry && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.passportExpiry}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Passport Issue Place *
              </label>
              <input
                type="text"
                name="passportIssuePlace"
                value={formData.passportIssuePlace}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.passportIssuePlace
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="e.g., Kathmandu, Nepal"
              />
              {errors.passportIssuePlace && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.passportIssuePlace}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium mb-1 flex items-center">
              <Calendar size={14} className="mr-1" /> Date of Birth *
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded ${
                errors.dateOfBirth ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.dateOfBirth && (
              <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
            )}
          </div>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Briefcase size={18} className="mr-2" />
            Employment Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Destination Country *
              </label>
              <select
                name="destinationCountry"
                value={formData.destinationCountry}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.destinationCountry
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              >
                <option value="">Select Country</option>
                {DESTINATION_COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              {errors.destinationCountry && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.destinationCountry}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Job Position *
              </label>
              <input
                type="text"
                name="jobPosition"
                value={formData.jobPosition}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.jobPosition ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Construction Worker, Nurse, etc."
              />
              {errors.jobPosition && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.jobPosition}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Heart size={18} className="mr-2" />
            Emergency Contact
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Emergency Contact Name *
              </label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.emergencyContact ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Full name"
              />
              {errors.emergencyContact && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.emergencyContact}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Emergency Phone *
              </label>
              <input
                type="tel"
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded ${
                  errors.emergencyPhone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="+977XXXXXXXXX"
              />
              {errors.emergencyPhone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.emergencyPhone}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Heart size={18} className="mr-2" />
            Medical Information
          </h3>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Medical History
            </label>
            <textarea
              name="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Any pre-existing medical conditions, allergies, current medications, etc."
            />
          </div>
        </div>

        <div className="pb-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Upload size={18} className="mr-2" />
            Document Uploads
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Passport Scan *
              </label>
              <input
                type="file"
                name="passportScan"
                onChange={handleFileChange}
                className={`w-full p-2 border rounded ${
                  errors.passportScan ? "border-red-500" : "border-gray-300"
                }`}
                accept=".jpg,.jpeg,.png,.pdf"
              />
              {errors.passportScan && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.passportScan}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, or PDF (max 5MB, min 600x600px for images)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Medical Report (if available)
              </label>
              <input
                type="file"
                name="medicalReport"
                onChange={handleFileChange}
                className="w-full p-2 border border-gray-300 rounded"
                accept=".jpg,.jpeg,.png,.pdf"
              />
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, or PDF (max 5MB)
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Biometric Data (if available)
            </label>
            <input
              type="file"
              name="biometricData"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded"
              accept=".jpg,.jpeg,.png,.pdf"
            />
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, or PDF (max 5MB)
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </button>

          <p className="text-xs text-gray-500 mt-2 text-center">
            By submitting this form, I confirm that all information provided is
            true and accurate.
          </p>
        </div>
      </form>
    </div>
  );
};

export default ApplicantRegistrationForm;