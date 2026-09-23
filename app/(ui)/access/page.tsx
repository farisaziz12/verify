import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AccessForm } from '@/components/organisms/access-form'
import { safeNextPath } from '@/lib/access/session'
import { readSitePassword } from '@/lib/env'

export const metadata: Metadata = { title: 'Access · Verify' }

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  if (!readSitePassword()) redirect('/')

  const { next } = await searchParams
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-heading font-medium">Access</h1>
      <AccessForm next={safeNextPath(typeof next === 'string' ? next : undefined)} />
    </div>
  )
}
