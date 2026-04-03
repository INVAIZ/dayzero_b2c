/** 날짜 포맷 유틸 — registration 관련 컴포넌트 공용 */

/** yy.mm.dd hh:mm */
export function formatCompactDate(iso: string): string {
    const d = new Date(iso);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yy}.${mm}.${dd} ${hh}:${min}`;
}

/** 오늘/어제/yy.mm.dd hh:mm (상대적 표시) */
export function formatRelativeDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');

    if (d.toDateString() === now.toDateString()) {
        return `오늘 ${hh}:${min}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
        return `어제 ${hh}:${min}`;
    }

    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}.${mm}.${dd} ${hh}:${min}`;
}

/** 오늘/내일/m/d hh:mm (모니터링 확인 시간용) */
export function formatCheckTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    if (d.toDateString() === now.toDateString()) return `오늘 ${hh}:${mm}`;

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) return `내일 ${hh}:${mm}`;

    return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

/** m/d (간략 날짜) */
export function formatShortDate(iso: string): string {
    const d = new Date(iso);
    const yy = String(d.getFullYear()).slice(2);
    return `${yy}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** yyyy년 m월 d일 */
export function formatTooltipDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** yyyy.mm.dd hh:mm (전체 날짜) */
export function formatFullDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 경과 시간 (n초 / n분 n초) */
export function formatElapsed(ms: number): string {
    const sec = Math.round(ms / 1000);
    if (sec < 60) return `${sec}초`;
    const min = Math.floor(sec / 60);
    return `${min}분 ${sec % 60}초`;
}
