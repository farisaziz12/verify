import type { ReactNode } from 'react'

export default function UiLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-[780px] flex-col gap-10 px-4 pt-8 pb-24 sm:gap-12 sm:px-6 sm:pt-10 sm:pb-30">
      {children}
    </main>
  )
}
