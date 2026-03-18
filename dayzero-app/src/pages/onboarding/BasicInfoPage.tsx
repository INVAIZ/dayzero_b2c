import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { useOnboardingTransition } from '../../components/onboarding/useOnboardingTransition';
import { colors, font, radius, spacing, shadow } from '../../design/tokens';

import { useOnboarding, type ForwarderValue } from '../../components/onboarding/OnboardingContext';

interface ForwarderPreset {
    id: ForwarderValue;
    label: string;
    zipCode: string;
    addressLine1: string;
    addressLine2: string;
}

const PRESETS: ForwarderPreset[] = [
    {
        id: 'qx',
        label: '큐익스프레스 (Qxpress)',
        zipCode: '273-0012',
        addressLine1: '千葉県船橋市浜町2-5-7',
        addressLine2: 'MFLP船橋1-3階 Qxpress',
    },
    {
        id: 'rincos',
        label: '링코스 (Rincos)',
        zipCode: '143-0001',
        addressLine1: '東京都大田区東海4-2-3',
        addressLine2: 'リンコス東京物流管理センター',
    },
    {
        id: 'kse',
        label: 'KSE 국제로지스틱 (Kokusai Express)',
        zipCode: '812-0051',
        addressLine1: '福岡県福岡市東区箱崎ふ頭4丁目2-39',
        addressLine2: '国際エキスプレス 福岡保税倉庫',
    },
    {
        id: 'other',
        label: '직접 입력하기 (기타)',
        zipCode: '',
        addressLine1: '',
        addressLine2: '',
    }
];

export default function BasicInfoPage() {
    const { state, setState } = useOnboarding();
    const { exiting, transitionTo } = useOnboardingTransition();
    const [step, setStep] = useState(1);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        forwarder,
        zipCode,
        addressLine1,
        addressLine2,
        sameAsShipping,
        returnZipCode,
        returnAddressLine1,
        returnAddressLine2,
        contact
    } = state;

    const updateState = (updates: Partial<typeof state>) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePresetSelect = (val: ForwarderValue) => {
        const preset = PRESETS.find(p => p.id === val);
        const updates: Parameters<typeof updateState>[0] = { forwarder: val };

        if (preset && preset.id !== 'other') {
            updates.zipCode = preset.zipCode;
            updates.addressLine1 = preset.addressLine1;
            updates.addressLine2 = preset.addressLine2;
        } else if (preset?.id === 'other') {
            updates.zipCode = '';
            updates.addressLine1 = '';
            updates.addressLine2 = '';
        }

        updateState(updates);
        setIsDropdownOpen(false);
    };

    const isStep1Valid = () => {
        if (!forwarder) return false;
        if (!zipCode || !addressLine1) return false;
        if (!sameAsShipping) {
            if (!returnZipCode || !returnAddressLine1) return false;
        }
        return true;
    };

    const isStep2Valid = () => {
        return !!contact;
    };

    const handleNext = () => {
        if (step === 1 && isStep1Valid()) {
            setStep(2);
        } else if (step === 2 && isStep2Valid()) {
            transitionTo('/basic-margin');
        }
    };

    const inputStyles: React.CSSProperties = {
        width: '100%',
        padding: spacing['4'],
        borderRadius: radius.lg,
        border: `1px solid ${colors.border.default}`,
        fontSize: font.size.base,
        color: colors.text.primary,
        backgroundColor: colors.bg.surface,
        boxSizing: 'border-box',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        outline: 'none',
        fontFamily: font.family.sans,
    };

    const labelStyles: React.CSSProperties = {
        display: 'block',
        fontSize: font.size.md,
        fontWeight: font.weight.semibold,
        color: colors.text.secondary,
        marginBottom: spacing['2'],
    };

    const isValid = step === 1 ? isStep1Valid() : isStep2Valid();

    return (
        <OnboardingLayout currentStep={2} exiting={exiting} onStepClick={(stepId) => { if (stepId === 1) transitionTo('/qoo10-connect'); if (stepId === 3) transitionTo('/basic-margin'); }}>
            <div style={{ padding: `0 ${spacing['5']}` }}>
                {/* Step 1: Forwarder + Address + Return Address */}
                {step === 1 && (
                    <div style={{ animation: 'fadeSlideIn 0.3s ease' }}>
                        <h2 style={{
                            fontSize: '26px',
                            fontWeight: 800,
                            color: colors.text.primary,
                            textAlign: 'center',
                            margin: `0 0 ${spacing['3']}`,
                            letterSpacing: '-0.5px',
                        }}>
                            일본 출하지와 반품 주소를 설정해주세요
                        </h2>
                        <p style={{
                            fontSize: font.size.base,
                            color: colors.text.tertiary,
                            textAlign: 'center',
                            margin: `0 0 ${spacing['8']}`,
                            lineHeight: font.lineHeight.normal,
                            wordBreak: 'keep-all',
                        }}>
                            배송대행사를 선택하면 해당 창고 주소가 자동으로 입력됩니다.
                        </p>

                        <div style={{
                            background: colors.bg.surface,
                            borderRadius: radius.xl,
                            padding: spacing['8'],
                            boxShadow: shadow.sm,
                            border: `1px solid ${colors.bg.subtle}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: spacing['8'],
                        }}>
                            {/* Forwarder Dropdown */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['5'] }}>
                                <div>
                                    <label style={labelStyles}>출하지 주소 <span style={{ color: colors.primary }}>*</span></label>
                                    <div style={{ position: 'relative' }} ref={dropdownRef}>
                                        <div
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            style={{
                                                ...inputStyles,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer',
                                                color: forwarder ? colors.text.primary : colors.text.muted,
                                                borderColor: isDropdownOpen ? colors.primary : colors.border.default,
                                                boxShadow: isDropdownOpen ? '0 0 0 3px rgba(49, 130, 246, 0.1)' : 'none',
                                                userSelect: 'none',
                                            }}
                                        >
                                            <span>
                                                {forwarder ? PRESETS.find(p => p.id === forwarder)?.label : '배송대행사를 선택하면 주소가 자동 입력됩니다'}
                                            </span>
                                            <ChevronDown
                                                size={20}
                                                color={isDropdownOpen ? colors.primary : colors.text.muted}
                                                style={{
                                                    transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                                                    transition: 'transform 0.2s ease, color 0.2s ease',
                                                }}
                                            />
                                        </div>

                                        {isDropdownOpen && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 'calc(100% + 8px)',
                                                left: 0,
                                                width: '100%',
                                                background: colors.bg.surface,
                                                border: `1px solid ${colors.border.default}`,
                                                borderRadius: radius.lg,
                                                boxShadow: shadow.md,
                                                overflow: 'hidden',
                                                zIndex: 10,
                                                animation: 'dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                            }}>
                                                <style>{`
                                                    @keyframes dropdownFadeIn {
                                                        from { opacity: 0; transform: translateY(-8px); }
                                                        to { opacity: 1; transform: translateY(0); }
                                                    }
                                                    .dropdown-item {
                                                        padding: 16px;
                                                        font-size: 15px;
                                                        color: ${colors.text.primary};
                                                        cursor: pointer;
                                                        transition: background 0.2s ease;
                                                    }
                                                    .dropdown-item:hover {
                                                        background: ${colors.bg.page};
                                                    }
                                                    .dropdown-item-selected {
                                                        background: ${colors.primaryLight};
                                                        color: ${colors.primary};
                                                        font-weight: 600;
                                                    }
                                                    .dropdown-item-selected:hover {
                                                        background: ${colors.primaryHover};
                                                    }
                                                `}</style>
                                                {PRESETS.map((p) => (
                                                    <div
                                                        key={p.id}
                                                        className={`dropdown-item ${forwarder === p.id ? 'dropdown-item-selected' : ''}`}
                                                        onClick={() => handlePresetSelect(p.id)}
                                                    >
                                                        {p.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Address auto-fill */}
                                {forwarder && (
                                    <div style={{
                                        padding: spacing['5'],
                                        background: colors.bg.faint,
                                        borderRadius: radius.lg,
                                        border: `1px solid ${colors.border.default}`,
                                        animation: 'fadeSlideIn 0.25s ease',
                                    }}>
                                        <div style={{
                                            fontSize: font.size.base,
                                            fontWeight: font.weight.bold,
                                            color: colors.text.primary,
                                            marginBottom: spacing['3'],
                                        }}>
                                            출하지 (일본 창고 주소)
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2'] }}>
                                            <input
                                                value={zipCode}
                                                onChange={(e) => updateState({ zipCode: e.target.value })}
                                                placeholder="우편번호 (예: 273-0012)"
                                                style={{
                                                    ...inputStyles,
                                                    background: forwarder !== 'other' ? colors.bg.subtle : colors.bg.surface,
                                                }}
                                                disabled={forwarder !== 'other'}
                                            />
                                            <input
                                                value={addressLine1}
                                                onChange={(e) => updateState({ addressLine1: e.target.value })}
                                                placeholder="기본 주소"
                                                style={{
                                                    ...inputStyles,
                                                    background: forwarder !== 'other' ? colors.bg.subtle : colors.bg.surface,
                                                }}
                                                disabled={forwarder !== 'other'}
                                            />
                                            <input
                                                value={addressLine2}
                                                onChange={(e) => updateState({ addressLine2: e.target.value })}
                                                placeholder="상세 주소"
                                                style={{
                                                    ...inputStyles,
                                                    background: forwarder !== 'other' ? colors.bg.subtle : colors.bg.surface,
                                                }}
                                                disabled={forwarder !== 'other'}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Return Address */}
                            <div style={{
                                borderTop: `1px solid ${colors.bg.subtle}`,
                                paddingTop: spacing['6'],
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ ...labelStyles, marginBottom: 0 }}>
                                        반품 주소 <span style={{ color: colors.primary }}>*</span>
                                    </label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: spacing['2'],
                                        cursor: 'pointer',
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={sameAsShipping}
                                            onChange={(e) => updateState({ sameAsShipping: e.target.checked })}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                cursor: 'pointer',
                                                accentColor: colors.primary,
                                            }}
                                        />
                                        <span style={{
                                            fontSize: font.size.md,
                                            fontWeight: font.weight.medium,
                                            color: colors.text.secondary,
                                        }}>
                                            위 출하지 주소와 동일
                                        </span>
                                    </label>
                                </div>

                                {!sameAsShipping && (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: spacing['3'],
                                        marginTop: spacing['4'],
                                        animation: 'fadeSlideIn 0.25s ease',
                                    }}>
                                        <input
                                            value={returnZipCode}
                                            onChange={(e) => updateState({ returnZipCode: e.target.value })}
                                            placeholder="우편번호"
                                            style={inputStyles}
                                        />
                                        <input
                                            value={returnAddressLine1}
                                            onChange={(e) => updateState({ returnAddressLine1: e.target.value })}
                                            placeholder="기본 주소"
                                            style={inputStyles}
                                        />
                                        <input
                                            value={returnAddressLine2}
                                            onChange={(e) => updateState({ returnAddressLine2: e.target.value })}
                                            placeholder="상세 주소"
                                            style={inputStyles}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Contact */}
                {step === 2 && (
                    <div style={{ animation: 'fadeSlideIn 0.3s ease' }}>
                        <h2 style={{
                            fontSize: '26px',
                            fontWeight: 800,
                            color: colors.text.primary,
                            textAlign: 'center',
                            margin: `0 0 ${spacing['3']}`,
                            letterSpacing: '-0.5px',
                        }}>
                            연락처를 입력해주세요
                        </h2>
                        <p style={{
                            fontSize: font.size.base,
                            color: colors.text.tertiary,
                            textAlign: 'center',
                            margin: `0 0 ${spacing['8']}`,
                            lineHeight: font.lineHeight.normal,
                            wordBreak: 'keep-all',
                        }}>
                            배송 문제나 클레임 발생 시 연락 가능한 번호를 입력해주세요.
                        </p>

                        <div style={{
                            background: colors.bg.surface,
                            borderRadius: radius.xl,
                            padding: spacing['8'],
                            boxShadow: shadow.sm,
                            border: `1px solid ${colors.bg.subtle}`,
                        }}>
                            <label style={labelStyles}>
                                스토어 연락처 <span style={{ color: colors.primary }}>*</span>
                            </label>
                            <input
                                value={contact}
                                onChange={(e) => updateState({ contact: e.target.value })}
                                placeholder="고객 응대용 연락처 입력 (예: 010-1234-5678)"
                                style={inputStyles}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = colors.primary;
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(49, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = colors.border.default;
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div style={{
                    marginTop: spacing['6'],
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing['3'],
                }}>
                    <button
                        onClick={handleNext}
                        disabled={!isValid}
                        style={{
                            width: '100%',
                            height: '52px',
                            background: !isValid ? colors.border.light : colors.primary,
                            color: colors.bg.surface,
                            border: 'none',
                            borderRadius: radius.lg,
                            fontSize: '16px',
                            fontWeight: font.weight.semibold,
                            cursor: !isValid ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: spacing['2'],
                            transition: 'background 0.2s, transform 0.1s',
                        }}
                        onMouseDown={(e) => {
                            if (isValid) e.currentTarget.style.transform = 'scale(0.98)';
                        }}
                        onMouseUp={(e) => {
                            if (isValid) e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        {step === 1 ? '다음' : '다음 단계로 계속'}
                    </button>
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            style={{
                                width: '100%',
                                height: '44px',
                                background: 'transparent',
                                color: colors.text.tertiary,
                                border: 'none',
                                borderRadius: radius.lg,
                                fontSize: font.size.base,
                                fontWeight: font.weight.medium,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'color 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = colors.text.primary}
                            onMouseOut={(e) => e.currentTarget.style.color = colors.text.tertiary}
                        >
                            이전으로
                        </button>
                    )}
                </div>

                <style>{`
                    @keyframes fadeSlideIn {
                        from { opacity: 0; transform: translateY(8px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
        </OnboardingLayout>
    );
}
