import { login } from '@/actions/auth.actions'
import { SubmitButton } from '@/components/ui/submit-button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/Logo'

export const metadata = {
  title: 'Admin Login - Hamperly',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string, redirect?: string }> }) {
  const resolvedParams = await searchParams;
  const error = resolvedParams.error;
  const redirectTo = resolvedParams.redirect;
  
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-border bg-secondary/30 px-4 py-8 pt-10 text-center sm:px-16">
          <Logo className="scale-75" />
          <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Admin Portal</p>
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 text-sm text-center border-b border-red-100">
            {error}
          </div>
        )}
        <form action={login as any} className="flex flex-col space-y-4 bg-white px-4 py-8 sm:px-16">
          {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
          <div>
            <label htmlFor="email" className="block text-xs text-slate-500 uppercase font-medium mb-2">Email Address</label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@hamperly.local"
              autoComplete="email"
              required
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs text-slate-500 uppercase font-medium mb-2">Password</label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full"
            />
          </div>
          <SubmitButton className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            Sign In
          </SubmitButton>
          
          <div className="mt-4 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <a href="/signup" className="text-indigo-600 hover:underline">
              Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
