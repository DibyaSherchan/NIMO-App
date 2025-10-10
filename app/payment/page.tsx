"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Smartphone, Banknote, CheckCircle } from "lucide-react";
function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applicantId, setApplicantId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  
  useEffect(() => {
    if (searchParams) {
      setApplicantId(searchParams.get("applicantId"));
    }
  }, [searchParams]);

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setMessage("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleQRPayment = async () => {
    if (!paymentProof) {
      setMessage("Please upload payment proof before submitting");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("applicantId", applicantId || "");
      formData.append("paymentMethod", "qr_phonepay");
      formData.append("paymentProof", paymentProof);

      const response = await fetch("/api/payment", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("Payment proof submitted successfully! You will be notified once verified.");
        setTimeout(() => {
          router.push("/dashboard/foreign");
        }, 3000);
      } else {
        setMessage(result.error || "Failed to submit payment");
      }
    } catch (error) {
      setMessage("An error occurred while submitting payment");
      console.error("Payment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCashOrCardPayment = async () => {
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicantId: applicantId,
          paymentMethod: selectedMethod,
          paymentStatus: "pending_reception",
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("Payment method recorded. Please proceed to reception.");
        setTimeout(() => {
          router.push("/dashboard/foreign");
        }, 3000);
      } else {
        setMessage(result.error || "Failed to record payment method");
      }
    } catch (error) {
      setMessage("An error occurred");
      console.error("Payment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedMethod) {
      setMessage("Please select a payment method");
      return;
    }

    if (selectedMethod === "qr_phonepay") {
      handleQRPayment();
    } else {
      handleCashOrCardPayment();
    }
  };
  
  if (applicantId === null) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment page...</p>
        </div>
      </div>
    );
  }

  if (!applicantId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 text-red-800 p-4 rounded">
          No application ID found. Please complete the registration form first.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <CheckCircle className="mr-2 text-green-600" size={24} />
        Complete Your Payment
      </h2>

      {message && (
        <div
          className={`p-4 mb-4 rounded ${
            message.includes("success") || message.includes("recorded")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <p className="text-gray-600 mb-6">
        Application ID: <span className="font-semibold">{applicantId}</span>
      </p>

      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>

        {/* QR Code PhonePay Option */}
        <div
          onClick={() => handlePaymentMethodSelect("qr_phonepay")}
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === "qr_phonepay"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300 hover:border-blue-400"
          }`}
        >
          <div className="flex items-center">
            <Smartphone className="mr-3 text-blue-600" size={24} />
            <div className="flex-1">
              <h4 className="font-semibold">QR Code / PhonePay</h4>
              <p className="text-sm text-gray-600">Scan QR code and pay instantly</p>
            </div>
          </div>

          {selectedMethod === "qr_phonepay" && (
            <div className="mt-4 space-y-4">
              <div className="bg-white p-4 rounded border border-gray-300 flex justify-center">
                <img
                  src="https://placehold.co/300x300/png?text=QR+Code+Here"
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  After payment, please upload your payment screenshot/receipt below
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Payment Proof *
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                {paymentProof && (
                  <p className="text-sm text-green-600 mt-1">
                    File selected: {paymentProof.name}
                  </p>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  <strong>For verification, send payment proof to:</strong>
                  <br />
                  Email: payment@nipponhealth.com
                  <br />
                  Phone: +977-XXXXXXXXXX
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Card Payment Option */}
        <div
          onClick={() => handlePaymentMethodSelect("card")}
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === "card"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300 hover:border-blue-400"
          }`}
        >
          <div className="flex items-center">
            <CreditCard className="mr-3 text-blue-600" size={24} />
            <div className="flex-1">
              <h4 className="font-semibold">Card Payment</h4>
              <p className="text-sm text-gray-600">Pay with Credit/Debit card at reception</p>
            </div>
          </div>

          {selectedMethod === "card" && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded p-4">
              <p className="text-sm text-orange-800 font-semibold mb-2">
                Please proceed to pay at the reception
              </p>
              <p className="text-sm text-gray-700">
                <strong>Location:</strong> Nippon Health Care and Medical Institute
                <br />
                Present your Application ID: <strong>{applicantId}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Cash Payment Option */}
        <div
          onClick={() => handlePaymentMethodSelect("cash")}
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === "cash"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300 hover:border-blue-400"
          }`}
        >
          <div className="flex items-center">
            <Banknote className="mr-3 text-blue-600" size={24} />
            <div className="flex-1">
              <h4 className="font-semibold">Cash Payment</h4>
              <p className="text-sm text-gray-600">Pay with cash at reception</p>
            </div>
          </div>

          {selectedMethod === "cash" && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded p-4">
              <p className="text-sm text-orange-800 font-semibold mb-2">
                Please proceed to pay at the reception
              </p>
              <p className="text-sm text-gray-700">
                <strong>Location:</strong> Nippon Health Care and Medical Institute
                <br />
                Present your Application ID: <strong>{applicantId}</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedMethod}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            "Confirm Payment Method"
          )}
        </button>
      </div>
    </div>
  );
}
const PaymentPage = () => {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment page...</p>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
};

export default PaymentPage;