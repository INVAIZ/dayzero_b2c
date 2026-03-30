/**
 * 카테고리 유틸리티 (호환 래퍼)
 *
 * 실제 카테고리 데이터는 qoo10Categories.ts에 있음.
 * 기존 코드에서 사용하는 함수명을 유지하되,
 * 이제 경로가 한국어이므로 변환 없이 그대로 반환한다.
 */

export { EXCHANGE_RATE } from './qoo10Categories';

/** 카테고리 경로를 한국어로 반환 (이미 한국어이므로 그대로) */
export const toKoCategory = (path: string): string => path;

/** 카테고리 경로를 그대로 반환 (일본어 변환 불필요) */
export const toJaCategory = (path: string): string => path;

/** 긴 카테고리 경로 축약 */
export const shortKoCategory = (path: string): string => {
    const parts = path.split('>').map(p => p.trim());
    if (parts.length <= 3) return path;
    return `${parts[0]} > ... > ${parts[parts.length - 1]}`;
};
