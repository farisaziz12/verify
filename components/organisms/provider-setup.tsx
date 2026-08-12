import { Mono } from '@/components/atoms/mono'
import { Disclosure, DisclosureGroup } from '@/components/molecules/disclosure'

interface Provider {
  name: string
  docsUrl: string
  steps: string[]
}

// Provider names keep their own capitalisation — they are product names, not UI copy.
const PROVIDERS: Provider[] = [
  {
    name: 'Cloudflare',
    docsUrl: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/',
    steps: [
      'DNS → Records → Add record',
      'Type TXT, name _claim (Cloudflare appends the zone for you)',
      'Paste the value, TTL auto, save',
    ],
  },
  {
    name: 'GoDaddy',
    docsUrl: 'https://www.godaddy.com/help/add-a-txt-record-19232',
    steps: [
      'DNS → DNS records → Add',
      'Type TXT, host _claim',
      'Paste into TXT value, TTL 1 hour, save',
    ],
  },
  {
    name: 'Namecheap',
    docsUrl:
      'https://www.namecheap.com/support/knowledgebase/article.aspx/317/2237/how-do-i-add-txtspfdkimdmarc-records-for-my-domain/',
    steps: [
      'Advanced DNS → Add new record',
      'Type TXT record, host _claim',
      'Paste into value, TTL automatic, save',
    ],
  },
  {
    name: 'Route 53',
    docsUrl:
      'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-creating.html',
    steps: [
      'Hosted zone → Create record',
      'Record name _claim, type TXT',
      'Value must be wrapped in double quotes, TTL 300, create',
    ],
  },
]

export function ProviderSetup({ recordName }: { recordName: string }) {
  return (
    <div className="flex flex-col gap-3">
      <DisclosureGroup>
        <Disclosure value="host-field" label="Where does the NAME go?">
          <p>
            Your provider calls the field <span className="text-fg-bright">name</span>,{' '}
            <span className="text-fg-bright">host</span> or{' '}
            <span className="text-fg-bright">hostname</span>. The NAME above goes there.
          </p>
          <p>
            Most forms add your domain for you, so type just <Mono>_claim</Mono>. If the form shows
            the full name as you type, paste <Mono>{recordName}</Mono> instead.
          </p>
          <p>Either way, we'll check and point you in the right direction.</p>
        </Disclosure>
      </DisclosureGroup>

      <div className="mt-5 flex items-baseline justify-between">
        <h2 className="text-section font-medium">Setup by provider</h2>
        <p className="text-fg-subtle text-ui">Step-by-step for common providers</p>
      </div>

      <DisclosureGroup>
        {PROVIDERS.map((provider) => (
          <Disclosure key={provider.name} value={provider.name} label={provider.name}>
            <ol className="flex list-decimal flex-col gap-1.5 pl-4">
              {provider.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-subtle hover:text-fg text-hint inline-flex w-fit items-center gap-1.5 transition-colors"
            >
              {provider.name} docs
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
                <title>Opens in a new tab</title>
                <path
                  d="M2 8 L8 2 M3.5 2 H8 V6.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </Disclosure>
        ))}
        <Disclosure value="__other" label="My provider isn't listed">
          <ol className="flex list-decimal flex-col gap-1.5 pl-4">
            <li>
              Find where DNS records are managed — often called DNS, DNS records, or zone editor
            </li>
            <li>
              Add a record of type TXT with host <Mono>_claim</Mono>
            </li>
            <li>Paste the value from above, keep the default TTL, save</li>
          </ol>
        </Disclosure>
      </DisclosureGroup>
    </div>
  )
}
