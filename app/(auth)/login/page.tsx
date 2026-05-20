import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function signInWithGoogle() {
  'use server'
  const supabase = await createClient()
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })
  if (data.url) redirect(data.url)
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="bg-white border border-[#dde3ef] rounded-2xl p-10 w-full max-w-sm shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-black tracking-tight text-[#1d3fa0] uppercase mb-2">
            SHB Hub
          </h1>
          <p className="text-sm text-slate-500 font-mono tracking-widest uppercase text-xs">
            Competition Management
          </p>
        </div>

        {searchParams.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-center">
            Sign-in failed. Please try again.
          </p>
        )}

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-[#1d3fa0] hover:bg-[#1a3690] text-white font-semibold py-3 px-4 rounded-xl transition-colors font-body"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#fff" fillOpacity=".8"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#fff" fillOpacity=".6"/>
              <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#fff" fillOpacity=".4"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#fff" fillOpacity=".9"/>
            </svg>
            Sign in with Google
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          Access by invitation only. Contact your Project Manager.
        </p>
      </div>
    </div>
  )
}
