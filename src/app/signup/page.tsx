import { signup } from '@/actions/auth.actions'
import { SubmitButton } from '@/components/ui/submit-button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Logo } from '@/components/ui/Logo'
import { MINIMUM_AGE, todayInIndia } from '@/lib/age'
import Link from 'next/link'

export const metadata = {
  title: 'Sign Up - Hamperly',
}

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string, redirect?: string }> }) {
  const resolvedParams = await searchParams;
  const error = resolvedParams.error;
  const redirectTo = resolvedParams.redirect;
  
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-8">
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
          {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
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
            <label htmlFor="date_of_birth" className="block text-xs text-slate-500 uppercase font-medium mb-2">Date of Birth</label>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              autoComplete="bday"
              min="1900-01-01"
              max={todayInIndia()}
              required
              aria-describedby="date_of_birth_hint"
              className="w-full"
            />
            <p id="date_of_birth_hint" className="mt-1.5 text-xs text-slate-500">
              You must be {MINIMUM_AGE} or older to shop with Hamperly. We only use this to check your age and don&apos;t store it.
            </p>
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
            <PasswordInput
              id="password"
              name="password"
              
              required
              className="w-full"
            />
          </div>
          <SubmitButton className="w-full mt-2 bg-rose-600 hover:bg-rose-700 text-white">
            Create Account
          </SubmitButton>
          
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
