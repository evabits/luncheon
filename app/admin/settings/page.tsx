import { getConfig } from '@/lib/queries/config'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { ChangePasswordForm } from '@/components/admin/ChangePasswordForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const cfg = await getConfig()

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>
      <div className="space-y-6 max-w-sm">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Lunch cost</h3>
          <SettingsForm initialCost={cfg ? Number(cfg.costPerLunch) : 85} />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Change password</h3>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
