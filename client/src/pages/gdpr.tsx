import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function GDPR() {
  return (
    <div className="container py-8 max-w-4xl">
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </Link>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6">GDPR Compliance</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p>Last updated: April 27, 2024</p>
          
          <h2>1. Introduction</h2>
          <p>
            At KickBook, we are committed to protecting and respecting your privacy in compliance with the EU General Data Protection Regulation (GDPR). This policy explains when and why we collect personal information, how we use it, the conditions under which we may disclose it to others, and how we keep it secure.
          </p>
          
          <h2>2. Data Controller</h2>
          <p>
            KickBook is the data controller for the personal information we collect and process. If you have any questions about this policy or our data practices, please contact us at privacy@kickbook.com.
          </p>
          
          <h2>3. Legal Basis for Processing Personal Data</h2>
          <p>We process your personal data based on the following legal grounds:</p>
          <ul>
            <li><strong>Consent:</strong> Where you have given us clear consent to process your personal data for a specific purpose.</li>
            <li><strong>Contract:</strong> Where processing is necessary for the performance of a contract with you.</li>
            <li><strong>Legal Obligation:</strong> Where processing is necessary to comply with a legal obligation.</li>
            <li><strong>Legitimate Interests:</strong> Where processing is necessary for our legitimate interests or the legitimate interests of a third party, provided your fundamental rights and freedoms do not override those interests.</li>
          </ul>
          
          <h2>4. Your Data Protection Rights</h2>
          <p>Under the GDPR, you have the following rights:</p>
          <ul>
            <li><strong>Right to Access:</strong> You have the right to request copies of your personal data.</li>
            <li><strong>Right to Rectification:</strong> You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.</li>
            <li><strong>Right to Erasure:</strong> You have the right to request that we erase your personal data, under certain conditions.</li>
            <li><strong>Right to Restrict Processing:</strong> You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
            <li><strong>Right to Object to Processing:</strong> You have the right to object to our processing of your personal data, under certain conditions.</li>
            <li><strong>Right to Data Portability:</strong> You have the right to request that we transfer the data we have collected to another organization, or directly to you, under certain conditions.</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at privacy@kickbook.com. We will respond to your request within one month. There is no fee for making a request.
          </p>
          
          <h2>5. Data We Collect</h2>
          <p>We collect the following types of personal data:</p>
          <ul>
            <li><strong>Identity Data:</strong> Includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data:</strong> Includes email address, billing address, and telephone number.</li>
            <li><strong>Financial Data:</strong> Includes payment card details and transaction data.</li>
            <li><strong>Profile Data:</strong> Includes your username, password, purchases or orders made by you, your preferences, feedback, and survey responses.</li>
            <li><strong>Usage Data:</strong> Includes information about how you use our website, products, and services.</li>
            <li><strong>Technical Data:</strong> Includes internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access our website.</li>
          </ul>
          
          <h2>6. Data Retention</h2>
          <p>
            We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.
          </p>
          <p>
            To determine the appropriate retention period for personal data, we consider the amount, nature, and sensitivity of the personal data, the potential risk of harm from unauthorized use or disclosure of your personal data, the purposes for which we process your personal data, and whether we can achieve those purposes through other means, and the applicable legal requirements.
          </p>
          
          <h2>7. Data Security</h2>
          <p>
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
          </p>
          <p>
            We have put in place procedures to deal with any suspected personal data breach and will notify you and any applicable regulator of a breach where we are legally required to do so.
          </p>
          
          <h2>8. International Transfers</h2>
          <p>
            We may transfer your personal data to countries outside the European Economic Area (EEA). Whenever we transfer your personal data out of the EEA, we ensure a similar degree of protection is afforded to it by ensuring at least one of the following safeguards is implemented:
          </p>
          <ul>
            <li>We will only transfer your personal data to countries that have been deemed to provide an adequate level of protection for personal data by the European Commission.</li>
            <li>Where we use certain service providers, we may use specific contracts approved by the European Commission which give personal data the same protection it has in Europe.</li>
            <li>Where we use providers based in the US, we may transfer data to them if they are part of the Privacy Shield which requires them to provide similar protection to personal data shared between Europe and the US.</li>
          </ul>
          
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. If we make material changes, we will notify you by email or through the Services prior to the changes becoming effective.
          </p>
          
          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about this policy or our data practices, please contact us at privacy@kickbook.com.
          </p>
          <p>
            You have the right to make a complaint at any time to your local data protection authority. However, we would appreciate the chance to deal with your concerns before you approach the authority, so please contact us in the first instance.
          </p>
        </div>
      </div>
    </div>
  );
}