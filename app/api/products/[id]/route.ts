// app/api/products/[id]/route.ts — GET: full product | PUT: partial update | DELETE: delete product
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: product } = await supabase
    .from('products_algoritmo_milionario')
    .select('*')
    .eq('id', id)
    .single()

  if (!product || product.user_id !== user.id) return new Response('Not found', { status: 404 })

  return Response.json({ product })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Verify ownership
  const { data: existing } = await supabase
    .from('products_algoritmo_milionario')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== user.id) return new Response('Not found', { status: 404 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  // Build the update object from allowed fields only
  const allowedFields = [
    'raw_description',
    'market',
    'price',
    'icp',
    'differentials',
    'product_name',
    'headlines',
    'description',
    'unique_mechanism',
    'social_proof_suggestions',
    'vsl_structure',
    'tsl_structure',
    'order_bump',
    'upsell',
    'downsell',
    'status',
  ]

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  // Validate status if provided
  if (updates.status !== undefined && !['draft', 'generated', 'saved'].includes(updates.status as string)) {
    return new Response('status must be one of: draft, generated, saved', { status: 400 })
  }

  const { data: product, error } = await supabase
    .from('products_algoritmo_milionario')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return new Response(error.message, { status: 500 })

  return Response.json({ product })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Verify ownership
  const { data: product } = await supabase
    .from('products_algoritmo_milionario')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!product || product.user_id !== user.id) return new Response('Not found', { status: 404 })

  await supabase.from('products_algoritmo_milionario').delete().eq('id', id)

  return new Response(null, { status: 204 })
}
