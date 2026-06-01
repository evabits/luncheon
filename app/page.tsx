import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { cookies } from 'next/headers'

export default async function RootPage() {
  const cookieStore = await cookies()
  const kioskToken = cookieStore.get('kiosk_token')
  if (kioskToken) redirect('/kiosk')

  const session = await auth()
  if (session) {
    const role = (session.user as any).role
    if (role === 'admin') redirect('/admin/overview')
    redirect('/me')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center relative overflow-hidden">

        {/* Faint dot grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(0 0 0 / 0.07) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Radial fade so dots dissolve at edges */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 dark:hidden"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgb(249 250 251) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden dark:block"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgb(3 7 18) 100%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto">
          <img src="/lunch-website-logo.svg"      alt="Luncheon" className="h-20 mb-8 dark:hidden" />
          <img src="/lunch-website-logo-dark.svg" alt="Luncheon" className="h-20 mb-8 hidden dark:block" />

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-4">
            Lunch, made&nbsp;effortless.
          </h1>
          <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-10 max-w-sm">
            Sign in once, tap your name at the kiosk each day, and receive a tidy invoice at the end of the month.
          </p>

          <a
            href="/login"
            className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm"
          >
            Sign in
          </a>
        </div>
      </main>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section aria-label="Features" className="w-full max-w-3xl mx-auto px-6 pb-20">
        <div className="border-t border-gray-200 dark:border-gray-800 pt-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 text-center mb-8">
            Everything you need
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Kiosk check-in */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="9" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.5" className="text-gray-900 dark:text-white" />
                  <path d="M3 16c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-900 dark:text-white" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Kiosk check-in</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Tap your avatar on the shared lunch tablet to mark today&rsquo;s attendance in seconds.
                </p>
              </div>
            </div>

            {/* Lunch history */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-gray-900 dark:text-white" />
                  <path d="M5 9h8M5 12.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-900 dark:text-white" />
                  <path d="M5 5.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-400 dark:text-gray-600" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Lunch history</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Browse your attendance and see exactly what you&rsquo;ve spent each month.
                </p>
              </div>
            </div>

            {/* Automatic billing */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-gray-900 dark:text-white" />
                  <path d="M2 7.5h14" stroke="currentColor" strokeWidth="1.5" className="text-gray-900 dark:text-white" />
                  <circle cx="5.5" cy="11" r="1" fill="currentColor" className="text-gray-900 dark:text-white" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Automatic billing</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Monthly invoices are emailed with a Mollie payment link — no chasing needed.
                </p>
              </div>
            </div>

            {/* Fixed & flexible days */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-gray-900 dark:text-white" />
                  <path d="M6 2v2.5M12 2v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-900 dark:text-white" />
                  <path d="M2 7.5h14" stroke="currentColor" strokeWidth="1.5" className="text-gray-900 dark:text-white" />
                  <circle cx="6"  cy="11.5" r="1.25" fill="currentColor" className="text-gray-900 dark:text-white" />
                  <circle cx="12" cy="11.5" r="1.25" fill="currentColor" className="text-gray-200 dark:text-gray-700" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Fixed &amp; flexible days</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Set your regular lunch days and skip or add individual days as plans change.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6">
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
          {' · '}
          <a href="/terms" className="hover:underline">Terms of Service</a>
          {' · '}
          <a href="/kiosk/setup" className="hover:underline">Set up kiosk device</a>
        </p>
      </footer>

    </div>
  )
}
