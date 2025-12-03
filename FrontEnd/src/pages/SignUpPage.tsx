import { Link } from 'react-router-dom'
import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'
import {PasswordField, HeroSection, BrandHeader, BackgroundGlow, Prompt, PolicyFooter} from '../components/loginComp'

// Shared shape for the sign-up form data fields.
type FormState = {
	email: string
	username: string
	password: string
	passwordConfirm: string
}

type UseSignUpFormResult = {
	form: FormState
	isSubmitting: boolean
	showPassword: boolean
	showPasswordConfirm: boolean
	passwordsMatch: boolean
	handleSubmit: (event: FormEvent<HTMLFormElement>) => void
	handleEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
	handleUsernameChange: (event: ChangeEvent<HTMLInputElement>) => void
	handlePasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
	handlePasswordConfirmChange: (event: ChangeEvent<HTMLInputElement>) => void
	togglePasswordVisibility: () => void
	togglePasswordConfirmVisibility: () => void
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

// Centralises sign-up state and handlers so the view stays lean.
function useSignUpForm(): UseSignUpFormResult {
  const [form, setForm] = useState<FormState>({
    email: '',
    username: '',
    password: '',
    passwordConfirm: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // 检查密码是否匹配
    if (form.password !== form.passwordConfirm) {
      alert('两次输入的密码不一致')
      return
    }

    setIsSubmitting(true)

    try {
      console.log('开始注册请求...', form);

      const response = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          password_confirm: form.passwordConfirm, // 注意后端字段名是 password_confirm
        }),
      });

      console.log('注册响应状态:', response.status);

      // 先读取响应文本
      const responseText = await response.text();
      console.log('注册响应文本:', responseText);

      if (!response.ok) {
        // 尝试解析错误信息
        let errorMessage = '注册失败';
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.errors || errorMessage;
          } catch (e) {
            errorMessage = responseText;
          }
        }
        throw new Error(errorMessage);
      }

      // 解析成功响应
      const data = JSON.parse(responseText);
      console.log('注册成功:', data);

      if (data.success) {
        alert('注册成功！请登录');
        // 跳转到登录页面
        window.location.href = '/login';
      } else {
        throw new Error(data.message || '注册失败');
      }
    } catch (err) {
      console.error('注册错误:', err);
      alert(err instanceof Error ? err.message : '注册失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ... 其他函数保持不变
  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, email: event.target.value }))
  }

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, username: event.target.value }))
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, password: event.target.value }))
  }

  const handlePasswordConfirmChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, passwordConfirm: event.target.value }))
  }

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const togglePasswordConfirmVisibility = () => {
    setShowPasswordConfirm((prev) => !prev)
  }

  const passwordsMatch = useMemo(
    () =>
      form.password.length > 0 &&
      form.passwordConfirm.length > 0 &&
      form.password === form.passwordConfirm,
    [form.password, form.passwordConfirm],
  )

  return {
    form,
    isSubmitting,
    showPassword,
    showPasswordConfirm,
    passwordsMatch,
    handleSubmit,
    handleEmailChange,
    handleUsernameChange,
    handlePasswordChange,
    handlePasswordConfirmChange,
    togglePasswordVisibility,
    togglePasswordConfirmVisibility,
  }
}
type SignUpFormProps = {
	form: FormState
	isSubmitting: boolean
	showPassword: boolean
	showPasswordConfirm: boolean
	passwordsMatch: boolean
	onSubmit: (event: FormEvent<HTMLFormElement>) => void
	onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
	onUsernameChange: (event: ChangeEvent<HTMLInputElement>) => void
	onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
	onPasswordConfirmChange: (event: ChangeEvent<HTMLInputElement>) => void
	onTogglePasswordVisibility: () => void
	onTogglePasswordConfirmVisibility: () => void
}

// Houses the credential inputs and supporting controls for registration.
function SignUpForm({
	form,
	isSubmitting,
	showPassword,
	showPasswordConfirm,
	passwordsMatch,
	onSubmit,
	onEmailChange,
	onUsernameChange,
	onPasswordChange,
	onPasswordConfirmChange,
	onTogglePasswordVisibility,
	onTogglePasswordConfirmVisibility,
}: SignUpFormProps) {
	const showPasswordMismatch =
		form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm

	return (
		<div className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-8 shadow-glow backdrop-blur">
			<form className="space-y-6" onSubmit={onSubmit}>
				<div className="space-y-2">
					<label className="text-sm font-medium dark:text-slate-200 light:text-slate-700" htmlFor="username">
						用户名
					</label>
					<input
						id="username"
						type="text"
						required
						autoComplete="username"
						value={form.username}
						onChange={onUsernameChange}
						className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
						placeholder="给自己起一个独特的昵称"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium dark:text-slate-200 light:text-slate-700" htmlFor="email">
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
					placeholder="设置登录密码"
					value={form.password}
					onChange={onPasswordChange}
					revealed={showPassword}
					onToggleReveal={onTogglePasswordVisibility}
					autoComplete="new-password"
					suffixText="Secure"
				/>

				<PasswordField
					id="passwordConfirm"
					label="确认密码"
					placeholder="再次输入密码"
					value={form.passwordConfirm}
					onChange={onPasswordConfirmChange}
					revealed={showPasswordConfirm}
					onToggleReveal={onTogglePasswordConfirmVisibility}
					autoComplete="new-password"
					suffixText={passwordsMatch ? 'Match' : 'Check'}
				/>

				{showPasswordMismatch && (
					<p className="text-xs text-rose-400">两次输入的密码不一致，请重新确认。</p>
				)}

				<button
					type="submit"
					disabled={isSubmitting || showPasswordMismatch}
					className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-indigo-300 disabled:cursor-not-allowed disabled:opacity-70"
				>
					{isSubmitting ? '注册中…' : '创建账户'}
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
				或者使用以下方式注册
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
function SignUpPage() {
	const {
		form,
		isSubmitting,
		showPassword,
		showPasswordConfirm,
		passwordsMatch,
		handleSubmit,
		handleEmailChange,
		handleUsernameChange,
		handlePasswordChange,
		handlePasswordConfirmChange,
		togglePasswordVisibility,
		togglePasswordConfirmVisibility,
	} = useSignUpForm()

	return (
		<div className="relative flex min-h-screen flex-col 
		  dark:bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 
		  light:bg-gradient-to-br from-gray-50 via-gray-100 to-indigo-100">
			<BackgroundGlow />
			<BrandHeader />

			<main className="flex flex-1 items-center justify-center px-4 py-12">
				<div className="w-full max-w-md space-y-8">
					<HeroSection 
                        welcomeMessage="欢迎加入 MajHub！"
                        suggestionText="创建你的账户，开始你的立直麻将之旅。"
                    />
					<SignUpForm
						form={form}
						isSubmitting={isSubmitting}
						showPassword={showPassword}
						showPasswordConfirm={showPasswordConfirm}
						passwordsMatch={passwordsMatch}
						onSubmit={handleSubmit}
						onEmailChange={handleEmailChange}
						onUsernameChange={handleUsernameChange}
						onPasswordChange={handlePasswordChange}
						onPasswordConfirmChange={handlePasswordConfirmChange}
						onTogglePasswordVisibility={togglePasswordVisibility}
						onTogglePasswordConfirmVisibility={togglePasswordConfirmVisibility}
					/>
                    <Prompt 
                        question='已有账号？'
                        linkText='点击登录'
                        linkTo='/'/>
				</div>
			</main>

			<PolicyFooter />
		</div>
	)
}

export default SignUpPage

