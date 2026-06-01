export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/lunch-website-logo.svg" alt="Luncheon" className="h-8 dark:hidden" />
            <img src="/lunch-website-logo-dark.svg" alt="Luncheon" className="h-8 hidden dark:block" />
          </div>
          <a
            href="/login"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back to login
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Last updated: 1 June 2026</p>

        <div className="mt-8 space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">1. Who we are</h2>
            <p>
              This service is operated by <strong>Evabits</strong>, reachable at{' '}
              <a href="mailto:inkoop@evabits.com" className="underline hover:text-gray-900 dark:hover:text-white">
                inkoop@evabits.com
              </a>
              . Evabits acts as the data controller for all personal data processed through the Luncheon application
              (&ldquo;the Service&rdquo;).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2. What data we collect</h2>
            <p className="mb-3">We collect and process the following categories of personal data:</p>

            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Account data</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Name and email address</li>
              <li>Hashed password (credentials login) or Google account identity (OAuth login)</li>
              <li>Role within the application (user or administrator)</li>
              <li>Company affiliation</li>
            </ul>

            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Profile data</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Avatar image, if uploaded (stored in Vercel Blob)</li>
            </ul>

            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Attendance data</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Daily lunch attendance records linked to your account</li>
              <li>Dates of any manually skipped or retroactively added lunches</li>
            </ul>

            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Payment data</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Monthly billing totals based on recorded attendance</li>
              <li>Payment status (paid / unpaid) linked to Mollie payment links</li>
              <li>No raw card numbers or bank details are stored by us; Mollie handles all payment processing</li>
            </ul>

            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">Technical data</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Session cookies (<code className="text-sm">next-auth.session-token</code>) to keep you signed in
              </li>
              <li>
                Kiosk device tokens (<code className="text-sm">kiosk_token</code>) stored as a SHA-256 hash — only
                used to authenticate shared lunch-kiosk devices
              </li>
              <li>No analytics, advertising trackers, or third-party cookies are used</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3. Legal basis for processing</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Contract performance (Art. 6(1)(b) GDPR)</strong> — processing your account, attendance, and
                payment data is necessary to deliver the lunch-registration and billing service.
              </li>
              <li>
                <strong>Legitimate interest (Art. 6(1)(f) GDPR)</strong> — retaining historical attendance records
                for accurate reporting and audit purposes. Our interest does not override your rights; you may object
                at any time (see section 5).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4. Who we share data with</h2>
            <p className="mb-3">
              We use the following sub-processors. Data is only shared to the extent necessary to operate the Service.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Neon</strong> — PostgreSQL database hosting (EU region). Stores all structured application
                data.
              </li>
              <li>
                <strong>Vercel</strong> — Application hosting and Blob storage (EU region). Serves the application
                and stores avatar images.
              </li>
              <li>
                <strong>Mollie</strong> — Payment processing. Receives billing amounts and manages payment links.
                Mollie's own privacy policy governs data it processes as a controller.
              </li>
            </ul>
            <p className="mt-3">We do not sell, rent, or trade your personal data to any third party.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5. How long we keep data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account data</strong> — retained for the duration of your active membership, and deleted
                within 12 months of account deactivation upon request.
              </li>
              <li>
                <strong>Attendance records</strong> — retained indefinitely to preserve historical cost reports.
                Records are soft-linked to anonymised participant IDs if an account is deleted.
              </li>
              <li>
                <strong>Kiosk device tokens</strong> — automatically expire after 1 year.
              </li>
              <li>
                <strong>Session cookies</strong> — expire when you sign out or after the session lifetime configured
                in NextAuth.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">6. Your rights</h2>
            <p className="mb-3">
              Under the GDPR you have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Access</strong> — request a copy of the data we hold about you.</li>
              <li><strong>Rectification</strong> — ask us to correct inaccurate or incomplete data.</li>
              <li><strong>Erasure</strong> — ask us to delete your data where no overriding legal ground applies.</li>
              <li><strong>Portability</strong> — receive your data in a structured, machine-readable format.</li>
              <li><strong>Restriction</strong> — ask us to limit processing while a dispute is resolved.</li>
              <li>
                <strong>Objection</strong> — object to processing based on legitimate interest; we will stop unless
                we can demonstrate compelling legitimate grounds.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email{' '}
              <a href="mailto:inkoop@evabits.com" className="underline hover:text-gray-900 dark:hover:text-white">
                inkoop@evabits.com
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7. Supervisory authority</h2>
            <p>
              If you believe we are processing your data unlawfully, you have the right to lodge a complaint with the
              Dutch data protection authority:{' '}
              <strong>Autoriteit Persoonsgegevens</strong> (
              <a
                href="https://www.autoriteitpersoonsgegevens.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-900 dark:hover:text-white"
              >
                autoriteitpersoonsgegevens.nl
              </a>
              ).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">8. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be communicated via email to
              registered users. The &ldquo;Last updated&rdquo; date at the top of this page always reflects the
              current version.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">9. Contact</h2>
            <p>
              Questions about this privacy policy? Contact us at{' '}
              <a href="mailto:inkoop@evabits.com" className="underline hover:text-gray-900 dark:hover:text-white">
                inkoop@evabits.com
              </a>
              .
            </p>
          </section>

        </div>
      </main>
    </div>
  )
}
