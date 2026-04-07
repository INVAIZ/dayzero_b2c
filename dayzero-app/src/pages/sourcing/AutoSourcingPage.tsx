import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { SOURCING_PROVIDERS } from '../../types/sourcing';
import type { SourcingProvider } from '../../types/sourcing';
import { useSourcingStore } from '../../store/useSourcingStore';
import { CheckCircle2, Loader2, X, Clock, ChevronDown, Check } from 'lucide-react';
import { colors, font, radius, spacing } from '../../design/tokens';

// Mock Category Data
const MOCK_CATEGORIES: Record<string, string[]> = {
    '올리브영': ['전체', '뷰티 - 스킨케어', '뷰티 - 메이크업', '뷰티 - 선케어', '헬스/푸드', '다이어트', '건강식품', '구강케어', '바디케어', '헤어케어', '멘즈케어', '향수/디퓨저', '생활/잡화'],
    '쿠팡': ['전체', '로켓배송 - 생활용품', '로켓배송 - 식품', '가전/디지털', '패션의류/잡화', '뷰티', '출산/유아동', '홈/인테리어', '스포츠/레저', '반려동물용품', '문구/오피스', '건강식품'],
    '네이버 스마트스토어': ['전체', '패션의류', '패션잡화', '화장품/미용', '디지털/가전', '가구/인테리어', '출산/육아', '식품', '스포츠/레저', '생활/건강'],
    'G마켓': ['전체', '브랜드 의류', '브랜드 신발/가방', '뷰티', '식품', '신선식품', '생필품/바디/헤어', '출산/육아', '유아동의류/신발', '모바일/태블릿', '컴퓨터/기기', '홈쇼핑'],
    '다이소': ['전체', '수납/정리', '청소/세탁', '주방용품', '욕실용품', '홈데코', '문구/팬시', '취미/공예', '파티/포장', '반려동물', '미용/퍼스널케어', '패션/소품', '공구/DIY', '식품'],
    'yes24': ['전체', '국내도서', '외국도서', 'eBook', '웹소설/코믹', 'CD/LP', 'DVD/Blu-ray', '문구/GIFT', '티켓', '중고샵'],
    '알라딘': ['전체', '국내도서', '외국도서', 'eBook', '웹소설', '만화', '음반', '블루레이/DVD', '알라딘 굿즈', '중고매장'],
    'Ktown4u': ['전체', 'CD/LP', 'DVD/Blu-ray', 'Photobook', 'Magazine', 'K-Beauty', 'Goods', 'Fashion', 'Concert/Ticket'],
    '위버스샵': ['전체', 'Official Merch', 'Album', 'DVD/BLU-RAY', 'Book', 'Membership', 'Tour Merch', 'Digital Item'],
    '메이크스타': ['전체', '프로젝트 리워드', '앨범', '굿즈', '포토북', 'MD', '이벤트 상품'],
    '위치폼': ['전체', 'K-POP 아이돌', '투디/애니메이션', '버추얼', '웹툰/웹소설', '방송/유튜버', '인디/밴드', '창작/오리지널', '기타'],
    'FANS': ['전체', 'Album', 'Official MD', 'Tour MD', 'Membership', 'Magazine', 'Photo/Card', 'Accessories'],
    'default': ['전체', '인기 카테고리 1', '인기 카테고리 2', '인기 카테고리 3', '추천 카테고리 1', '추천 카테고리 2']
};

const TIME_OPTIONS = Array.from({ length: 18 }, (_, i) => {
    const hour = i + 6; // 06:00 ~ 23:00
    return `${String(hour).padStart(2, '0')}:00`;
});

interface ProviderSetting {
    provider: SourcingProvider;
    criteria?: '인기상품' | '전체상품';
    category: string;
}

export default function AutoSourcingPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const isEditMode = !!editId;
    const { schedules, addSchedule, updateSchedule, addNotification, setSelectedAutoFilter } = useSourcingStore();

    const [currentStep, setCurrentStep] = useState(1);
    const [providerSettings, setProviderSettings] = useState<ProviderSetting[]>([]);
    const [selectedTime, setSelectedTime] = useState('07:00');

    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [testStep, setTestStep] = useState<0 | 1 | 2 | 3>(0);
    const [testProgress, setTestProgress] = useState(0);

    useEffect(() => {
        if (editId) {
            const existing = schedules.find(s => s.id === editId);
            if (existing) {
                setProviderSettings([{
                    provider: existing.provider,
                    criteria: existing.criteria,
                    category: existing.categoryPath
                }]);
                setSelectedTime(existing.timeString);
            }
        }
    }, [editId, schedules]);

    const toggleProvider = (provider: SourcingProvider) => {
        setProviderSettings([{
            provider,
            category: ''
        }]);
    };

    const updateSetting = (provider: SourcingProvider, updates: Partial<ProviderSetting>) => {
        setProviderSettings(prev => prev.map(p =>
            p.provider === provider ? { ...p, ...updates } : p
        ));
    };

    const handleTestRun = () => {
        if (providerSettings.length === 0) return;
        setIsTestModalOpen(true);
        setTestStep(1);
        setTestProgress(0);

        let progress = 0;
        const totalDuration = 6000;
        const intervalTime = 150;
        const steps = totalDuration / intervalTime;

        const intervalId = setInterval(() => {
            progress += (100 / steps) * (Math.random() * 0.8 + 0.6);

            if (progress >= 100) {
                progress = 100;
                setTestProgress(100);
                clearInterval(intervalId);
                setTimeout(() => setTestStep(3), 600);
            } else {
                setTestProgress(Math.floor(progress));
            }
        }, intervalTime);
    };

    const getProgressText = (progress: number) => {
        if (progress < 40) return `${providerSettings[0]?.provider} 쇼핑몰에 접속 중입니다...`;
        if (progress < 80) return `조건에 맞는 상품 정보를 스캔하고 있습니다...`;
        return `수집된 상품 데이터를 정리하고 있습니다...`;
    };

    const generateRealisticTitle = (provider: string, category: string, index: number) => {
        const beautyBrands = ['아누아', '토리든', '라운드랩', '클리오', '롬앤', '닥터지', '메디힐', '마녀공장', '에스트라'];
        const fashionBrands = ['나이키', '아디다스', '무신사 스탠다드', '지오다노', '스파오', '탑텐', '언더아머'];
        const techBrands = ['삼성전자', 'LG전자', '애플', '소니', '로지텍', '필립스'];
        const kpopGroups = ['세븐틴', '뉴진스', '르세라핌', '아이브', '에스파', '투모로우바이투게더', '라이즈', '엔하이픈'];

        const getBrand = (list: string[]) => list[(index + provider.length) % list.length];

        if (provider === '올리브영') {
            const items = ['수분 진정 토너 250ml', '히알루론산 세럼 50ml', '시카 데일리 수딩 마스크 30매', '블레미쉬 크림 70ml + 30ml 기획', '벨벳 틴트 4g', '선크림 SPF50+ PA++++ 50ml 1+1 기획', '수분 앰플 대용량 에디션'];
            return `[${getBrand(beautyBrands)}] ${items[index % items.length]}`;
        } else if (provider === '위버스샵' || provider === 'Ktown4u' || provider === 'FANS') {
            const items = ['The 1st Album [Photobook Ver.]', 'Official Light Stick', '2024 Season\'s Greetings', 'Trading Card (Random)', 'Image Picket', 'Premium Photo'];
            return `${getBrand(kpopGroups)} - ${items[index % items.length]}`;
        } else if (category.includes('패션') || category.includes('의류')) {
            const items = ['오버핏 옥스포드 셔츠', '컴포트 와이드 슬랙스', '베이직 로고 반팔 티셔츠', '라이트웨이트 바람막이', '스트라이프 코튼 니트', '루즈핏 스웨트셔츠'];
            return `[${getBrand(fashionBrands)}] ${items[index % items.length]}`;
        } else if (category.includes('가전') || category.includes('디지털')) {
            const items = ['블루투스 무선 이어폰 노이즈캔슬링', '스마트워치 44mm GPS', '초고속 무선 충전기 15W', '게이밍 마우스 무선', '프리미엄 사운드바', '기계식 키보드 적축'];
            return `[${getBrand(techBrands)}] ${items[index % items.length]}`;
        } else {
            const items = ['프리미엄 세트', '시그니처 컬렉션', '베스트 에디션', '리미티드 패키지', '스타터 키트', '올인원 스탠다드'];
            const randomBrand = `브랜드${String.fromCharCode(65 + (index % 5))}`;
            return `[${randomBrand}] ${category.split(' - ').pop()} ${items[index % items.length]}`;
        }
    };

    const handleSave = () => {
        if (providerSettings.length === 0) return;

        const setting = providerSettings[0];

        if (editId) {
            updateSchedule(editId, {
                provider: setting.provider,
                categoryPath: setting.category,
                criteria: setting.criteria!,
                timeString: selectedTime,
            });
        } else {
            addSchedule({
                id: `sched-${Date.now()}-${Math.random()}`,
                provider: setting.provider,
                categoryPath: setting.category,
                criteria: setting.criteria!,
                targetCount: 50,
                timeString: selectedTime,
                isActive: true,
            });

            addNotification({
                id: `notif-${Date.now()}-${Math.random()}`,
                type: 'auto',
                title: `${setting.provider} ${setting.category} 자동 수집이 등록되었어요`,
                status: 'scheduled',
                currentCount: 0,
                totalCount: 50,
                timeString: selectedTime,
                createdAt: new Date().toISOString(),
            });

            setSelectedAutoFilter('전체');
        }

        navigate('/sourcing');
    };

    const isFormValid = providerSettings.length > 0;
    const isStep2Valid = providerSettings.length > 0 && providerSettings.every(s => s.category !== '' && !!s.criteria);

    const steps = [
        { num: 1, label: '쇼핑몰' },
        { num: 2, label: '카테고리' },
        { num: 3, label: '수집 시간' },
    ];

    // ── Step Indicator (온보딩 디자인과 동일) ──
    const renderStepIndicator = () => (
        <div style={{ width: '100%', marginBottom: spacing['8'] }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                {steps.map((step, idx) => {
                    const isCompleted = step.num < currentStep;
                    const isCurrent = step.num === currentStep;
                    const canClick = step.num < currentStep;

                    return (
                        <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <div
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    cursor: canClick ? 'pointer' : 'default',
                                    padding: `0 ${spacing['1']}`,
                                }}
                                onClick={() => canClick && setCurrentStep(step.num)}
                            >
                                {/* Circle */}
                                <div
                                    className={isCurrent ? 'step-current' : undefined}
                                    style={{
                                        width: '28px', height: '28px', borderRadius: radius.full,
                                        background: isCompleted ? colors.primary : isCurrent ? colors.bg.surface : colors.bg.subtle,
                                        border: isCurrent ? `2px solid ${colors.primary}` : isCompleted ? 'none' : `1.5px solid ${colors.border.default}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: isCompleted ? colors.bg.surface : isCurrent ? colors.primary : colors.text.muted,
                                        fontSize: font.size.xs, fontWeight: font.weight.bold,
                                        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                        flexShrink: 0,
                                        boxShadow: isCurrent ? `0 0 0 3px ${colors.primaryHover}` : 'none',
                                    }}
                                >
                                    {isCompleted ? <Check size={13} strokeWidth={3} /> : step.num}
                                </div>
                                {/* Label */}
                                <span style={{
                                    fontSize: font.size.xs,
                                    fontWeight: isCurrent ? font.weight.semibold : font.weight.medium,
                                    color: isCurrent || isCompleted ? colors.text.primary : colors.text.muted,
                                    whiteSpace: 'nowrap', marginTop: spacing['2'],
                                    transition: 'color 0.5s ease',
                                }}>
                                    {step.label}
                                </span>
                            </div>
                            {/* Connector */}
                            {idx < steps.length - 1 && (
                                <div style={{
                                    width: '56px', height: '2px', borderRadius: radius.full,
                                    background: colors.border.default,
                                    margin: `13px ${spacing['2']} 0`, flexShrink: 0,
                                    position: 'relative', overflow: 'hidden',
                                }}>
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, height: '100%',
                                        width: isCompleted ? '100%' : '0%',
                                        background: colors.primary, borderRadius: radius.full,
                                        transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                                    }} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes subtlePulse {
                    0%, 100% { box-shadow: 0 0 0 3px ${colors.primaryHover}; }
                    50% { box-shadow: 0 0 0 5px ${colors.primaryHover}; }
                }
                .step-current { animation: subtlePulse 2.5s ease-in-out infinite; }
            `}</style>
        </div>
    );

    // ── Step 1: Provider Selection ──
    const renderStep1 = () => (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <h2 style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text.primary, marginBottom: spacing['6'] }}>
                수집할 쇼핑몰을 선택해주세요
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: spacing['3'] }}>
                {SOURCING_PROVIDERS.map((provider) => {
                    const isSelected = providerSettings.some(p => p.provider === provider.name);
                    return (
                        <div
                            key={provider.name}
                            onClick={() => toggleProvider(provider.name)}
                            style={{
                                background: isSelected ? colors.bg.info : colors.bg.surface,
                                border: `1.5px solid ${isSelected ? colors.primary : colors.border.default}`,
                                borderRadius: radius.lg,
                                padding: `${spacing['4']} ${spacing['3']}`,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: spacing['3'],
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {isSelected && (
                                <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: colors.primary, borderRadius: '50%', padding: '2px', color: 'white', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Check size={12} strokeWidth={3} />
                                </div>
                            )}
                            <img src={provider.logo} alt={provider.name} style={{ width: '32px', height: '32px', borderRadius: radius.md, objectFit: 'contain' }} />
                            <span style={{ fontSize: font.size.sm, fontWeight: isSelected ? font.weight.bold : font.weight.medium, color: isSelected ? colors.text.primary : colors.text.secondary, textAlign: 'center' }}>
                                {provider.name}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Next Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: spacing['10'], gap: spacing['2'] }}>
                <button
                    onClick={() => setCurrentStep(2)}
                    disabled={!isFormValid}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        height: '52px',
                        background: isFormValid ? colors.primary : colors.border.default,
                        color: isFormValid ? colors.bg.surface : colors.text.muted,
                        fontSize: font.size.base,
                        fontWeight: font.weight.bold,
                        borderRadius: radius.lg,
                    }}
                >
                    다음
                </button>
            </div>
        </div>
    );

    // ── Step 2: Category & Criteria ──
    const renderStep2 = () => (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <h2 style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text.primary, marginBottom: spacing['6'] }}>
                카테고리와 수집 기준을 선택해주세요
            </h2>

            {providerSettings.map(setting => {
                const providerInfo = SOURCING_PROVIDERS.find(p => p.name === setting.provider);
                return (
                    <div key={setting.provider} style={{ background: colors.bg.surface, border: `1px solid ${colors.border.default}`, borderRadius: radius.xl, padding: spacing['6'], display: 'flex', flexDirection: 'column', gap: spacing['5'] }}>
                        {/* Provider Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'], borderBottom: `1px solid ${colors.bg.subtle}`, paddingBottom: spacing['4'] }}>
                            {providerInfo && <img src={providerInfo.logo} alt={providerInfo.name} style={{ width: '28px', height: '28px', borderRadius: radius.sm, objectFit: 'contain' }} />}
                            <span style={{ fontSize: font.size.base, fontWeight: font.weight.bold, color: colors.text.primary }}>{setting.provider}</span>
                        </div>

                        {/* Category Pill Buttons */}
                        <div style={{ paddingBottom: spacing['5'], borderBottom: `1px solid ${colors.bg.subtle}` }}>
                            <div style={{ fontSize: font.size.sm, color: colors.text.tertiary, marginBottom: spacing['3'], fontWeight: font.weight.medium }}>세부 카테고리</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing['2'] }}>
                                {(MOCK_CATEGORIES[setting.provider] || MOCK_CATEGORIES['default']).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => updateSetting(setting.provider, { category: cat })}
                                        style={{
                                            padding: `10px ${spacing['4']}`,
                                            borderRadius: radius.md,
                                            fontSize: font.size.md,
                                            fontWeight: setting.category === cat ? font.weight.semibold : font.weight.medium,
                                            color: setting.category === cat ? colors.primary : colors.text.secondary,
                                            background: setting.category === cat ? colors.bg.info : colors.bg.subtle,
                                            border: `1.5px solid ${setting.category === cat ? colors.primary : 'transparent'}`,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Criteria Radio */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
                            <div style={{ fontSize: font.size.sm, color: colors.text.tertiary, fontWeight: font.weight.medium }}>수집 대상</div>
                            <div style={{ display: 'flex', gap: spacing['8'] }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        checked={setting.criteria === '인기상품'}
                                        onChange={() => updateSetting(setting.provider, { criteria: '인기상품' })}
                                        style={{ width: '18px', height: '18px', accentColor: colors.primary }}
                                    />
                                    <span style={{ fontSize: font.size.base, fontWeight: font.weight.medium, color: colors.text.primary }}>인기상품 (판매량순)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        checked={setting.criteria === '전체상품'}
                                        onChange={() => updateSetting(setting.provider, { criteria: '전체상품' })}
                                        style={{ width: '18px', height: '18px', accentColor: colors.primary }}
                                    />
                                    <span style={{ fontSize: font.size.base, fontWeight: font.weight.medium, color: colors.text.primary }}>전체상품</span>
                                </label>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: spacing['10'], gap: spacing['2'] }}>
                <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!isStep2Valid}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        height: '52px',
                        background: isStep2Valid ? colors.primary : colors.border.default,
                        color: isStep2Valid ? colors.bg.surface : colors.text.muted,
                        fontSize: font.size.base,
                        fontWeight: font.weight.bold,
                        borderRadius: radius.lg,
                    }}
                >
                    다음
                </button>
                <button
                    onClick={() => setCurrentStep(1)}
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
            </div>
        </div>
    );

    // ── Step 3: Time Selection ──
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
    const timeDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isTimeDropdownOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target as Node)) {
                setIsTimeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isTimeDropdownOpen]);

    const formatTimeDisplay = (time: string) => {
        const hour = parseInt(time.split(':')[0]);
        const ampm = hour < 12 ? '오전' : '오후';
        const displayHour = hour <= 12 ? hour : hour - 12;
        return `${ampm} ${displayHour}시`;
    };

    const renderStep3 = () => (
        <div style={{ animation: 'fadeInUp 0.3s ease' }}>
            <h2 style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: colors.text.primary, marginBottom: spacing['6'] }}>
                매일 수집할 시간을 선택해주세요
            </h2>

            {/* Time Dropdown */}
            <div style={{ background: colors.bg.surface, border: `1px solid ${colors.border.default}`, borderRadius: radius.xl, padding: spacing['6'], marginBottom: spacing['6'] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'], marginBottom: spacing['5'] }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: radius.lg, background: colors.bg.info, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={20} color={colors.primary} />
                    </div>
                    <div>
                        <div style={{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.text.primary }}>수집 시간</div>
                        <div style={{ fontSize: font.size.sm, color: colors.text.tertiary }}>매일 선택한 시간에 자동 실행됩니다</div>
                    </div>
                </div>

                {/* Dropdown Trigger */}
                <div ref={timeDropdownRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                        style={{
                            width: '100%',
                            padding: `${spacing['4']} ${spacing['4']}`,
                            borderRadius: radius.lg,
                            fontSize: font.size.base,
                            fontWeight: font.weight.semibold,
                            color: colors.text.primary,
                            background: colors.bg.subtle,
                            border: `1.5px solid ${isTimeDropdownOpen ? colors.primary : colors.border.default}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <span>매일 {formatTimeDisplay(selectedTime)}</span>
                        <ChevronDown
                            size={18}
                            color={colors.text.tertiary}
                            style={{
                                transition: 'transform 0.2s ease',
                                transform: isTimeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                        />
                    </button>

                    {/* Dropdown List */}
                    {isTimeDropdownOpen && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            background: colors.bg.surface,
                            border: `1px solid ${colors.border.default}`,
                            borderRadius: radius.lg,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                            zIndex: 100,
                            maxHeight: '240px',
                            overflowY: 'auto',
                            animation: 'fadeIn 0.15s ease',
                        }}>
                            {TIME_OPTIONS.map(time => {
                                const isSelected = selectedTime === time;
                                return (
                                    <button
                                        key={time}
                                        onClick={() => { setSelectedTime(time); setIsTimeDropdownOpen(false); }}
                                        style={{
                                            width: '100%',
                                            padding: `${spacing['3']} ${spacing['4']}`,
                                            fontSize: font.size.md,
                                            fontWeight: isSelected ? font.weight.semibold : font.weight.medium,
                                            color: isSelected ? colors.primary : colors.text.primary,
                                            background: isSelected ? colors.bg.info : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = colors.bg.subtle; }}
                                        onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <span>{formatTimeDisplay(time)}</span>
                                        {isSelected && <Check size={16} color={colors.primary} strokeWidth={3} />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: spacing['10'], gap: spacing['3'] }}>
                <button
                    onClick={handleSave}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        height: '52px',
                        fontSize: font.size.base,
                        fontWeight: font.weight.bold,
                        borderRadius: radius.lg,
                    }}
                >
                    설정 저장하기
                </button>
                <button
                    onClick={handleTestRun}
                    style={{
                        width: '100%',
                        height: '52px',
                        background: colors.bg.surface,
                        color: colors.primary,
                        border: `1.5px solid ${colors.primary}`,
                        borderRadius: radius.lg,
                        fontSize: font.size.base,
                        fontWeight: font.weight.bold,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = colors.primaryLight}
                    onMouseOut={(e) => e.currentTarget.style.background = colors.bg.surface}
                >
                    저장 전 테스트해보기
                </button>
                <button
                    onClick={() => setCurrentStep(2)}
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
            </div>
        </div>
    );

    // ── Edit Mode: All-in-one ──
    const renderEditMode = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'], animation: 'fadeInUp 0.3s ease' }}>
            {/* Section 1: Category & Criteria */}
            <div>
                {providerSettings.map(setting => {
                    const providerInfo = SOURCING_PROVIDERS.find(p => p.name === setting.provider);
                    return (
                        <div key={setting.provider} style={{ background: colors.bg.surface, border: `1px solid ${colors.border.default}`, borderRadius: radius.xl, padding: spacing['6'], display: 'flex', flexDirection: 'column', gap: spacing['5'] }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'], borderBottom: `1px solid ${colors.bg.subtle}`, paddingBottom: spacing['4'] }}>
                                {providerInfo && <img src={providerInfo.logo} alt={providerInfo.name} style={{ width: '28px', height: '28px', borderRadius: radius.sm, objectFit: 'contain' }} />}
                                <span style={{ fontSize: font.size.base, fontWeight: font.weight.bold, color: colors.text.primary }}>{setting.provider}</span>
                            </div>
                            <div style={{ paddingBottom: spacing['5'], borderBottom: `1px solid ${colors.bg.subtle}` }}>
                                <div style={{ fontSize: font.size.sm, color: colors.text.tertiary, marginBottom: spacing['3'], fontWeight: font.weight.medium }}>세부 카테고리</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing['2'] }}>
                                    {(MOCK_CATEGORIES[setting.provider] || MOCK_CATEGORIES['default']).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => updateSetting(setting.provider, { category: cat })}
                                            style={{
                                                padding: `10px ${spacing['4']}`,
                                                borderRadius: radius.md,
                                                fontSize: font.size.md,
                                                fontWeight: setting.category === cat ? font.weight.semibold : font.weight.medium,
                                                color: setting.category === cat ? colors.primary : colors.text.secondary,
                                                background: setting.category === cat ? colors.bg.info : colors.bg.subtle,
                                                border: `1.5px solid ${setting.category === cat ? colors.primary : 'transparent'}`,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['3'] }}>
                                <div style={{ fontSize: font.size.sm, color: colors.text.tertiary, fontWeight: font.weight.medium }}>수집 대상</div>
                                <div style={{ display: 'flex', gap: spacing['8'] }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], cursor: 'pointer' }}>
                                        <input type="radio" checked={setting.criteria === '인기상품'} onChange={() => updateSetting(setting.provider, { criteria: '인기상품' })} style={{ width: '18px', height: '18px', accentColor: colors.primary }} />
                                        <span style={{ fontSize: font.size.base, fontWeight: font.weight.medium, color: colors.text.primary }}>인기상품 (판매량순)</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: spacing['2'], cursor: 'pointer' }}>
                                        <input type="radio" checked={setting.criteria === '전체상품'} onChange={() => updateSetting(setting.provider, { criteria: '전체상품' })} style={{ width: '18px', height: '18px', accentColor: colors.primary }} />
                                        <span style={{ fontSize: font.size.base, fontWeight: font.weight.medium, color: colors.text.primary }}>전체상품</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Section 3: Time */}
            <div style={{ opacity: providerSettings.length === 0 ? 0.4 : 1, pointerEvents: providerSettings.length === 0 ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                <div style={{ background: colors.bg.surface, border: `1px solid ${colors.border.default}`, borderRadius: radius.xl, padding: spacing['6'] }}>
                    <div ref={timeDropdownRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                            style={{
                                width: '100%',
                                padding: `${spacing['4']} ${spacing['4']}`,
                                borderRadius: radius.lg,
                                fontSize: font.size.base,
                                fontWeight: font.weight.semibold,
                                color: colors.text.primary,
                                background: colors.bg.subtle,
                                border: `1.5px solid ${isTimeDropdownOpen ? colors.primary : colors.border.default}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: spacing['2'] }}>
                                <Clock size={18} color={colors.primary} />
                                매일 {formatTimeDisplay(selectedTime)}
                            </span>
                            <ChevronDown
                                size={18}
                                color={colors.text.tertiary}
                                style={{ transition: 'transform 0.2s ease', transform: isTimeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                        </button>
                        {isTimeDropdownOpen && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                                background: colors.bg.surface, border: `1px solid ${colors.border.default}`,
                                borderRadius: radius.lg, boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                                zIndex: 100, maxHeight: '240px', overflowY: 'auto', animation: 'fadeIn 0.15s ease',
                            }}>
                                {TIME_OPTIONS.map(time => {
                                    const isSelected = selectedTime === time;
                                    return (
                                        <button
                                            key={time}
                                            onClick={() => { setSelectedTime(time); setIsTimeDropdownOpen(false); }}
                                            style={{
                                                width: '100%', padding: `${spacing['3']} ${spacing['4']}`,
                                                fontSize: font.size.md, fontWeight: isSelected ? font.weight.semibold : font.weight.medium,
                                                color: isSelected ? colors.primary : colors.text.primary,
                                                background: isSelected ? colors.bg.info : 'transparent',
                                                border: 'none', cursor: 'pointer', textAlign: 'left',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = colors.bg.subtle; }}
                                            onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <span>{formatTimeDisplay(time)}</span>
                                            {isSelected && <Check size={16} color={colors.primary} strokeWidth={3} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom: Actions */}
            <div style={{
                borderTop: `1px solid ${colors.border.default}`,
                paddingTop: spacing['6'],
                display: 'flex',
                flexDirection: 'column',
                gap: spacing['3'],
            }}>
                <button
                    onClick={handleSave}
                    className="btn-primary"
                    disabled={!isFormValid}
                    style={{
                        width: '100%', height: '52px',
                        background: isFormValid ? colors.primary : colors.border.default,
                        color: isFormValid ? colors.bg.surface : colors.text.muted,
                        borderRadius: radius.lg,
                        fontSize: font.size.base,
                        fontWeight: font.weight.bold,
                    }}
                >
                    수정 저장하기
                </button>
                <button
                    onClick={handleTestRun}
                    disabled={!isFormValid}
                    style={{
                        width: '100%', height: '52px',
                        background: colors.bg.surface,
                        color: isFormValid ? colors.primary : colors.text.muted,
                        border: `1.5px solid ${isFormValid ? colors.primary : colors.border.default}`,
                        borderRadius: radius.lg,
                        fontSize: font.size.base,
                        fontWeight: font.weight.bold,
                        cursor: isFormValid ? 'pointer' : 'default',
                        transition: 'background 0.2s',
                    }}
                    onMouseOver={(e) => { if (isFormValid) e.currentTarget.style.background = colors.primaryLight; }}
                    onMouseOut={(e) => { if (isFormValid) e.currentTarget.style.background = colors.bg.surface; }}
                >
                    테스트하기
                </button>
            </div>
        </div>
    );

    return (
        <MainLayout>
            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', paddingBottom: '60px', animation: 'fadeInUp 0.4s ease' }}>
                <button
                    onClick={() => navigate('/sourcing')}
                    style={{ background: 'none', border: 'none', color: colors.text.muted, fontSize: font.size.md, fontWeight: font.weight.semibold, display: 'flex', alignItems: 'center', gap: spacing['1'], cursor: 'pointer', marginBottom: spacing['6'], padding: 0 }}
                >
                    ← 뒤로가기
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'], marginBottom: spacing['2'] }}>
                    <h1 style={{ fontSize: font.size['2xl'], fontWeight: font.weight.bold, color: colors.text.primary }}>
                        {isEditMode ? '자동 수집 수정' : '자동 수집 생성'}
                    </h1>
                </div>
                <p style={{ fontSize: font.size.base, color: colors.text.tertiary, marginBottom: spacing['10'] }}>
                    {isEditMode
                        ? '카테고리와 수집 시간을 수정할 수 있어요.'
                        : '원하는 쇼핑몰과 카테고리를 설정하면 매일 자동으로 상품을 수집해요.'}
                </p>

                {/* Step Indicator (only in create mode) */}
                {!isEditMode && renderStepIndicator()}

                {/* Content */}
                {isEditMode ? renderEditMode() : (
                    <>
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && renderStep2()}
                        {currentStep === 3 && renderStep3()}
                    </>
                )}
            </div>

            {/* Test Simulation Modal */}
            {isTestModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 99999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease'
                }}>
                    <div style={{
                        background: colors.bg.surface,
                        borderRadius: radius.full,
                        width: '90%',
                        maxWidth: testStep === 3 ? '800px' : '480px',
                        padding: spacing['8'],
                        boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
                        transition: 'max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        position: 'relative'
                    }}>
                        {testStep === 3 && (
                            <button
                                onClick={() => setIsTestModalOpen(false)}
                                style={{
                                    position: 'absolute', top: spacing['6'], right: spacing['6'],
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: colors.text.muted
                                }}
                            >
                                <X size={24} />
                            </button>
                        )}

                        {testStep < 3 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                <Loader2 size={48} color={colors.primary} style={{ marginBottom: spacing['6'], animation: 'spin 2s linear infinite' }} />
                                <div style={{ minHeight: '32px', display: 'flex', alignItems: 'center', marginBottom: spacing['2'] }}>
                                    <h3
                                        key={getProgressText(testProgress)}
                                        style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary, animation: 'fadeIn 0.3s ease', whiteSpace: 'nowrap' }}
                                    >
                                        {getProgressText(testProgress)}
                                    </h3>
                                </div>
                                <p style={{ fontSize: font.size.base, color: colors.text.tertiary, marginBottom: spacing['8'] }}>
                                    {providerSettings[0]?.provider}의 {providerSettings[0]?.category} 상품을 실시간으로 분석합니다.
                                </p>

                                <div style={{ width: '100%', marginBottom: spacing['2'], display: 'flex', justifyContent: 'space-between', fontSize: font.size.md, fontWeight: font.weight.semibold }}>
                                    <span style={{ color: colors.primary }}>진행률</span>
                                    <span style={{ color: colors.text.primary }}>{testProgress}%</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: colors.bg.subtle, borderRadius: radius.xs, overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${testProgress}%`,
                                        height: '100%',
                                        background: colors.primary,
                                        transition: 'width 0.15s linear'
                                    }} />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: spacing['3'], marginBottom: spacing['2'] }}>
                                    <CheckCircle2 size={28} color={colors.primary} />
                                    <h3 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, color: colors.text.primary }}>수집 테스트가 성공적으로 완료되었습니다.</h3>
                                </div>
                                <p style={{ fontSize: font.size.base, color: colors.text.secondary, marginBottom: spacing['6'] }}>
                                    매일 {selectedTime}에 아래와 같이 등록하신 기준의 상품을 수집합니다.
                                </p>

                                <div style={{ border: `1px solid ${colors.border.default}`, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing['8'] }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: font.size.md, tableLayout: 'fixed' }}>
                                        <thead>
                                            <tr style={{ background: colors.bg.page, borderBottom: `1px solid ${colors.border.default}`, color: colors.text.muted }}>
                                                <th style={{ padding: `${spacing['4']} ${spacing['3']}`, fontWeight: font.weight.semibold, width: '70px', whiteSpace: 'nowrap', textAlign: 'center' }}>이미지</th>
                                                <th style={{ padding: `${spacing['4']} ${spacing['3']}`, fontWeight: font.weight.semibold, whiteSpace: 'nowrap' }}>상품명</th>
                                                <th style={{ padding: `${spacing['4']} ${spacing['3']}`, fontWeight: font.weight.semibold, width: '100px', textAlign: 'left', whiteSpace: 'nowrap' }}>원가</th>
                                            </tr>
                                        </thead>
                                    </table>
                                    <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: font.size.md, tableLayout: 'fixed' }}>
                                            <tbody>
                                                {Array.from({ length: 25 }, (_, i) => {
                                                    // eslint-disable-next-line react-hooks/purity
                                                    const price = Math.floor(Math.random() * 5 + 1) * 10000 + Math.floor(Math.random() * 9) * 1000;
                                                    const realisticTitle = generateRealisticTitle(providerSettings[0]?.provider || '', providerSettings[0]?.category || '', i);
                                                    return (
                                                        <tr key={i} style={{ borderBottom: i !== 24 ? `1px solid ${colors.bg.subtle}` : 'none' }}>
                                                            <td style={{ padding: spacing['3'], width: '70px', textAlign: 'center' }}>
                                                                <div style={{ width: '40px', height: '40px', borderRadius: radius.md, background: colors.bg.subtle, border: `1px solid ${colors.border.default}`, margin: '0 auto' }} />
                                                            </td>
                                                            <td style={{ padding: spacing['3'], color: colors.text.primary, fontWeight: font.weight.medium, lineHeight: '1.4' }}>
                                                                {realisticTitle}
                                                            </td>
                                                            <td style={{ padding: spacing['3'], color: colors.text.secondary, fontWeight: font.weight.medium, width: '100px', textAlign: 'left' }}>
                                                                ₩{price.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <button onClick={() => setIsTestModalOpen(false)} className="btn-primary" style={{ width: '100%' }}>
                                    확인
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
