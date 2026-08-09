import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/atoms/button'
import { AddDomainForm } from '@/components/organisms/add-domain-form'

export const metadata: Metadata = { title: 'Add a domain · Verify' }

export default function AddDomainPage() {
  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="link">
        <Link href="/">← Domains</Link>
      </Button>
      <h1 className="text-heading font-medium">Add a domain</h1>
      <AddDomainForm />
    </div>
  )
}
