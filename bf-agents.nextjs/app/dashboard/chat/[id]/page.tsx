import { redirect } from 'next/navigation'

export default async function ConversationRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/dashboard/chat?cid=${id}`)
}
