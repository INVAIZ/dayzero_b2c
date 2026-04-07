import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import SignupForm from '../../components/auth/SignupForm';
import { colors, font, radius } from '../../design/tokens';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const toastColor: Record<ToastType, string> = {
  success: colors.successAlt,
  error: colors.danger,
  info: colors.primary,
};

let toastId = 0;

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formKey, setFormKey] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const switchMode = (next: 'login' | 'signup') => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setMode(next);
      setFormKey(k => k + 1);
      setTransitioning(false);
    }, 180);
  };

  const handleSuccess = () => {
    navigate('/qoo10-connect');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.bg.page,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* 토스트 */}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              background: colors.bg.surface,
              borderRadius: radius.lg,
              boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
              display: 'flex',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ width: '4px', background: toastColor[toast.type], flexShrink: 0 }} />
            <p
              style={{
                padding: '13px 20px',
                margin: 0,
                fontSize: font.size.md,
                fontWeight: font.weight.medium,
                color: colors.text.primary,
                fontFamily: 'Pretendard, sans-serif',
              }}
            >
              {toast.message}
            </p>
          </div>
        ))}
      </div>

      {/* 카드 */}
      <div
        className="auth-card"
        style={{
          width: '100%',
          maxWidth: '400px',
          background: colors.bg.surface,
          borderRadius: '20px',
          padding: '40px 32px 32px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.06)',
        }}
      >
        <div
          key={formKey}
          className="form-enter"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? 'translateY(6px)' : 'translateY(0)',
            transition: 'opacity 0.18s ease, transform 0.18s ease',
          }}
        >
          {mode === 'login' ? (
            <LoginForm
              onSwitchToSignup={() => switchMode('signup')}
              onSuccess={handleSuccess}
              onToast={addToast}
            />
          ) : (
            <SignupForm
              onSwitchToLogin={() => switchMode('login')}
              onSuccess={handleSuccess}
              onToast={addToast}
            />
          )}
        </div>
      </div>
    </div>
  );
}
