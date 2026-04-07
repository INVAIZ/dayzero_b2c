import { useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import PasswordInput from './PasswordInput';
import SocialLoginButton from './SocialLoginButton';
import { useAuthForm } from '../../hooks/useAuthForm';
import { mockSignup, mockGoogleLogin } from '../../mock/authMock';
import { colors, font } from '../../design/tokens';

interface SignupFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function SignupForm({ onSwitchToLogin, onSuccess, onToast }: SignupFormProps) {
  const { validateEmail, getPasswordChecks, isPasswordValid } = useAuthForm();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const checks = getPasswordChecks(password);

  const handleEmailChange = (value: string) => {
    const trimmed = value.replace(/\s/g, '');
    setEmail(trimmed);
    if (emailError) setEmailError(validateEmail(trimmed));
  };

  const handleConfirmChange = (value: string) => {
    setConfirm(value);
    if (confirmError) setConfirmError(value !== password ? '비밀번호가 일치하지 않아요' : null);
  };

  const handleSubmit = async () => {
    const emailErr = validateEmail(email);
    const confirmErr = confirm !== password ? '비밀번호가 일치하지 않아요' : null;
    setEmailError(emailErr);
    setConfirmError(confirmErr);
    if (emailErr || !isPasswordValid(password) || confirmErr) return;

    setLoading(true);
    await mockSignup(email, password);
    setLoading(false);
    onToast('가입 완료! DayZero를 시작할게요', 'success');
    setTimeout(() => onSuccess(), 1500);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    await mockGoogleLogin();
    setGoogleLoading(false);
    onSuccess();
  };

  const checkItems = [
    { key: 'length', label: '8자 이상', met: checks.length },
    { key: 'letter', label: '영문 포함', met: checks.letter },
    { key: 'number', label: '숫자 포함', met: checks.number },
    { key: 'special', label: '특수문자 포함 (!@#$%^&*)', met: checks.special },
  ];

  return (
    <div>
      {/* 로고 */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <img
          src="/dayzero-logo.png"
          alt="DayZero"
          style={{ height: '30px', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Google */}
      <SocialLoginButton onClick={handleGoogleLogin} loading={googleLoading} />

      {/* 구분선 */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
        <div style={{ flex: 1, height: '1px', background: colors.border.default }} />
        <span style={{ padding: '0 12px', fontSize: font.size.sm, color: colors.text.placeholder }}>또는</span>
        <div style={{ flex: 1, height: '1px', background: colors.border.default }} />
      </div>

      {/* 이메일 */}
      <div style={{ marginBottom: '4px' }}>
        <div className={`input-line${emailError ? ' has-error' : ''}`}>
          <input
            type="email"
            value={email}
            onChange={e => handleEmailChange(e.target.value)}
            onBlur={() => setEmailError(validateEmail(email))}
            placeholder="이메일"
          />
        </div>
        {emailError && (
          <p style={{ marginTop: '6px', fontSize: font.size.sm, color: colors.danger }}>
            {emailError}
          </p>
        )}
      </div>

      {/* 비밀번호 */}
      <div style={{ marginTop: '20px' }}>
        <PasswordInput value={password} onChange={setPassword} />
      </div>

      {/* 체크리스트 */}
      {password.length > 0 && (
        <div style={{ marginTop: '12px', marginBottom: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {checkItems.map(item => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {item.met
                ? <CheckCircle2 size={14} color={colors.successAlt} />
                : <Circle size={14} color={colors.border.light} />
              }
              <span style={{ fontSize: font.size.sm, color: item.met ? colors.successAlt : colors.text.disabled }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 비밀번호 확인 */}
      <div style={{ marginTop: '20px', marginBottom: '28px' }}>
        <PasswordInput
          value={confirm}
          onChange={handleConfirmChange}
          placeholder="비밀번호 확인"
          error={confirmError}
        />
      </div>

      {/* CTA */}
      <button
        type="button"
        className="btn-primary"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
        {loading ? '가입 처리 중...' : '가입하기'}
      </button>

      {/* 로그인 링크 */}
      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: font.size.md, color: colors.text.muted }}>
        이미 계정이 있으신가요?{' '}
        <button
          type="button"
          className="btn-link"
          onClick={onSwitchToLogin}
          style={{ color: colors.primary, fontWeight: font.weight.semibold, fontSize: font.size.md }}
        >
          로그인하기
        </button>
      </p>
    </div>
  );
}
