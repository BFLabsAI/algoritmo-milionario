// app/api/auth/register/route.ts
// Usa o service_role para criar usuário já confirmado (sem e-mail de confirmação)
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

const RegisterSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
  name:     z.string().min(1).optional(),
})

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() } catch { return Response.json({ error: 'JSON inválido' }, { status: 400 }) }

  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { email, password, name } = parsed.data
  const supabase = createAdminClient()

  // Cria o usuário já confirmado via admin API (email_confirm: true)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // ← confirma automaticamente, sem e-mail
    user_metadata: { full_name: name ?? '' },
  })

  if (error) {
    // Mapeia erros comuns para português
    let msg = error.message
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      msg = 'Este e-mail já está cadastrado.'
    }
    return Response.json({ error: msg }, { status: 400 })
  }

  return Response.json({ user: { id: data.user.id, email: data.user.email } }, { status: 201 })
}
