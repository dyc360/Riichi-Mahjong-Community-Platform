import { Link } from 'react-router-dom'
import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'
import {PasswordField, HeroSection, BrandHeader, BackgroundGlow, Prompt, PolicyFooter} from '../components/loginComp'
import { getCsrfToken } from '../utils';

const API_BASE_URL = '/api';

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
	errorMessage: string | null
	fieldErrors: Record<string, string[]>
	handleSubmit: (event: FormEvent<HTMLFormElement>) => void
	handleEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
	handleUsernameChange: (event: ChangeEvent<HTMLInputElement>) => void
	handlePasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
	handlePasswordConfirmChange: (event: ChangeEvent<HTMLInputElement>) => void
	togglePasswordVisibility: () => void
	togglePasswordConfirmVisibility: () => void
	clearErrors: () => void
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // 检查密码是否匹配
    if (form.password !== form.passwordConfirm) {
      setErrorMessage('两次输入的密码不一致')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setFieldErrors({})

    try {
      console.log('开始注册请求...', form);

      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken() || '',
        },
        credentials: 'include',
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
        let parsedErrors: Record<string, string[]> = {};

        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            console.log('解析的错误数据:', errorData);

            // 处理后端返回的错误格式
            if (errorData.errors) {
              // 字段级错误
              parsedErrors = errorData.errors;
              // 从字段错误中提取主要错误消息
              const errorMessages = Object.values(errorData.errors).flat() as string[];
              errorMessage = errorMessages[0] || errorData.message || '注册失败';
            } else if (errorData.message) {
              // 通用错误消息
              errorMessage = errorData.message;
            }
          } catch (parseError) {
            console.error('解析错误响应失败:', parseError);
            errorMessage = responseText || '注册失败';
          }
        }

        setErrorMessage(errorMessage);
        setFieldErrors(parsedErrors);
        return;
      }

      // 解析成功响应
      const data = JSON.parse(responseText);
      console.log('注册成功:', data);

      if (data.success) {
        alert('注册成功！请登录');
        // 跳转到登录页面
        window.location.href = '/login';
      } else {
        setErrorMessage(data.message || '注册失败');
      }
    } catch (err) {
      console.error('注册错误:', err);
      setErrorMessage(err instanceof Error ? err.message : '网络错误，请检查网络连接');
    } finally {
      setIsSubmitting(false);
    }
  }

  const clearErrors = () => {
    setErrorMessage(null);
    setFieldErrors({});
  }

  // ... 其他函数保持不变
  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, email: event.target.value }))
    // 清除相关字段错误
    if (fieldErrors.email) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  }

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, username: event.target.value }))
    // 清除相关字段错误
    if (fieldErrors.username) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.username;
        return newErrors;
      });
    }
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, password: event.target.value }))
    // 清除密码字段错误
    if (fieldErrors.password) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
  }

  const handlePasswordConfirmChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, passwordConfirm: event.target.value }))
    // 清除密码确认字段错误
    if (fieldErrors.password_confirm) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password_confirm;
        return newErrors;
      });
    }
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
    errorMessage,
    fieldErrors,
    handleSubmit,
    handleEmailChange,
    handleUsernameChange,
    handlePasswordChange,
    handlePasswordConfirmChange,
    togglePasswordVisibility,
    togglePasswordConfirmVisibility,
    clearErrors,
  }
}
type SignUpFormProps = {
	form: FormState
	isSubmitting: boolean
	showPassword: boolean
	showPasswordConfirm: boolean
	passwordsMatch: boolean
	errorMessage: string | null
	fieldErrors: Record<string, string[]>
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
	errorMessage,
	fieldErrors,
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
				{/* 全局错误消息 */}
				{errorMessage && (
					<div className="rounded-lg bg-red-900/20 p-4 border border-red-800">
						<div className="flex">
							<div className="flex-shrink-0">
								<svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
								</svg>
							</div>
							<div className="ml-3">
								<p className="text-sm text-red-200">
									{errorMessage}
								</p>
							</div>
						</div>
					</div>
				)}

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
						className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 ${
							fieldErrors.username
								? 'border-red-500 bg-red-50 dark:bg-red-950/20 focus:border-red-500 focus:ring-red-500/50'
								: 'border-gray-300 dark:border-slate-600 focus:border-indigo-400 focus:ring-indigo-400/50'
						}`}
						placeholder="给自己起一个独特的昵称"
					/>
					{fieldErrors.username && (
						<div className="text-sm text-red-400">
							{fieldErrors.username[0]}
						</div>
					)}
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
						className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 ${
							fieldErrors.email
								? 'border-red-500 bg-red-50 dark:bg-red-950/20 focus:border-red-500 focus:ring-red-500/50'
								: 'border-gray-300 dark:border-slate-600 focus:border-indigo-400 focus:ring-indigo-400/50'
						}`}
						placeholder="输入你的邮箱地址"
					/>
					{fieldErrors.email && (
						<div className="text-sm text-red-400">
							{fieldErrors.email[0]}
						</div>
					)}
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
					error={fieldErrors.password?.[0]}
					hasError={!!fieldErrors.password}
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
					error={fieldErrors.password_confirm?.[0]}
					hasError={!!fieldErrors.password_confirm}
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
		errorMessage,
		fieldErrors,
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
						errorMessage={errorMessage}
						fieldErrors={fieldErrors}
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

