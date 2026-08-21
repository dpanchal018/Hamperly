import { signup } from '@/actions/auth.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/ui/Logo'
import Link from 'next/link'

export const metadata = {
  title: 'Sign Up - Hamperly',
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedParams = await searchParams;
  const error = resolvedParams.error;
  
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-border bg-rose-50/30 px-4 py-8 pt-10 text-center sm:px-16">
          <Logo className="scale-75" />
          <p className="text-sm text-slate-500 font-medium">Create your customer account</p>
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 text-sm text-center border-b border-red-100">
            {error}
          </div>
        )}
        <form action={signup as any} className="flex flex-col space-y-4 px-4 py-8 sm:px-12">
          <div>
            <label htmlFor="full_name" className="block text-xs text-slate-500 uppercase font-medium mb-2">Full Name</label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="e.g. Rahul Shah"
              required
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs text-slate-500 uppercase font-medium mb-2">Email Address</label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
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
              required
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full mt-2 bg-rose-600 hover:bg-rose-700 text-white">
            Create Account
          </Button>
          
          <div className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-rose-600 hover:underline">
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
