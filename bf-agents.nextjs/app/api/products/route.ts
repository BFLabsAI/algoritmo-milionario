// app/api/products/route.ts — GET: list user's products | POST: create product
import { createAdminClient } from '@/lib/supabase/server'
import { generateProduct } from '@/lib/ai-generators'

export async function GET(req: Request) {
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('products_algoritmo_milionario')
    .select('id, product_name, market, price, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return new Response(error.message, { status: 500 })

  return Response.json({ products: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  let body: {
    rawDescription: string
    market: string
    price: number
    icp: string
    differentials: string
  }

  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const { rawDescription, market, price, icp, differentials } = body

  if (!rawDescription || !market || price === undefined || price === null || !icp || !differentials) {
    return new Response('Missing required fields: rawDescription, market, price, icp, differentials', { status: 400 })
  }

  // Generate the AI product
  let aiResult
  try {
    aiResult = await generateProduct({
      rawDescription,
      market,
      price,
      icp,
      differentials,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    return new Response(`AI generation error: ${message}`, { status: 500 })
  }

  // Insert into products table with both inputs and AI outputs
  const { data: product, error: insertError } = await supabase
    .from('products_algoritmo_milionario')
    .insert({
      user_id: user.id,
      raw_description: rawDescription,
      market,
      price,
      icp,
      differentials,
      product_name: aiResult.product_name,
      headlines: aiResult.headlines,
      description: aiResult.description,
      unique_mechanism: aiResult.unique_mechanism,
      social_proof_suggestions: aiResult.social_proof_suggestions,
      vsl_structure: aiResult.vsl_structure,
      tsl_structure: aiResult.tsl_structure,
      order_bump: aiResult.order_bump,
      upsell: aiResult.upsell,
      downsell: aiResult.downsell,
      status: 'generated',
    })
    .select('*')
    .single()

  if (insertError || !product) {
    return new Response(insertError?.message ?? 'Failed to create product', { status: 500 })
  }

  return Response.json({ product }, { status: 201 })
}
