/**
 * 공통 CSS 키프레임 애니메이션 정의
 *
 * 사용법:
 *   import { ANIM } from '@/design/animations';
 *   <style>{ANIM.fadeInUp}</style>
 *
 * 또는 여러 개를 한번에:
 *   <style>{ANIM.fadeIn + ANIM.slideUp}</style>
 */

export const ANIM = {
    /** 아래→위로 페이드인 (8px) — 리스트, 카드, 콜아웃 */
    fadeInUp: `@keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }\n`,

    /** 단순 페이드인 — 오버레이, 배경 */
    fadeIn: `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }\n`,

    /** 아래→위로 슬라이드업 (20px) — 모달 콘텐츠 */
    slideUp: `@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }\n`,

    /** 툴팁 페이드인 (4px) */
    tooltipFadeIn: `@keyframes tooltipFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }\n`,

    /** 모달 오버레이 페이드인 */
    overlayIn: `@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }\n`,

    /** 모달 슬라이드업 + 스케일 */
    modalSlideUp: `@keyframes modalSlideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }\n`,

    /** 페이지 진입 (12px) */
    pageIn: `@keyframes pageIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }\n`,

    /** 스피너 회전 */
    spin: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\n`,

    /** 리스트 행 슬라이드인 */
    rowSlideIn: `@keyframes rowSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }\n`,

    /** 리스트 페이드인 */
    listFadeIn: `@keyframes listFadeIn { from { opacity: 0; } to { opacity: 1; } }\n`,

    /** 콜아웃 진입 (위→아래) */
    calloutIn: `@keyframes calloutIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }\n`,

    /** 요약 카드 페이드인 */
    summaryFadeIn: `@keyframes summaryFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }\n`,

    /** 툴팁 팝 (스케일) */
    tooltipPop: `@keyframes tooltipPop { from { opacity: 0; transform: translate(-50%, -100%) scale(0.95); } to { opacity: 1; transform: translate(-50%, -100%) scale(1); } }\n`,

    /** 한국어 원문 표시 */
    koIn: `@keyframes koIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }\n`,

    /** 저장 완료 표시 */
    savedIn: `@keyframes savedIn { from { opacity: 0; } to { opacity: 1; } }\n`,
} as const;
