import { getConfig } from '@/lib/queries/config'
import { SettingsForm } from '@/components/admin/SettingsForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const cfg = await getConfig()

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
      <div className="max-w-sm bg-white rounded-xl border border-gray-200 p-6">
        <SettingsForm initialCost={cfg ? Number(cfg.costPerLunch) : 85} />
      </div>
    </div>
  )
}
