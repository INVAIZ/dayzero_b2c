import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSourcingStore } from '../store/useSourcingStore';
import { MainLayout } from '../components/layout/MainLayout';
import { SOURCING_PROVIDERS } from '../types/sourcing';
import { Link2, Zap, Clock } from 'lucide-react';
import { UrlSourcingContent } from './sourcing/components/UrlSourcingContent';

const getProviderLogo = (providerName: string) => {
    return SOURCING_PROVIDERS.find(p => p.name === providerName)?.logo || '/logos/default.png';
};

export default function SourcingPage() {
    const navigate = useNavigate();
    const { schedules, toggleSchedule } = useSourcingStore();
    const [activeTab, setActiveTab] = useState<'auto' | 'url'>('auto');

    // Segmented Tab Navigation
    const renderTabs = () => (
        <div style={{
            display: 'inline-flex',
            background: '#F2F4F6',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '40px'
        }}>
            <button
                onClick={() => setActiveTab('auto')}
                style={{
                    padding: '10px 24px',
                    fontSize: '15px',
                    fontWeight: activeTab === 'auto' ? 700 : 500,
                    color: activeTab === 'auto' ? '#191F28' : '#8B95A1',
                    background: activeTab === 'auto' ? '#FFFFFF' : 'transparent',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: activeTab === 'auto' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
            >
                <Zap size={16} fill={activeTab === 'auto' ? '#191F28' : 'none'} color={activeTab === 'auto' ? '#191F28' : '#8B95A1'} />
                자동 수집
            </button>
            <button
                onClick={() => setActiveTab('url')}
                style={{
                    padding: '10px 24px',
                    fontSize: '15px',
                    fontWeight: activeTab === 'url' ? 700 : 500,
                    color: activeTab === 'url' ? '#191F28' : '#8B95A1',
                    background: activeTab === 'url' ? '#FFFFFF' : 'transparent',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: activeTab === 'url' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
            >
                <Link2 size={16} />
                URL 수집
            </button>
        </div>
    );



    const renderSchedules = () => {
        return (
            <div style={{ marginBottom: '48px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#191F28' }}>설정된 자동 수집</h2>
                    <button onClick={() => navigate('/sourcing/auto')} style={{
                        background: 'none',
                        color: '#3182F6',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        + 자동 수집 추가
                    </button>
                </div>
                <p style={{ fontSize: '14px', color: '#6B7684', marginBottom: '24px' }}>
                    등록한 스케줄에 맞춰 설정한 조건대로 상품을 주기적으로 알아서 수집해요.
                </p>

                {schedules.length === 0 ? (
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1px dashed #D1D6DB',
                        padding: '40px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '15px', color: '#6B7684', marginBottom: '16px' }}>등록된 자동 수집이 없어요.</div>
                        <button onClick={() => navigate('/sourcing/auto')} className="btn-google" style={{ maxWidth: '200px', margin: '0 auto', height: '40px' }}>
                            자동 수집 추가
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {schedules.map(schedule => (
                            <div key={schedule.id} style={{
                                background: '#FFFFFF',
                                borderRadius: '16px',
                                padding: '20px',
                                border: '1px solid #E5E8EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <img src={getProviderLogo(schedule.provider)} alt={schedule.provider} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid #E5E8EB' }} />
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#191F28', marginBottom: '4px' }}>
                                            {schedule.provider} {schedule.categoryPath} • {schedule.targetCount}건
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#6B7684', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={12} /> 매일 {schedule.timeString} • {schedule.criteria}
                                        </div>
                                    </div>
                                </div>

                                {/* Toggle Switch */}
                                <button
                                    onClick={() => toggleSchedule(schedule.id)}
                                    style={{
                                        width: '44px',
                                        height: '24px',
                                        borderRadius: '12px',
                                        background: schedule.isActive ? '#3182F6' : '#E5E8EB',
                                        border: 'none',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        padding: 0
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: '#FFFFFF',
                                        position: 'absolute',
                                        top: '2px',
                                        left: schedule.isActive ? '22px' : '2px',
                                        transition: 'left 0.2s',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <MainLayout>
            <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', paddingBottom: '100px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#191F28', marginBottom: '8px' }}>
                    상품 소싱
                </h1>
                <p style={{ fontSize: '15px', color: '#6B7684', marginBottom: '32px' }}>
                    소싱 방식을 선택하고 인기 상품을 빠르게 수집해보세요.
                </p>

                {renderTabs()}

                {activeTab === 'auto' ? (
                    <div style={{ animation: 'fadeIn 0.2s ease' }}>
                        {renderSchedules()}
                    </div>
                ) : (
                    <div style={{ animation: 'fadeIn 0.2s ease' }}>
                        <UrlSourcingContent />
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
