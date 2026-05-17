import { headers } from 'next/headers'
import { resolveCrossHostUrls, type CrossHostUrls } from './cross-host-url'

/**
 * Server-only cross-host URL resolution. Reads the request `host` header,
 * which makes the calling segment dynamic. Use only where dynamic rendering
 * is acceptable; static surfaces should resolve on the client via
 * {@link CrossHostProvider} instead.
 */
export async function getCrossHostUrls(): Promise<CrossHostUrls> {
  const h = await headers()
  return resolveCrossHostUrls(h.get('host'))
}
