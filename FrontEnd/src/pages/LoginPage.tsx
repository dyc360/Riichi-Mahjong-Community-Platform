import { Link, useNavigate } from 'react-router-dom'
import { type ChangeEvent, type FormEvent, useState } from 'react'
import {PasswordField, BrandHeader, HeroSection, BackgroundGlow, Prompt, PolicyFooter, SocialLogin} from '../components/loginComp'
import { useAuth } from '../contexts/AuthContext';
import { getCsrfToken } from '../utils';

const API_BASE_URL = '/api';

// Shared shape for the login form data fields.
type FormState = {
  usernameOrEmail: string
  password: string
  remember: boolean
}

type UseLoginFormResult = {
  form: FormState
  isSubmitting: boolean
  showPassword: boolean
  errorMessage: string | null
  fieldErrors: Record<string, string[]>
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
  handleUsernameOrEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
  handlePasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleRememberChange: (event: ChangeEvent<HTMLInputElement>) => void
  togglePasswordVisibility: () => void
  clearErrors: () => void
}



// Centralises login-related state and handlers so the view stays lean.
function useLoginForm(): UseLoginFormResult {
  const [form, setForm] = useState<FormState>({
    usernameOrEmail: '',
    password: '',
    remember: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // 在这里调用 useAuth 和 useNavigate
  const navigate = useNavigate();
  const authContext = useAuth();

const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault()
  setIsSubmitting(true)
  setErrorMessage(null)
  setFieldErrors({})

  try {
    console.log('开始登录请求...');

    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken() || '',
      },
      credentials: 'include',
      body: JSON.stringify({
        ...(form.usernameOrEmail.includes('@') 
          ? { email: form.usernameOrEmail } 
          : { username: form.usernameOrEmail }),
        password: form.password
      }),
    });

    console.log('响应状态:', response.status);

    // 先读取响应文本
    const responseText = await response.text();
    console.log('登录响应文本:', responseText);

    if (!response.ok) {
      // 尝试解析错误信息
      let errorMessage = '登录失败';
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
            errorMessage = errorMessages[0] || errorData.message || '登录失败';
          } else if (errorData.message) {
            // 通用错误消息
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('解析错误响应失败:', parseError);
          errorMessage = responseText || '登录失败';
        }
      }

      setErrorMessage(errorMessage);
      setFieldErrors(parsedErrors);
      return;
    }

    // 解析成功响应
    const data = JSON.parse(responseText);
    console.log('登录响应数据:', data);

    if (data.success && data.token) {
      // 根据您的 AuthContext 结构转换数据
      const user = {
        id: data.user.id.toString(), // 转换为 string
        username: data.user.username, // 后端返回 username
        email: data.user.email || form.usernameOrEmail // 使用后端返回的email，如果没有则使用输入的标识符
      };

      // 使用 AuthContext 的 login 方法
      authContext.login(data.token, user);

      // 跳转到主页
      navigate('/home', { replace: true });
    } else {
      setErrorMessage(data.message || '登录失败');
    }
  } catch (err) {
    console.error('登录错误:', err);
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
  const handleUsernameOrEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, usernameOrEmail: event.target.value }))
    // 清除相关字段错误
    if (fieldErrors.username || fieldErrors.email) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.username;
        delete newErrors.email;
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
    errorMessage,
    fieldErrors,
    handleSubmit,
    handleUsernameOrEmailChange,
    handlePasswordChange,
    handleRememberChange,
    togglePasswordVisibility,
    clearErrors,
  }
}

type LoginFormProps = {
  form: FormState
  isSubmitting: boolean
  showPassword: boolean
  errorMessage: string | null
  fieldErrors: Record<string, string[]>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onUsernameOrEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRememberChange: (event: ChangeEvent<HTMLInputElement>) => void
  onTogglePasswordVisibility: () => void
}

// Houses the credential inputs plus social-login affordances.
function LoginForm({
  form,
  isSubmitting,
  showPassword,
  errorMessage,
  fieldErrors,
  onSubmit,
  onUsernameOrEmailChange,
  onPasswordChange,
  onRememberChange,
  onTogglePasswordVisibility,
}: LoginFormProps) {
  return (
    <div className="login-card rounded-3xl border p-8 shadow-glow backdrop-blur">
      <form className="space-y-6" onSubmit={onSubmit}>
        {/* 全局错误消息 */}
        {errorMessage && (
          <div className="rounded-lg bg-red-950/20 p-4 border border-red-800">
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
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="usernameOrEmail">
            用户名或邮箱
          </label>
          <input
            id="usernameOrEmail"
            type="text"
            required
            autoComplete="username email"
            value={form.usernameOrEmail}
            onChange={onUsernameOrEmailChange}
            className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
              (fieldErrors.username || fieldErrors.email)
                ? 'border-red-500 bg-red-950/20 focus:border-red-500 focus:ring-red-500/50'
                : 'border-slate-700/80 bg-slate-950/80 focus:border-indigo-400 focus:ring-indigo-400/50'
            }`}
            placeholder="用户名或邮箱地址"
          />
          {(fieldErrors.username || fieldErrors.email) && (
            <div className="text-sm text-red-400">
              {fieldErrors.username?.[0] || fieldErrors.email?.[0]}
            </div>
          )}
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
          error={fieldErrors.password?.[0]}
          hasError={!!fieldErrors.password}
        />

        <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
          <label className="font-medium text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={onRememberChange}
              className="h-4 w-4 rounded text-indigo-400 focus:ring-indigo-400/70"
            />
            <span className="font-medium text-slate-700 dark:text-slate-200">记住我</span>
          </label>
          <a className="font-medium dark:text-indigo-300 text-indigo-500 hover:text-indigo-200" href="#">
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



// Pulls everything together so layout, logic, and decoration stay focused.
function LoginPage() {
  const {
    form,
    isSubmitting,
    showPassword,
    errorMessage,
    fieldErrors,
    handleSubmit,
    handleUsernameOrEmailChange,
    handlePasswordChange,
    handleRememberChange,
    togglePasswordVisibility,
  } = useLoginForm()

  return (
    <div className="relative flex min-h-screen flex-col 
      bg-gradient-to-br from-gray-50 via-gray-100 to-indigo-100
      dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <BackgroundGlow />
      <BrandHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <HeroSection 
            welcomeMessage="欢迎访问MajHub!"
            suggestionText="使用你的邮箱和密码登录。"
          />
          <LoginForm
            form={form}
            isSubmitting={isSubmitting}
            showPassword={showPassword}
            errorMessage={errorMessage}
            fieldErrors={fieldErrors}
            onSubmit={handleSubmit}
            onUsernameOrEmailChange={handleUsernameOrEmailChange}
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
