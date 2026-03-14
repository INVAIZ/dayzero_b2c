import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { SOURCING_PROVIDERS } from '../../types/sourcing';
import type { SourcingProvider } from '../../types/sourcing';
import { useSourcingStore } from '../../store/useSourcingStore';
import { Check, CheckCircle2, Loader2, X } from 'lucide-react';
import { colors } from '../../design/tokens';

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

interface ProviderSetting {
    provider: SourcingProvider;
    criteria: '인기상품' | '전체상품';
    category: string;
}

export default function AutoSourcingPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const { schedules, addSchedule, updateSchedule, addNotification, setSelectedAutoFilter } = useSourcingStore();

    const [providerSettings, setProviderSettings] = useState<ProviderSetting[]>([
        { provider: '올리브영', criteria: '인기상품', category: '뷰티 - 스킨케어' }
    ]);
    const [showStartToast, setShowStartToast] = useState(false);

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
            }
        }
    }, [editId, schedules]);
    const submitButtonRef = useRef<HTMLButtonElement>(null);

    const toggleProvider = (provider: SourcingProvider) => {
        setProviderSettings([{
            provider,
            criteria: '인기상품',
            category: (MOCK_CATEGORIES[provider] || MOCK_CATEGORIES['default'])[0]
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

    const handleStart = () => {
        if (providerSettings.length === 0) return;

        setShowStartToast(true);
        setTimeout(() => setShowStartToast(false), 2500);

        if (editId && providerSettings.length === 1) {
            updateSchedule(editId, {
                provider: providerSettings[0].provider,
                categoryPath: providerSettings[0].category,
                criteria: providerSettings[0].criteria,
            });
        } else {
            providerSettings.forEach((setting) => {
                addSchedule({
                    id: `sched-${Date.now()}-${Math.random()}`,
                    provider: setting.provider,
                    categoryPath: setting.category,
                    criteria: setting.criteria as '인기상품' | '전체상품',
                    targetCount: 50,
                    timeString: '07:00',
                    isActive: true,
                });

                addNotification({
                    id: `notif-${Date.now()}-${Math.random()}`,
                    type: 'auto',
                    title: `${setting.provider} ${setting.category} 자동 수집이 등록되었어요`,
                    status: 'scheduled',
                    currentCount: 0,
                    totalCount: 50,
                    timeString: '07:00',
                    createdAt: new Date().toISOString(),
                });
            });

            if (providerSettings.length === 1) {
                setSelectedAutoFilter(providerSettings[0].provider);
            }

            setTimeout(() => navigate('/sourcing'), 600);
        }
    };

    const isFormValid = providerSettings.length > 0;

    return (
        <MainLayout>
            <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', paddingBottom: '60px', animation: 'fadeInUp 0.4s ease' }}>
                <button
                    onClick={() => navigate('/sourcing')}
                    style={{ background: 'none', border: 'none', color: colors.text.muted, fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}
                >
                    ← 뒤로가기
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, color: colors.text.primary }}>
                        자동 수집 설정
                    </h1>
                </div>
                <p style={{ fontSize: '15px', color: colors.text.tertiary, marginBottom: '40px' }}>
                    매일 오전 07시에 설정한 카테고리의 상품을 자동으로 찾아드려요.
                </p>

                {/* 1. Provider Selection */}
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: colors.text.primary, marginBottom: '16px' }}>
                        1. 쇼핑몰 선택 <span style={{ color: colors.primary }}>*</span>
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                        {SOURCING_PROVIDERS.map((provider) => {
                            const isSelected = providerSettings.some(p => p.provider === provider.name);
                            return (
                                <div
                                    key={provider.name}
                                    onClick={() => toggleProvider(provider.name)}
                                    style={{
                                        background: isSelected ? colors.bg.info : colors.bg.surface,
                                        border: `1.5px solid ${isSelected ? colors.primary : colors.border.default}`,
                                        borderRadius: '12px',
                                        padding: '16px 12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px',
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
                                    <img src={provider.logo} alt={provider.name} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain' }} />
                                    <span style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500, color: isSelected ? colors.text.primary : colors.text.secondary, textAlign: 'center' }}>
                                        {provider.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Category Settings per Selected Provider */}
                <div style={{ marginBottom: '40px', opacity: providerSettings.length === 0 ? 0.4 : 1, pointerEvents: providerSettings.length === 0 ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: colors.text.primary, marginBottom: '16px' }}>
                        2. 쇼핑몰별 수집 기준 설정
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {providerSettings.length === 0 ? (
                            <div style={{ background: colors.bg.page, border: `1px solid ${colors.border.default}`, borderRadius: '16px', padding: '32px', textAlign: 'center', color: colors.text.muted, fontSize: '14px' }}>
                                위에서 쇼핑몰을 하나 이상 선택해주세요.
                            </div>
                        ) : (
                            providerSettings.map(setting => {
                                const providerInfo = SOURCING_PROVIDERS.find(p => p.name === setting.provider);
                                return (
                                    <div key={setting.provider} style={{ background: colors.bg.surface, border: `1px solid ${colors.border.default}`, borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                        {/* Provider Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `1px solid ${colors.bg.subtle}`, paddingBottom: '16px' }}>
                                            {providerInfo && <img src={providerInfo.logo} alt={providerInfo.name} style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} />}
                                            <span style={{ fontSize: '16px', fontWeight: 700, color: colors.text.primary }}>{setting.provider}</span>
                                        </div>

                                        {/* Category Pill Buttons */}
                                        <div style={{ paddingBottom: '20px', borderBottom: `1px solid ${colors.bg.subtle}` }}>
                                            <div style={{ fontSize: '13px', color: colors.text.tertiary, marginBottom: '12px', fontWeight: 500 }}>1. 세부 카테고리 선택</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {(MOCK_CATEGORIES[setting.provider] || MOCK_CATEGORIES['default']).map(cat => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => updateSetting(setting.provider, { category: cat })}
                                                        style={{
                                                            padding: '10px 16px',
                                                            borderRadius: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: setting.category === cat ? 600 : 500,
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
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ fontSize: '13px', color: colors.text.tertiary, fontWeight: 500 }}>2. 수집 대상 선택</div>
                                            <div style={{ display: 'flex', gap: '32px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        checked={setting.criteria === '인기상품'}
                                                        onChange={() => updateSetting(setting.provider, { criteria: '인기상품' })}
                                                        style={{ width: '18px', height: '18px', accentColor: colors.primary }}
                                                    />
                                                    <span style={{ fontSize: '15px', fontWeight: 500, color: colors.text.primary }}>인기상품 (판매량순)</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        checked={setting.criteria === '전체상품'}
                                                        onChange={() => updateSetting(setting.provider, { criteria: '전체상품' })}
                                                        style={{ width: '18px', height: '18px', accentColor: colors.primary }}
                                                    />
                                                    <span style={{ fontSize: '15px', fontWeight: 500, color: colors.text.primary }}>전체상품</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Summary Bottom Area */}
                <div style={{
                    background: colors.bg.surface,
                    borderTop: `1px solid ${colors.border.default}`,
                    padding: '24px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '20px'
                }}>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text.primary, marginBottom: '4px' }}>
                            {providerSettings.length === 1
                                ? `${providerSettings[0].provider}에서 '${providerSettings[0].category}' 카테고리를 수집해요.`
                                : `총 ${providerSettings.length}개 카테고리 설정 대기 중`}
                        </div>
                        <div style={{ fontSize: '13px', color: colors.text.tertiary }}>
                            설정을 완료하면 매일 오전 07:00 에 자동 수집이 실행됩니다.
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={handleTestRun}
                            disabled={!isFormValid}
                            className="btn-google"
                            style={{ width: '120px', color: isFormValid ? colors.primary : colors.text.muted, borderColor: isFormValid ? colors.primary : colors.border.default }}
                        >
                            테스트하기
                        </button>
                        <button
                            ref={submitButtonRef}
                            onClick={handleStart}
                            className="btn-primary"
                            disabled={!isFormValid}
                            style={{ width: '160px', background: isFormValid ? colors.primary : colors.border.default, color: isFormValid ? colors.bg.surface : colors.text.muted }}
                        >
                            {editId ? '수정 저장하기' : '설정 저장하기'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 시작 토스트 */}
            {showStartToast && (
                <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(25, 31, 40, 0.9)',
                    color: colors.bg.surface,
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    zIndex: 9999,
                    animation: 'fadeInUp 0.25s ease',
                    fontFamily: 'Pretendard, sans-serif',
                    whiteSpace: 'nowrap',
                }}>
                    자동 수집 설정이 등록됐어요
                </div>
            )}

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
                        borderRadius: '24px',
                        width: '90%',
                        maxWidth: testStep === 3 ? '800px' : '480px',
                        padding: '32px',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
                        transition: 'max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        position: 'relative'
                    }}>
                        {testStep === 3 && (
                            <button
                                onClick={() => setIsTestModalOpen(false)}
                                style={{
                                    position: 'absolute', top: '24px', right: '24px',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: colors.text.muted
                                }}
                            >
                                <X size={24} />
                            </button>
                        )}

                        {testStep < 3 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                <Loader2 size={48} color={colors.primary} style={{ marginBottom: '24px', animation: 'spin 2s linear infinite' }} />
                                <div style={{ minHeight: '32px', display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                    <h3
                                        key={getProgressText(testProgress)}
                                        style={{ fontSize: '20px', fontWeight: 700, color: colors.text.primary, animation: 'fadeIn 0.3s ease', whiteSpace: 'nowrap' }}
                                    >
                                        {getProgressText(testProgress)}
                                    </h3>
                                </div>
                                <p style={{ fontSize: '15px', color: colors.text.tertiary, marginBottom: '32px' }}>
                                    {providerSettings[0]?.provider}의 {providerSettings[0]?.category} 상품을 실시간으로 분석합니다.
                                </p>

                                <div style={{ width: '100%', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600 }}>
                                    <span style={{ color: colors.primary }}>진행률</span>
                                    <span style={{ color: colors.text.primary }}>{testProgress}%</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: colors.bg.subtle, borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${testProgress}%`,
                                        height: '100%',
                                        background: colors.primary,
                                        transition: 'width 0.15s linear'
                                    }} />
                                </div>
                                <style>{`
                                @keyframes spin { 100% { transform: rotate(360deg); } }
                                `}</style>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <CheckCircle2 size={28} color={colors.primary} />
                                    <h3 style={{ fontSize: '22px', fontWeight: 700, color: colors.text.primary }}>수집 테스트가 성공적으로 완료되었습니다.</h3>
                                </div>
                                <p style={{ fontSize: '15px', color: colors.text.secondary, marginBottom: '24px' }}>
                                    매일 오전 07시에 아래와 같이 등록하신 기준의 상품을 수집합니다.
                                </p>

                                <div style={{ border: `1px solid ${colors.border.default}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', tableLayout: 'fixed' }}>
                                        <thead>
                                            <tr style={{ background: colors.bg.page, borderBottom: `1px solid ${colors.border.default}`, color: colors.text.muted }}>
                                                <th style={{ padding: '16px 12px', fontWeight: 600, width: '70px', whiteSpace: 'nowrap', textAlign: 'center' }}>이미지</th>
                                                <th style={{ padding: '16px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>상품명</th>
                                                <th style={{ padding: '16px 12px', fontWeight: 600, width: '100px', textAlign: 'right', whiteSpace: 'nowrap' }}>원가</th>
                                            </tr>
                                        </thead>
                                    </table>
                                    <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', tableLayout: 'fixed' }}>
                                            <tbody>
                                                {Array.from({ length: 25 }, (_, i) => {
                                                    // eslint-disable-next-line react-hooks/purity
                                                    const price = Math.floor(Math.random() * 5 + 1) * 10000 + Math.floor(Math.random() * 9) * 1000;
                                                    const realisticTitle = generateRealisticTitle(providerSettings[0]?.provider || '', providerSettings[0]?.category || '', i);
                                                    return (
                                                        <tr key={i} style={{ borderBottom: i !== 24 ? `1px solid ${colors.bg.subtle}` : 'none' }}>
                                                            <td style={{ padding: '12px', width: '70px', textAlign: 'center' }}>
                                                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: colors.bg.subtle, border: `1px solid ${colors.border.default}`, margin: '0 auto' }} />
                                                            </td>
                                                            <td style={{ padding: '12px', color: colors.text.primary, fontWeight: 500, lineHeight: '1.4' }}>
                                                                {realisticTitle}
                                                            </td>
                                                            <td style={{ padding: '12px', color: colors.text.secondary, fontWeight: 500, width: '100px', textAlign: 'right' }}>
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
