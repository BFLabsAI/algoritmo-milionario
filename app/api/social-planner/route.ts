// app/api/social-planner/route.ts — GET: list user's plans | POST: create plan
import { createAdminClient } from '@/lib/supabase/server'
import { generateSocialMediaPlan, type SocialMediaPlanInput } from '@/lib/ai-generators'

const ALLOWED_CONTENT_TYPES = new Set(['reel', 'feed', 'carousel', 'story'])

function normalizeContentType(raw: string): 'reel' | 'feed' | 'carousel' | 'story' {
  const v = raw?.toLowerCase().trim()
  if (v === 'carrossel' || v === 'carrousel') return 'carousel'
  if (ALLOWED_CONTENT_TYPES.has(v)) return v as 'reel' | 'feed' | 'carousel' | 'story'
  return 'feed'
}

async function runGeneration(planId: string, startDate: string, input: SocialMediaPlanInput) {
  const supabase = createAdminClient()

  try {
    const aiResult = await generateSocialMediaPlan(input)
    const baseDate = new Date(startDate)

    const itemsToInsert: {
      plan_id: string
      day_number: number
      scheduled_date: string
      content_type: string
      slot_number: number
      title: string
      content: string
      caption: string
      status: string
    }[] = []

    for (const day of aiResult.days) {
      const scheduledDate = new Date(baseDate)
      scheduledDate.setDate(baseDate.getDate() + (day.day_number - 1))
      const scheduledDateStr = scheduledDate.toISOString().split('T')[0]

      for (const story of day.stories) {
        itemsToInsert.push({
          plan_id: planId, day_number: day.day_number, scheduled_date: scheduledDateStr,
          content_type: 'story', slot_number: story.slot,
          title: story.title, content: story.content, caption: story.caption, status: 'pending',
        })
      }

      for (const post of day.posts) {
        itemsToInsert.push({
          plan_id: planId, day_number: day.day_number, scheduled_date: scheduledDateStr,
          content_type: normalizeContentType(post.type), slot_number: 1,
          title: post.title, content: post.content, caption: post.caption, status: 'pending',
        })
      }
    }

    // Insert in chunks to stay within Supabase limits
    for (let i = 0; i < itemsToInsert.length; i += 100) {
      const { error } = await supabase
        .from('social_media_plan_items_algoritmo_milionario')
        .insert(itemsToInsert.slice(i, i + 100))
      if (error) throw new Error(`Item insert error: ${error.message}`)
    }

    await supabase
      .from('social_media_plans_algoritmo_milionario')
      .update({ status: 'active' })
      .eq('id', planId)
  } catch (err) {
    console.error('[social-planner] generation failed:', err)
    await supabase
      .from('social_media_plans_algoritmo_milionario')
      .update({ status: 'error' })
      .eq('id', planId)
  }
}

export async function GET(req: Request) {
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('social_media_plans_algoritmo_milionario')
    .select('id, title, product_name, duration_days, start_date, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return new Response(error.message, { status: 500 })

  return Response.json({ plans: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  let body: {
    title: string; productName: string; offerInfo: string
    targetAudience: string; differentials: string; durationDays: 15 | 30; startDate: string
  }
  try { body = await req.json() } catch { return new Response('Invalid JSON body', { status: 400 }) }

  const { title, productName, offerInfo, targetAudience, differentials, durationDays, startDate } = body

  if (!title || !productName || !offerInfo || !targetAudience || !differentials || !durationDays || !startDate)
    return new Response('Missing required fields', { status: 400 })

  if (durationDays !== 15 && durationDays !== 30)
    return new Response('durationDays must be 15 or 30', { status: 400 })

  const { data: plan, error: planError } = await supabase
    .from('social_media_plans_algoritmo_milionario')
    .insert({
      user_id: user.id, title, product_name: productName, offer_info: offerInfo,
      target_audience: targetAudience, differentials, duration_days: durationDays,
      start_date: startDate, status: 'generating',
    })
    .select('id, title, product_name, duration_days, start_date, status, created_at')
    .single()

  if (planError || !plan)
    return new Response(planError?.message ?? 'Failed to create plan', { status: 500 })

  // Fire-and-forget: generate content in the background
  const aiInput: SocialMediaPlanInput = { productName, offerInfo, targetAudience, differentials, durationDays }
  runGeneration(plan.id, startDate, aiInput).catch(console.error)

  return Response.json({ plan }, { status: 201 })
}
