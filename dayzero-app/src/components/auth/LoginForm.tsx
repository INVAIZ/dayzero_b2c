import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import PasswordInput from './PasswordInput';
import { useAuthForm } from '../../hooks/useAuthForm';
import { mockLogin, mockGoogleLogin } from '../../mock/authMock';
import { colors, font, radius } from '../../design/tokens';

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSuccess: () => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function LoginForm({ onSwitchToSignup, onSuccess, onToast }: LoginFormProps) {
  const { validateEmail } = useAuthForm();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailChange = (value: string) => {
    const trimmed = value.replace(/\s/g, '');
    setEmail(trimmed);
    if (emailError) setEmailError(validateEmail(trimmed));
  };

  const handleSubmit = async () => {
    const emailErr = validateEmail(email);
    const pwdErr = password ? null : '비밀번호를 입력해주세요';
    setEmailError(emailErr);
    setPasswordError(pwdErr);
    if (emailErr || pwdErr) return;

    setLoading(true);
    await mockLogin(email, password);
    setLoading(false);
    onSuccess();
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    await mockGoogleLogin();
    setGoogleLoading(false);
    onSuccess();
  };

  const handleForgotPassword = () => {
    onToast('입력하신 이메일로 재설정 링크를 보냈어요. 메일함을 확인해주세요', 'info');
  };

  return (
    <div>
      {/* 로고 */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <img
          src="/dayzero-logo.png"
          alt="DayZero"
          style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* 이메일 */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          fontSize: font.size.md,
          fontWeight: font.weight.semibold,
          color: colors.text.primary,
          marginBottom: '8px',
          fontFamily: 'Pretendard, sans-serif',
        }}>
          이메일
        </label>
        <div style={{
          background: colors.bg.subtle,
          borderRadius: radius.lg,
          border: emailError ? `1.5px solid ${colors.danger}` : '1.5px solid transparent',
          transition: 'border-color 0.18s ease',
        }}>
          <input
            type="email"
            value={email}
            onChange={e => handleEmailChange(e.target.value)}
            onBlur={() => setEmailError(validateEmail(email))}
            onFocus={e => {
              if (!emailError) e.currentTarget.parentElement!.style.borderColor = colors.primary;
            }}
            onBlurCapture={e => {
              if (!emailError) e.currentTarget.parentElement!.style.borderColor = 'transparent';
            }}
            placeholder="이메일을 입력해주세요"
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              padding: '14px 16px',
              fontSize: font.size.base,
              color: colors.text.primary,
              fontFamily: 'Pretendard, sans-serif',
              borderRadius: radius.lg,
            }}
          />
        </div>
        {emailError && (
          <p style={{ marginTop: '6px', fontSize: font.size.sm, color: colors.danger, fontFamily: 'Pretendard, sans-serif' }}>
            {emailError}
          </p>
        )}
      </div>

      {/* 비밀번호 */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: font.size.md,
          fontWeight: font.weight.semibold,
          color: colors.text.primary,
          marginBottom: '8px',
          fontFamily: 'Pretendard, sans-serif',
        }}>
          비밀번호
        </label>
        <div style={{
          background: colors.bg.subtle,
          borderRadius: radius.lg,
          border: passwordError ? `1.5px solid ${colors.danger}` : '1.5px solid transparent',
          position: 'relative',
          transition: 'border-color 0.18s ease',
        }}>
          <PasswordInput
            value={password}
            onChange={val => { setPassword(val); if (passwordError) setPasswordError(null); }}
            error={null}
            variant="rounded"
          />
        </div>
        {passwordError && (
          <p style={{ marginTop: '6px', fontSize: font.size.sm, color: colors.danger, fontFamily: 'Pretendard, sans-serif' }}>
            {passwordError}
          </p>
        )}
      </div>

      {/* 비밀번호 찾기 */}
      <div style={{ textAlign: 'right', marginBottom: '28px' }}>
        <button
          type="button"
          className="btn-link"
          onClick={handleForgotPassword}
          style={{ fontSize: font.size.sm, color: colors.text.disabled }}
        >
          비밀번호를 잊으셨나요?
        </button>
      </div>

      {/* CTA */}
      <button
        type="button"
        className="btn-primary"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
        {loading ? '로그인 확인 중...' : '로그인'}
      </button>

      {/* 회원가입 */}
      <div style={{
        marginTop: '16px',
        background: colors.bg.subtle,
        borderRadius: radius.lg,
        padding: '14px',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: font.size.md, color: colors.text.muted, fontFamily: 'Pretendard, sans-serif' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: font.weight.semibold }}>DayZero</span>가 처음이에요{' '}
        </span>
        <button
          type="button"
          className="btn-link"
          onClick={onSwitchToSignup}
          style={{ color: colors.primary, fontWeight: font.weight.bold, fontSize: font.size.md }}
        >
          가입하기
        </button>
      </div>

      {/* 구분선 */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 20px' }}>
        <div style={{ flex: 1, height: '1px', background: colors.border.default }} />
        <span style={{ padding: '0 14px', fontSize: font.size.sm, color: colors.text.placeholder }}>또는</span>
        <div style={{ flex: 1, height: '1px', background: colors.border.default }} />
      </div>

      {/* Google */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: `1.5px solid ${colors.border.default}`,
            background: colors.bg.surface,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s, border-color 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = colors.bg.faint;
            e.currentTarget.style.borderColor = colors.border.light;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = colors.bg.surface;
            e.currentTarget.style.borderColor = colors.border.default;
          }}
        >
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
        </button>
      </div>
    </div>
  );
}
