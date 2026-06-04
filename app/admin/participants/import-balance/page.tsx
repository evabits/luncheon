import { ImportBalanceClient } from '@/components/admin/ImportBalanceClient'

export default function ImportBalancePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Starting Balances</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Set historical debt for participants using a CSV file. Underscores, trailing dots, and capitalisation differences are handled automatically.
        </p>
      </div>
      <ImportBalanceClient />
    </div>
  )
}
