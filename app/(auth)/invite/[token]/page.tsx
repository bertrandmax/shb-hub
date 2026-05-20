import { validateInviteToken } from '@/lib/auth/invite'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function acceptInvite(token: string) {
  'use server'
  const supabase = await createClient()
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard&invite=${token}`,
    },
  })
  if (data.url) redirect(data.url)
}

export default async function InvitePage({
  params,
}: {
  params: { token: string }
}) {
  const invite = await validateInviteToken(params.token)
  if (!invite) notFound()

  const accept = acceptInvite.bind(null, params.token)

  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="bg-white border border-[#dde3ef] rounded-2xl p-10 w-full max-w-sm shadow-sm">
        <h1 className="font-display text-xl font-black tracking-tight text-[#1d3fa0] uppercase mb-2">
          You're Invited
        </h1>
        <p className="text-sm text-slate-600 mb-1">
          <span className="font-semibold">{invite.email}</span>
        </p>
        <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mb-8">
          {invite.role_type.replace(/_/g, ' ')}
        </p>
        <form action={accept}>
          <button
            type="submit"
            className="w-full bg-[#1d3fa0] hover:bg-[#1a3690] text-white font-semibold py-3 px-4 rounded-xl transition-colors font-body"
          >
            Accept with Google
          </button>
        </form>
      </div>
    </div>
  )
}
