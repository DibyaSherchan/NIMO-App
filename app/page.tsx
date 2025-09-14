"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import Head from "next/head";
import {
  Globe,
  FileText,
  TestTube,
  Users,
  Shield,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Microscope,
  Eye,
  Calendar,
  FileCheck,
  AlertCircle,
  Activity,
} from "lucide-react";

// FAQ Data
const faqs = [
  {
    question: "What is NIMO?",
    answer:
      "NIMO is a comprehensive Foreign Employment Information Management System that integrates health management and various automation features to streamline the process of foreign employment applications.",
  },
  {
    question: "What medical tests are required for foreign employment?",
    answer:
      "Common tests include HIV, TB screening, X-rays, blood tests, and general health checkups. The specific requirements depend on your destination country.",
  },
  {
    question: "How long does the application process take?",
    answer:
      "The complete process typically takes 2-4 weeks, depending on medical test results and permit processing times.",
  },
  {
    question: "Can I track my application status?",
    answer:
      "Yes, you can log into your dashboard to track your application status, view medical reports, and monitor permit processing in real-time.",
  },
  {
    question: "What documents do I need to upload?",
    answer:
      "You'll need passport scans, medical reports, biometric data, and any additional documents required by your destination country. Supported formats: JPG, PDF, PNG.",
  },
  {
    question: "How do I register on NIMO?",
    answer:
      "Click 'Get Started' or 'Sign In' and follow the registration process. Choose your role (Foreign Employee, Agent, or Medical Organization) and complete the required information.",
  },
  {
    question: "Are my medical records secure?",
    answer:
      "Yes, all medical data is encrypted and stored securely with role-based access controls. Only authorized personnel can view your medical information.",
  },
  {
    question: "Can I download my medical reports?",
    answer:
      "Yes, once your tests are completed, you can download PDF reports with QR code verification from your dashboard.",
  },
];

// Services data
const services = [
  {
    icon: <Globe className="text-blue-500" size={32} />,
    title: "Foreign Employment Processing",
    description:
      "Complete processing of foreign employment applications with real-time status tracking.",
  },
  {
    icon: <TestTube className="text-green-500" size={32} />,
    title: "Medical Examinations",
    description:
      "Comprehensive medical tests including HIV, TB, X-rays, and health screenings required for foreign employment.",
  },
  {
    icon: <FileText className="text-purple-500" size={32} />,
    title: "Document Management",
    description:
      "Secure upload and management of all required documents with validation and verification.",
  },
  {
    icon: <Users className="text-orange-500" size={32} />,
    title: "Agent Services",
    description:
      "Connect with certified agents who can guide you through the entire employment process.",
  },
];

// Lab Tests Information
const labTests = [
  {
    icon: <TestTube className="text-red-500" size={24} />,
    name: "HIV Testing",
    description: "Rapid HIV screening and confirmatory tests",
    turnaround: "24-48 hours",
  },
  {
    icon: <Activity className="text-blue-500" size={24} />,
    name: "TB Screening",
    description: "Tuberculosis screening including chest X-rays",
    turnaround: "2-3 days",
  },
  {
    icon: <Microscope className="text-green-500" size={24} />,
    name: "Blood Tests",
    description: "Complete blood count and biochemical analysis",
    turnaround: "24 hours",
  },
  {
    icon: <Eye className="text-purple-500" size={24} />,
    name: "General Health",
    description: "Physical examination and health assessment",
    turnaround: "Same day",
  },
  {
    icon: <FileCheck className="text-orange-500" size={24} />,
    name: "Medical Certificate",
    description: "Official medical fitness certificate with QR verification",
    turnaround: "3-5 days",
  },
];

// Registration Steps
const registrationSteps = [
  {
    step: 1,
    title: "Create Account",
    description: "Sign up with your email and choose your role (Employee, Agent, or Medical Organization)",
    icon: <UserPlus className="text-blue-500" size={24} />,
  },
  {
    step: 2,
    title: "Complete Profile",
    description: "Fill in your personal information, contact details, and upload required documents",
    icon: <FileText className="text-green-500" size={24} />,
  },
  {
    step: 3,
    title: "Verification",
    description: "Our team verifies your information and activates your account",
    icon: <CheckCircle className="text-purple-500" size={24} />,
  },
  {
    step: 4,
    title: "Start Using NIMO",
    description: "Access your dashboard and begin your foreign employment journey",
    icon: <Globe className="text-orange-500" size={24} />,
  },
];

// FAQ Component
const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="bg-gray-50 py-16 text-black">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg border">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
              >
                <span className="font-medium">{faq.question}</span>
                {openFAQ === index ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
              {openFAQ === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// User Registration Information Section
const RegistrationSection = () => {
  return (
    <div className="py-16 bg-white text-black">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Getting Started with NIMO</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Join thousands of users who trust NIMO for their foreign employment needs. 
            Registration is simple and secure, with different account types for employees, agents, and medical organizations.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {registrationSteps.map((step) => (
            <div key={step.step} className="text-center">
              <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                {step.icon}
              </div>
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                {step.step}
              </div>
              <h3 className="font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 rounded-lg p-8">
          <h3 className="text-xl font-bold mb-4">Account Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-blue-600 mb-2">Foreign Employee</h4>
              <p className="text-sm text-gray-600">For individuals seeking foreign employment opportunities</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-green-600 mb-2">Recruitment Agent</h4>
              <p className="text-sm text-gray-600">For certified agents managing employee applications</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-bold text-purple-600 mb-2">Medical Organization</h4>
              <p className="text-sm text-gray-600">For healthcare providers conducting medical examinations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Lab Tests Section
const LabTestsSection = () => {
  return (
    <div className="py-16 bg-gray-50 text-black">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Medical Laboratory Tests</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            NIMO partners with certified medical laboratories to provide comprehensive health screenings 
            required for foreign employment. All tests are conducted by qualified professionals with 
            quick turnaround times.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {labTests.map((test, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                {test.icon}
                <h3 className="font-bold ml-3">{test.name}</h3>
              </div>
              <p className="text-gray-600 mb-3">{test.description}</p>
              <div className="flex items-center text-sm">
                <Clock size={16} className="text-blue-500 mr-2" />
                <span className="text-blue-600 font-medium">Turnaround: {test.turnaround}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg p-8 border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Test Booking Process</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle size={20} className="text-green-500 mr-3 mt-0.5" />
                  <span>Select required tests based on your destination country</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={20} className="text-green-500 mr-3 mt-0.5" />
                  <span>Book appointment at partnered medical centers</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={20} className="text-green-500 mr-3 mt-0.5" />
                  <span>Receive digital reports with QR code verification</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle size={20} className="text-green-500 mr-3 mt-0.5" />
                  <span>Automatic integration with your employment application</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quality Assurance</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Shield size={20} className="text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Certified Laboratories</p>
                    <p className="text-sm text-gray-600">All partner labs are internationally certified</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FileCheck size={20} className="text-green-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Digital Reports</p>
                    <p className="text-sm text-gray-600">Secure, verifiable digital certificates</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <AlertCircle size={20} className="text-orange-500 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">Data Privacy</p>
                    <p className="text-sm text-gray-600">HIPAA-compliant data handling</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Thank you for your message! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white py-16 text-black">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Contact Us</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-xl font-bold mb-6">Get in Touch</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Phone className="text-blue-500 mr-4" size={20} />
                <span>+977-1-4567890</span>
              </div>
              <div className="flex items-center">
                <Mail className="text-blue-500 mr-4" size={20} />
                <span>info@nimo.com.np</span>
              </div>
              <div className="flex items-center">
                <MapPin className="text-blue-500 mr-4" size={20} />
                <span>Kathmandu, Nepal</span>
              </div>
            </div>
            <div className="mt-8">
              <h4 className="font-bold mb-4">Office Hours</h4>
              <p className="text-gray-600">
                Monday - Friday: 9:00 AM - 6:00 PM
              </p>
              <p className="text-gray-600">Saturday: 9:00 AM - 1:00 PM</p>
              <p className="text-gray-600">Sunday: Closed</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Subject *
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="registration">Account Registration</option>
                <option value="medical">Medical Tests</option>
                <option value="application">Application Status</option>
                <option value="technical">Technical Support</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Google Analytics Component
const GoogleAnalytics = ({ measurementId }: { measurementId: string }) => {
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}');
          `,
        }}
      />
    </>
  );
};

export default function Home() {
  return (
    <>
      <Head>
        <title>NIMO - Foreign Employment Information Management System</title>
        <meta name="description" content="Streamline your foreign employment journey with NIMO's comprehensive health management and automation features. Secure, fast, and reliable processing for international job seekers." />
        <meta name="keywords" content="foreign employment, medical tests, NIMO, Nepal, international jobs, health screening, employment processing" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="NIMO - Foreign Employment Information Management System" />
        <meta property="og:description" content="Your comprehensive solution for foreign employment applications with integrated health management." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://nimo.com.np" />
      </Head>
      
      <GoogleAnalytics measurementId="GA_MEASUREMENT_ID" />
      
      <div className="min-h-screen bg-white text-black">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Shield className="text-blue-600 mr-2" size={32} />
              <h1 className="text-2xl font-bold text-gray-800">NIMO</h1>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="#services"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Services
              </Link>
              <Link href="#registration" className="text-gray-600 hover:text-blue-600 transition-colors">
                Registration
              </Link>
              <Link href="#lab-tests" className="text-gray-600 hover:text-blue-600 transition-colors">
                Lab Tests
              </Link>
              <Link href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">
                About
              </Link>
              <Link href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                Contact
              </Link>
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-5xl font-bold text-gray-800 mb-6">
              Welcome to NIMO
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your comprehensive Foreign Employment Information Management System.
              Streamline your journey to international employment with our
              integrated health management and automation features.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/auth/signin"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              >
                Get Started Today
              </Link>
              <Link
                href="#services"
                className="px-8 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition duration-200 font-medium"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose NIMO */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Choose NIMO?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <Shield className="text-blue-500 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold mb-2">Secure & Reliable</h3>
                <p className="text-gray-600">
                  Your data is protected with enterprise-grade security and
                  encryption.
                </p>
              </div>
              <div className="text-center">
                <Clock className="text-green-500 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold mb-2">Fast Processing</h3>
                <p className="text-gray-600">
                  Streamlined processes reduce application time by up to 50%.
                </p>
              </div>
              <div className="text-center">
                <CheckCircle className="text-purple-500 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold mb-2">Real-time Tracking</h3>
                <p className="text-gray-600">
                  Track your application status and medical reports in real-time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="bg-gray-50 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start">
                    <div className="mr-4">{service.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Registration Section */}
        <section id="registration">
          <RegistrationSection />
        </section>

        {/* Lab Tests Section */}
        <section id="lab-tests">
          <LabTestsSection />
        </section>

        {/* About Section */}
        <section id="about" className="py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-8">About NIMO</h2>
            <p className="text-lg text-gray-600 mb-6">
              NIMO is a cutting-edge Foreign Employment Information Management
              System that revolutionizes how foreign employment applications are
              processed. Our platform integrates health management information
              systems with advanced automation features to provide a seamless
              experience for applicants, agents, and medical organizations.
            </p>
            <p className="text-lg text-gray-600">
              With features like real-time application tracking, automated report
              generation with QR code validation, and role-based access control,
              NIMO ensures efficiency, security, and transparency throughout the
              entire foreign employment process.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection />

        {/* Contact Section */}
        <section id="contact">
          <ContactForm />
        </section>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center mb-4">
                  <Shield className="text-blue-400 mr-2" size={32} />
                  <h3 className="text-xl font-bold">NIMO</h3>
                </div>
                <p className="text-gray-300">
                  Streamlining foreign employment processes with advanced
                  technology and secure management systems.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="#services"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#registration"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Registration
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#lab-tests"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Lab Tests
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#about"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#contact"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/auth/signin"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Sign In
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Contact Info</h4>
                <p className="text-gray-300">Email: info@nimo.com.np</p>
                <p className="text-gray-300">Phone: +977-1-4567890</p>
                <p className="text-gray-300">Location: Kathmandu, Nepal</p>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center">
              <p className="text-gray-300">
                &copy; 2025 NIMO. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}