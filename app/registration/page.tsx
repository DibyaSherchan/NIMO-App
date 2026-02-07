import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ApplicantRegistrationForm from "@/app/component/ApplicantRegistrationForm";

/**
 * Registration page for foreign employment applicants
 * Protected route - requires authentication
 */
export default async function RegistrationPage() {
  // Check user authentication status
  const session = await auth();
  
  // Redirect to sign-in if not authenticated
  if (!session) {
    redirect("/auth/signin");
  }
  
  // Render the registration form for authenticated users
  return (
    <div className="min-h-screen bg-gray-100 py-8 text-black">
      <div className="container mx-auto px-4">
        <ApplicantRegistrationForm />
      </div>
    </div>
  );
}