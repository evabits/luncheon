import { getMonthlyBilling } from '@/lib/queries/payments'
import { MonthlyTableNavigator } from '@/components/admin/MonthlyTable'
import { PaymentsTable } from '@/components/admin/PaymentsTable'

export const dynamic = 'force-dynamic'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const year = params.year ? parseInt(params.year) : now.getFullYear()
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1

  const rows = await getMonthlyBilling(year, month)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {MONTHS[month - 1]} {year}
          </p>
        </div>
        <MonthlyTableNavigator year={year} month={month} basePath="/admin/payments" />
      </div>

      <PaymentsTable rows={rows} year={year} month={month} />
    </div>
  )
}
