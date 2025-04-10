import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compliance | Your Company',
  description: 'Learn about our commitment to data protection and regulatory compliance.',
};

export default function CompliancePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Compliance & Data Protection</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">GDPR Compliance</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          We are committed to protecting your privacy and ensuring compliance with the General Data Protection Regulation (GDPR). Our platform implements appropriate technical and organizational measures to safeguard your personal data.
        </p>
        <ul className="list-disc pl-6 mb-4 text-gray-600 dark:text-gray-300">
          <li>Data minimization and purpose limitation</li>
          <li>Transparent data processing practices</li>
          <li>Secure data storage and transfer mechanisms</li>
          <li>Regular security assessments and updates</li>
          <li>Data subject rights fulfillment</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Cookie Compliance</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Our cookie consent management system ensures compliance with ePrivacy Directive and GDPR requirements. We provide:
        </p>
        <ul className="list-disc pl-6 mb-4 text-gray-600 dark:text-gray-300">
          <li>Granular cookie consent options</li>
          <li>Clear information about cookie purposes</li>
          <li>Easy-to-use preference management</li>
          <li>Regular cookie audits and updates</li>
          <li>Transparent data collection practices</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">HIPAA Compliance (In Progress)</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          We are actively working towards achieving HIPAA compliance to better serve healthcare organizations. Our roadmap includes:
        </p>
        <ul className="list-disc pl-6 mb-4 text-gray-600 dark:text-gray-300">
          <li>Implementation of required administrative safeguards</li>
          <li>Enhanced physical and technical security measures</li>
          <li>Development of business associate agreements</li>
          <li>Regular risk assessments and audits</li>
          <li>Staff training on HIPAA requirements</li>
        </ul>
        <p className="italic text-gray-600 dark:text-gray-300">
          Note: While we are working towards HIPAA compliance, our platform is not currently HIPAA-compliant. Please contact our sales team for more information about our compliance roadmap.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Additional Compliance Measures</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Beyond the above regulations, we maintain:
        </p>
        <ul className="list-disc pl-6 mb-4 text-gray-600 dark:text-gray-300">
          <li>Regular security audits and penetration testing</li>
          <li>Data encryption in transit and at rest</li>
          <li>Incident response and breach notification procedures</li>
          <li>Vendor security assessments</li>
          <li>Employee security training programs</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Contact Us</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          If you have any questions about our compliance measures or would like to request specific compliance documentation, please contact our compliance team at:
        </p>
        <p className="font-medium text-gray-800 dark:text-gray-200">
          <a href="mailto:compliance@yourcompany.com" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            compliance@yourcompany.com
          </a>
        </p>
      </section>
    </div>
  );
} 