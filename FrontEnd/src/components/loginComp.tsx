import { type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'

export type PasswordFieldProps = {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  revealed: boolean
  onToggleReveal: () => void
  autoComplete?: string
  suffixText?: string
}

// Reusable password input with show/hide affordance and shared styling.
export function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  revealed,
  onToggleReveal,
  autoComplete,
  suffixText,
}: PasswordFieldProps) {
  const resolvedSuffix = suffixText ?? 'Safe'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <label className="font-medium text-slate-200" htmlFor={id}>
          {label}
        </label>
        <button
          type="button"
          onClick={onToggleReveal}
          className="font-medium text-indigo-300 transition hover:text-indigo-200"
        >
          {revealed ? '隐藏' : '显示'}
        </button>
      </div>
      <div className="relative">
        <input
          id={id}
          type={revealed ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
          placeholder={placeholder}
        />
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs uppercase tracking-widest text-slate-500">
          {resolvedSuffix}
        </div>
      </div>
    </div>
  )
}

// Shows the MajHub badge so the page always feels branded.
export function BrandHeader() {
  return (
    <header className="flex items-center gap-3 px-8 py-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 text-lg font-bold text-white shadow-glow">
        MH
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">
          MajHub
        </span>
        <span className="text-base text-slate-300">立直麻将社区</span>
      </div>
    </header>
  )
}

// Welcomes returning users and clarifies the purpose of the form.
export type HeroSectionProps = {
  welcomeMessage: string
  suggestionText: string
}

export function HeroSection({
  welcomeMessage,
  suggestionText,
}: HeroSectionProps) {
  return (
    <div className="space-y-3 text-center">
      {/* <p className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-1 text-xs uppercase tracking-wider text-indigo-300 ring-1 ring-indigo-400/30">
        <span className="h-2 w-2 rounded-full bg-indigo-400" />
        Secure Portal
      </p> */}
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {welcomeMessage}
      </h1>
      <p className="text-sm text-slate-400">
        {suggestionText}
      </p>
    </div>
  )
}

// Decorative blobs that enrich the background without affecting layout.
export function BackgroundGlow() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute bottom-20 right-0 h-64 w-64 translate-x-1/3 rounded-full bg-blue-500/20 blur-3xl" />
    </div>
  )
}

// Displays a prompt with a question and a navigational link.
type promptProps = {
  question: string
  linkText: string
  linkTo: string
}

export function Prompt({
  question, linkText, linkTo
}: promptProps) {
  return (
    <p className="text-center text-xs text-slate-500">
      {question}
      <Link className="ml-2 font-medium text-indigo-300 hover:text-indigo-200" to={linkTo}>
        {linkText}
      </Link>
    </p>
  )
}

// Reinforces legal agreements related to the registration action.
export function PolicyFooter() {
	return (
		<footer className="px-8 pb-6 text-xs text-slate-500 text-center">
			注册即表示你同意我们的
			<a className="ml-1 text-indigo-300 hover:text-indigo-200" href="#">
				服务条款
			</a>
			和
			<a className="ml-1 text-indigo-300 hover:text-indigo-200" href="#">
				隐私政策
			</a>
			。
		</footer>
	)
}
