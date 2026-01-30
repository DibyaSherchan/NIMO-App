import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ApplicantRegistrationForm from "@/app/component/ApplicantRegistrationForm";


export default async function RegistrationPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  return (
    <div className="min-h-screen bg-gray-100 py-8 text-black">
      <div className="container mx-auto px-4">
        <ApplicantRegistrationForm />
      </div>
    </div>
  );
}