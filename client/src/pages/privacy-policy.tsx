import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="container py-8 max-w-4xl">
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </Link>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p>Last updated: April 27, 2024</p>
          
          <h2>1. Introduction</h2>
          <p>
            Welcome to KickBook ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and share information about you when you use our services, including our website and mobile app (collectively, the "Services").
          </p>
          
          <h2>2. Information We Collect</h2>
          <p>We collect several types of information from and about users of our Services, including:</p>
          <ul>
            <li><strong>Personal Information:</strong> This includes information such as your name, email address, postal address, phone number, and any other identifier by which you may be contacted online or offline.</li>
            <li><strong>Profile Information:</strong> This includes information such as your username, password, and profile picture.</li>
            <li><strong>Payment Information:</strong> When you make a purchase or transaction through our Services, we collect payment information, including credit card numbers, billing information, and other financial data.</li>
            <li><strong>Usage Information:</strong> We collect information about how you use our Services, such as the pages you visit, the links you click, and the features you use.</li>
            <li><strong>Device Information:</strong> We collect information about the device you use to access our Services, including the hardware model, operating system, unique device identifiers, and mobile network information.</li>
          </ul>
          
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our Services</li>
            <li>Process transactions and send related information, including confirmations, receipts, and booking details</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Send you technical notices, updates, security alerts, and support and administrative messages</li>
            <li>Communicate with you about products, services, offers, promotions, rewards, and events</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our Services</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities and protect the rights and property of KickBook and others</li>
            <li>Personalize the Services and provide content and features that match your profile and interests</li>
          </ul>
          
          <h2>4. Sharing of Information</h2>
          <p>We may share information about you as follows:</p>
          <ul>
            <li><strong>With Team Admins and Members:</strong> If you are part of a team, we may share your information with the team administrators and other team members.</li>
            <li><strong>With Service Providers:</strong> We may share your information with third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</li>
            <li><strong>For Legal Reasons:</strong> We may share information if we believe disclosure is in accordance with any applicable law, regulation, legal process, or governmental request.</li>
            <li><strong>With Your Consent:</strong> We may share information with your consent or at your direction.</li>
          </ul>
          
          <h2>5. Data Retention</h2>
          <p>
            We store the information we collect about you for as long as is necessary for the purposes for which we originally collected it, or for other legitimate business purposes, including to meet our legal, regulatory, or other compliance obligations.
          </p>
          
          <h2>6. Your Rights</h2>
          <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
          <ul>
            <li>The right to access personal information we hold about you</li>
            <li>The right to request that we update, correct, or delete your personal information</li>
            <li>The right to object to our processing of your personal information</li>
            <li>The right to withdraw your consent to our processing of your information</li>
            <li>The right to receive a copy of your personal information in a structured, machine-readable format</li>
          </ul>
          
          <h2>7. Children's Privacy</h2>
          <p>
            Our Services are not intended for children under the age of 16. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and you believe your child has provided us with personal information, please contact us.
          </p>
          
          <h2>8. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or through the Services prior to the changes becoming effective.
          </p>
          
          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at support@kickbook.com.
          </p>
        </div>
      </div>
    </div>
  );
}