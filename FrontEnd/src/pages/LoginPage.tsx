import { Link } from 'react-router-dom'
import { type ChangeEvent, type FormEvent, useState } from 'react'
import {PasswordField, BrandHeader, HeroSection, BackgroundGlow, Prompt, PolicyFooter} from '../components/loginComp'

// Shared shape for the login form data fields.
type FormState = {
  email: string
  password: string
  remember: boolean
}

type UseLoginFormResult = {
  form: FormState
  isSubmitting: boolean
  showPassword: boolean
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
  handleEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
  handlePasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleRememberChange: (event: ChangeEvent<HTMLInputElement>) => void
  togglePasswordVisibility: () => void
}

type SocialProvider = {
  id: string
  label: string
}

const SOCIAL_PROVIDERS: SocialProvider[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'google', label: 'Google' },
  { id: 'linkedin', label: 'LinkedIn' },
]

// Centralises login-related state and handlers so the view stays lean.
function userLoginForm(): UseLoginFormResult {
  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    remember: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => setIsSubmitting(false), 1200)
  }

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, email: event.target.value }))
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, password: event.target.value }))
  }

  const handleRememberChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, remember: event.target.checked }))
  }

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  return {
    form,
    isSubmitting,
    showPassword,
    handleSubmit,
    handleEmailChange,
    handlePasswordChange,
    handleRememberChange,
    togglePasswordVisibility,
  }
}

type LoginFormProps = {
  form: FormState
  isSubmitting: boolean
  showPassword: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRememberChange: (event: ChangeEvent<HTMLInputElement>) => void
  onTogglePasswordVisibility: () => void
}

// Houses the credential inputs plus social-login affordances.
function LoginForm({
  form,
  isSubmitting,
  showPassword,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onTogglePasswordVisibility,
}: LoginFormProps) {
  return (
    <div className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-8 shadow-glow backdrop-blur">
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="email">
            邮箱
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={onEmailChange}
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            placeholder="you@example.com"
          />
        </div>

        <PasswordField
          id="password"
          label="密码"
          placeholder="输入密码"
          value={form.password}
          onChange={onPasswordChange}
          revealed={showPassword}
          onToggleReveal={onTogglePasswordVisibility}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-sm text-slate-300">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={onRememberChange}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-400 focus:ring-indigo-400/70"
            />
            记住我
          </label>
          <a className="font-medium text-indigo-300 hover:text-indigo-200" href="#">
            忘记密码？
          </a>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-indigo-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? '登录中…' : '登录'}
        </button>
      </form>

      <SocialLogin />
    </div>
  )
}

// Displays placeholder single-sign-on options using a data-driven layout.
function SocialLogin() {
  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px flex-1 bg-slate-700" />
        或使用以下方式继续
        <span className="h-px flex-1 bg-slate-700" />
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs font-medium text-slate-300">
        {SOCIAL_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 transition hover:border-indigo-400/60 hover:text-white"
          >
            {provider.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// Pulls everything together so layout, logic, and decoration stay focused.
function LoginPage() {
  const {
    form,
    isSubmitting,
    showPassword,
    handleSubmit,
    handleEmailChange,
    handlePasswordChange,
    handleRememberChange,
    togglePasswordVisibility,
  } = userLoginForm()

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <BackgroundGlow />
      <BrandHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <HeroSection 
            welcomeMessage="欢迎访问MajHub！"
            suggestionText="使用你的邮箱和密码登录。"
          />
          <LoginForm
            form={form}
            isSubmitting={isSubmitting}
            showPassword={showPassword}
            onSubmit={handleSubmit}
            onEmailChange={handleEmailChange}
            onPasswordChange={handlePasswordChange}
            onRememberChange={handleRememberChange}
            onTogglePasswordVisibility={togglePasswordVisibility}
          />
          <Prompt 
            question='没有账号？'
            linkText='点击注册'
            linkTo='/signup'/>
        </div>
      </main>
      <PolicyFooter />
    </div>
  )
}

export default LoginPage
