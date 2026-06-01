export default function TermsPage() {
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Last updated: 1 June 2026</p>

        <div className="mt-8 space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">1. About the Service</h2>
            <p>
              Luncheon is an internal lunch-registration and billing application operated by <strong>Evabits</strong>{' '}
              (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). It allows participating employees to register
              daily lunch attendance and receive a monthly invoice for the meals consumed. By using the Service you
              agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">2. Access &amp; accounts</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Access to the Service is granted by an administrator. You may not create an account without an
                invitation or admin setup.
              </li>
              <li>
                You are responsible for keeping your login credentials confidential. Do not share your password with
                anyone.
              </li>
              <li>
                You must provide accurate information (name, email) and keep it up to date. Inaccurate data may
                result in incorrectly issued invoices.
              </li>
              <li>
                If you suspect unauthorised access to your account, notify{' '}
                <a href="mailto:inkoop@evabits.com" className="underline hover:text-gray-900 dark:hover:text-white">
                  inkoop@evabits.com
                </a>{' '}
                immediately.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">3. Attendance registration</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                You are responsible for accurately registering your own attendance, whether via the kiosk or the user
                portal.
              </li>
              <li>
                Retroactive additions are limited to the previous 30 calendar days. Omissions outside this window
                cannot be corrected through the application; contact an administrator directly.
              </li>
              <li>
                Deliberate false registrations (registering for lunches not consumed) are a misuse of the Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">4. Payment &amp; billing</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                A monthly invoice is generated based on the attendance records for that month. The cost per lunch is
                set by the administrator and may change for future months.
              </li>
              <li>
                Invoices are sent by email and include a payment link powered by Mollie. Payment is due within the
                period stated on the invoice.
              </li>
              <li>
                If you believe an invoice contains an error, contact{' '}
                <a href="mailto:inkoop@evabits.com" className="underline hover:text-gray-900 dark:hover:text-white">
                  inkoop@evabits.com
                </a>{' '}
                within 14 days of receiving the invoice.
              </li>
              <li>
                We do not store your payment card details. Payment processing is handled by Mollie B.V. under their
                own terms and privacy policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">5. Service availability</h2>
            <p>
              The Service is provided on a best-effort basis for internal use. We do not guarantee any specific
              uptime or availability. Planned maintenance will be communicated in advance where possible. We are not
              liable for any inconvenience caused by downtime or interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">6. Acceptable use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Attempt to gain unauthorised access to other users&apos; accounts or data</li>
              <li>Interfere with or disrupt the Service or its underlying infrastructure</li>
              <li>Use the Service for any purpose other than internal lunch registration</li>
              <li>Upload avatar images that are offensive, illegal, or infringe third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7. Account termination</h2>
            <p>
              Administrators may deactivate or remove your account at any time, for example when you leave the
              organisation. You may also request deletion of your own account by emailing{' '}
              <a href="mailto:inkoop@evabits.com" className="underline hover:text-gray-900 dark:hover:text-white">
                inkoop@evabits.com
              </a>
              . Attendance records may be retained in anonymised form for historical reporting purposes; see the{' '}
              <a href="/privacy" className="underline hover:text-gray-900 dark:hover:text-white">
                Privacy Policy
              </a>{' '}
              for details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">8. Changes to these Terms</h2>
            <p>
              We may update these Terms. Material changes will be communicated by email at least 14 days before they
              take effect. Continued use of the Service after the effective date constitutes acceptance of the revised
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">9. Governing law</h2>
            <p>
              These Terms are governed by Dutch law. Any disputes that cannot be resolved amicably will be submitted
              to the competent court in the Netherlands.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">10. Contact</h2>
            <p>
              Questions about these Terms? Contact us at{' '}
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
