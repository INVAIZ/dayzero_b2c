import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { colors, font, radius } from '../../design/tokens';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  variant?: 'line' | 'rounded';
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = '비밀번호를 입력해주세요',
  error,
  variant = 'line',
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  const isRounded = variant === 'rounded';

  return (
    <div>
      <div
        className={isRounded ? undefined : `input-line pw-input${error ? ' has-error' : ''}`}
        style={{ position: 'relative' }}
      >
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={isRounded ? {
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: '14px 40px 14px 16px',
            fontSize: font.size.base,
            color: colors.text.primary,
            fontFamily: 'Pretendard, sans-serif',
            borderRadius: radius.lg,
          } : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          style={{
            position: 'absolute',
            right: isRounded ? '12px' : 0,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: colors.text.placeholder,
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = colors.text.muted)}
          onMouseLeave={e => (e.currentTarget.style.color = colors.text.placeholder)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <p style={{ marginTop: '6px', fontSize: font.size.sm, color: colors.danger, fontFamily: 'Pretendard, sans-serif' }}>
          {error}
        </p>
      )}
    </div>
  );
}
