import { createAdminClient } from '@/lib/supabase/server'
import { getPresignedUrl } from '@/lib/b2'

export async function GET(req: Request) {
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: rows } = await supabase
    .from('generated_images_algoritmo_milionario')
    .select('id, prompt, storage_path, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(12)

  const images = await Promise.all(
    (rows ?? []).map(async (img) => ({
      id:         img.id,
      prompt:     img.prompt,
      image_url:  img.storage_path.startsWith('http')
                    ? img.storage_path
                    : await getPresignedUrl(img.storage_path),
      created_at: img.created_at,
    }))
  )

  return Response.json(images)
}
