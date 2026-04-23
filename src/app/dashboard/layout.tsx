import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { Compass, LogOut, LayoutDashboard } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-slate-900 font-semibold"
            >
              <Compass className="h-6 w-6 text-brand-600" />
              <span>TourVista</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1 text-sm">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-slate-700 hover:bg-slate-100"
              >
                <LayoutDashboard className="h-4 w-4" />
                Mes biens
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">{user.name || user.email}</p>
              {user.agencyName && (
                <p className="text-xs text-slate-500">{user.agencyName}</p>
              )}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
