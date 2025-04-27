import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
  return (
    <div className="container py-8 max-w-4xl">
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </Link>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p>Last updated: April 27, 2024</p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the KickBook service, including our mobile application and website (collectively, the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the Service.
          </p>
          
          <h2>2. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. If we make material changes to these terms, we will notify you by email or through the Service. Your continued use of the Service after such notification constitutes your acceptance of the updated terms.
          </p>
          
          <h2>3. Eligibility</h2>
          <p>
            You must be at least 16 years old to use our Service. By using our Service, you represent and warrant that you meet the eligibility requirements and that you have the right, authority, and capacity to enter into these terms.
          </p>
          
          <h2>4. User Accounts</h2>
          <p>
            To use certain features of the Service, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.
          </p>
          
          <h2>5. User Content</h2>
          <p>
            Our Service allows you to post, link, store, share, and otherwise make available certain information, text, graphics, videos, or other material ("User Content"). You are responsible for the User Content that you post on or through the Service, including its legality, reliability, and appropriateness.
          </p>
          <p>
            By posting User Content on or through the Service, you grant us the right to use, modify, publicly perform, publicly display, reproduce, and distribute such content on and through the Service. You retain any and all of your rights to any User Content you submit, post, or display on or through the Service and you are responsible for protecting those rights.
          </p>
          
          <h2>6. Bookings and Credits</h2>
          <p>
            The Service allows users to book sports venues and manage team activities using credits. Credits are a form of digital currency that can be purchased through the Service. Credits expire 12 months after purchase if not used.
          </p>
          <p>
            Bookings made through the Service are subject to the availability and policies of the venue. We are not responsible for any changes, cancellations, or closures made by venues. Refunds for cancelled bookings will be issued in accordance with the cancellation policy specified at the time of booking.
          </p>
          
          <h2>7. Payments</h2>
          <p>
            You agree to pay all fees or charges to your account based on the fees, charges, and billing terms in effect at the time a fee or charge is due and payable. If you dispute any charges, you must let us know within 60 days after the date that we invoice you.
          </p>
          <p>
            Payment processing services for users on KickBook are provided by Stripe and are subject to the Stripe Connected Account Agreement, which includes the Stripe Terms of Service (collectively, the "Stripe Services Agreement"). By agreeing to these terms or continuing to operate as a user on KickBook, you agree to be bound by the Stripe Services Agreement, as the same may be modified by Stripe from time to time.
          </p>
          
          <h2>8. Cancellation and Refunds</h2>
          <p>
            You can cancel your subscription at any time by contacting us. Upon cancellation, your subscription will remain active until the end of your current billing cycle, after which it will not renew.
          </p>
          <p>
            Refunds for credits may be issued at our discretion, typically in cases of technical error or service unavailability. Refunds for subscriptions are generally not provided after the subscription period has begun, unless required by law.
          </p>
          
          <h2>9. Prohibited Conduct</h2>
          <p>You agree not to engage in any of the following prohibited activities:</p>
          <ul>
            <li>Using the Service for any illegal purpose or in violation of any local, state, national, or international law</li>
            <li>Harassing, threatening, or intimidating other users</li>
            <li>Impersonating or misrepresenting your affiliation with any person or entity</li>
            <li>Posting or transmitting any content that is unlawful, fraudulent, or infringes on the rights of others</li>
            <li>Attempting to access or search the Service through the use of any tool, device, or mechanism other than through our publicly supported interfaces</li>
            <li>Using the Service in any manner that could disable, overburden, damage, or impair the Service</li>
          </ul>
          
          <h2>10. Limitation of Liability</h2>
          <p>
            In no event shall KickBook, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence), or any other legal theory, whether or not we have been informed of the possibility of such damage.
          </p>
          
          <h2>11. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law provisions.
          </p>
          
          <h2>12. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at support@kickbook.com.
          </p>
        </div>
      </div>
    </div>
  );
}