import { getMonthlyReport } from '@/lib/queries/sessions'
import { MonthlyTable, MonthlyTableNavigator } from '@/components/admin/MonthlyTable'

export const dynamic = 'force-dynamic'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface Props {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function OverviewPage({ searchParams }: Props) {
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.year ?? String(now.getFullYear()))
  const month = parseInt(params.month ?? String(now.getMonth() + 1))

  const report = await getMonthlyReport(year, month)

  const totalLunches = report.reduce((sum, r) => sum + r.lunch_count, 0)
  const totalCost = report.reduce((sum, r) => sum + Number(r.total_cost), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          <span className="text-gray-900 dark:text-white">{MONTH_NAMES[month - 1]} {year}</span>
        </h2>
        <MonthlyTableNavigator year={year} month={month} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total lunches</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalLunches}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total cost</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">€{totalCost.toFixed(2)}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Participants</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{report.length}</div>
        </div>
      </div>

      <MonthlyTable rows={report} />
    </div>
  )
}
