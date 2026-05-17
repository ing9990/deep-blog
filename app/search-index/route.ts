import { getAllPosts } from '@/lib/posts'
import { toClientPost } from '@/lib/client-post'

// Build-time static JSON of the full-text search index (ClientPost[] with
// plainBody). The (blog) layout no longer ships this ~533 KB plainBody blob
// on every first page load; SearchDialog fetches it once, on first open.
export const dynamic = 'force-static'

export function GET(): Response {
  return Response.json(getAllPosts().map(toClientPost))
}
