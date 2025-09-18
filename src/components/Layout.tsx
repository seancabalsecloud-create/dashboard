import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r bg-card">
        <div className="h-14 flex items-center px-4 font-semibold">Babeuh Dashboard</div>
        <nav className="px-2 py-2 space-y-1 text-sm">
          <a className="block rounded px-3 py-2 hover:bg-muted" href="#">Dashboard</a>
          <a className="block rounded px-3 py-2 hover:bg-muted" href="#">Upload</a>
          <a className="block rounded px-3 py-2 hover:bg-muted" href="#">Reports</a>
        </nav>
      </aside>
      <div className="flex flex-col">
        <header className="h-14 border-b flex items-center justify-between px-4">
          <div className="font-medium">Project Insights</div>
          <Badge variant="secondary">v0.1</Badge>
        </header>
        <main className="p-6 space-y-6">{children}</main>
      </div>
    </div>
  )
}


