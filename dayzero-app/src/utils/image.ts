import type { SyntheticEvent } from 'react';
import { colors } from '../design/tokens';

const BLANK_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/** 이미지 로드 실패 시 회색 배경으로 대체 */
export function handleImgError(e: SyntheticEvent<HTMLImageElement>): void {
    const t = e.currentTarget;
    t.style.background = colors.bg.subtle;
    t.src = BLANK_GIF;
}
