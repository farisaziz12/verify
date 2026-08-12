import { afterEach, describe, expect, it, vi } from 'vitest'
import cloudflareAnswered from './__fixtures__/cloudflare-answered.json'
import { cloudflareResolver, googleResolver } from './dns-over-https'

afterEach(() => vi.unstubAllGlobals())

function stubFetch(impl: (url: string, init: RequestInit) => Promise<Response> | never) {
  const fetchMock = vi.fn(impl)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  )
}

describe('the request the adapter sends', () => {
  it('sets the accept header Cloudflare returns 400 without', async () => {
    const fetchMock = stubFetch(() => jsonResponse(cloudflareAnswered))
    await cloudflareResolver.query('_claim.example.com', 'TXT')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(new Headers(init.headers).get('accept')).toBe('application/dns-json')
  })

  it('opts out of caching', async () => {
    const fetchMock = stubFetch(() => jsonResponse(cloudflareAnswered))
    await cloudflareResolver.query('_claim.example.com', 'TXT')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.cache).toBe('no-store')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('url-encodes the name and hits each provider’s own endpoint', async () => {
    const fetchMock = stubFetch(() => jsonResponse(cloudflareAnswered))
    await cloudflareResolver.query('_claim.bücher.de', 'TXT')
    await googleResolver.query('_claim.example.com', 'TXT')

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://cloudflare-dns.com/dns-query?name=_claim.b%C3%BCcher.de&type=TXT',
    )
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://dns.google/resolve?name=_claim.example.com&type=TXT',
    )
  })
})

describe('every way a query can fail', () => {
  it('maps a non-2xx to malformed without reading the body', async () => {
    const body = { json: vi.fn() }
    stubFetch(() =>
      Promise.resolve(
        Object.assign(new Response('<!DOCTYPE html><html>…</html>', { status: 400 }), body),
      ),
    )

    const { outcome } = await googleResolver.query('_claim.example.com', 'TXT')

    expect(outcome).toEqual({ kind: 'error', reason: 'malformed' })
    expect(body.json).not.toHaveBeenCalled()
  })

  it('maps an unparseable body to malformed', async () => {
    stubFetch(() => Promise.resolve(new Response('not json at all', { status: 200 })))

    const { outcome } = await cloudflareResolver.query('_claim.example.com', 'TXT')

    expect(outcome).toEqual({ kind: 'error', reason: 'malformed' })
  })

  it('maps a socket failure to network', async () => {
    stubFetch(() => {
      throw new TypeError('fetch failed')
    })

    const { outcome } = await cloudflareResolver.query('_claim.example.com', 'TXT')

    expect(outcome).toEqual({ kind: 'error', reason: 'network' })
  })

  it('maps an aborted request to timeout', async () => {
    stubFetch(() => {
      throw new DOMException('The operation timed out.', 'TimeoutError')
    })

    const { outcome } = await cloudflareResolver.query('_claim.example.com', 'TXT')

    expect(outcome).toEqual({ kind: 'error', reason: 'timeout' })
  })

  it('never throws — a failure is always a value', async () => {
    stubFetch(() => {
      throw new Error('something entirely unexpected')
    })

    await expect(cloudflareResolver.query('_claim.example.com', 'TXT')).resolves.toMatchObject({
      outcome: { kind: 'error' },
    })
  })

  it('reports which adapter failed, not just that something did', async () => {
    stubFetch(() => {
      throw new TypeError('fetch failed')
    })

    const result = await googleResolver.query('_claim.example.com', 'TXT')

    expect(result.resolver).toBe('google')
  })
})

describe('a successful query', () => {
  it('classifies the body and names the adapter', async () => {
    stubFetch(() => jsonResponse(cloudflareAnswered))

    const { outcome, resolver } = await cloudflareResolver.query('github.com', 'TXT')

    expect(resolver).toBe('cloudflare')
    expect(outcome.kind).toBe('answered')
  })
})
