import type { ReactNode } from 'react'

export default function UiLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-[780px] flex-col gap-12 px-6 pt-10 pb-30">
      {children}
    </main>
  )
}
