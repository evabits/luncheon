import { getCompanies } from '@/lib/queries/companies'
import { CompaniesClient } from '@/components/admin/CompaniesClient'

export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  const companies = await getCompanies()
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Companies</h2>
      <CompaniesClient initialCompanies={companies} />
    </div>
  )
}
