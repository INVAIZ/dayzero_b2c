import type { ProductDetail } from '../types/editing';

/** 상품명 앞의 [소싱처] 프리픽스를 제거한다 */
export const stripPrefix = (title: string) => title.replace(/^\[[^\]]+\]\s*/, '');

/** URL 수집 상품 제목 번역 매핑 (소싱 시 수집되는 타이틀 기준)
 *  Qoo10 가이드라인 자동 적용: 브랜드 등록 상품은 브랜드명 제거, 특수문자·홍보문구 제거 */
export const KO_TO_JA_TITLE: Record<string, string> = {
    // 뷰티 — 브랜드 등록(matched) → 브랜드명·홍보문구·특수문자 제거
    '[단독기획] 닥터지 레드 블레미쉬 클리어 수딩 크림 70ml+30ml 세트': 'レッドブレミッシュ クリア スージングクリーム 70ml+30ml セット',
    '일리윤 세라마이드 아토 집중 크림 200ml 탑퍼 기획': 'セラミドアト 集中クリーム 200ml',
    '[NEW/2026년까지] 라네즈 네오 쿠션 매트 15g 본품+리필': 'ネオクッション マット 15g 本品+リフィル',
    '코스알엑스 패드 3종 비교 기획세트 (오리지널/모이스쳐/포어리스)': 'パッド 3種 比較セット (オリジナル/モイスチャー/ポアレス)',
    '클리오 킬커버 더뉴 파운웨어 쿠션 (본품+리필+퍼프2매)': 'キルカバー ザニュー ファウンウェアクッション (本品+リフィル+パフ2枚)',
    // K-pop — 아티스트명은 브랜드가 아니므로 유지, 특수문자·홍보문구만 제거
    '[예약판매] 뉴진스 (NewJeans) - 2nd EP [Get Up] (Bunny Beach Bag ver.)': 'NewJeans - 2nd EP [Get Up] (Bunny Beach Bag ver.)',
    '세븐틴 (SEVENTEEN) - 10th Mini Album [FML] (일반반)': 'SEVENTEEN - 10th ミニアルバム [FML] (通常版)',
    '르세라핌 (LE SSERAFIM) - 1st Studio Album [UNFORGIVEN] (Weverse Albums ver.)': 'LE SSERAFIM - 1st スタジオアルバム [UNFORGIVEN] (Weverse Albums ver.)',
    '스트레이 키즈 (Stray Kids) - 5-STAR (Limited Edition)': 'Stray Kids - 5-STAR (Limited Edition)',
    '에스파 (aespa) - 3rd Mini Album [MY WORLD] (Poster ver.)': 'aespa - 3rd ミニアルバム [MY WORLD] (ポスター版)',
    '르세라핌 (LE SSERAFIM) - 3rd Mini Album [EASY] (Weverse Albums ver.)': 'LE SSERAFIM - 3rd ミニアルバム [EASY] (Weverse Albums ver.)',
};

/** 소싱처 프리픽스 한→영 변환 맵 */
export const PROVIDER_PREFIX_MAP: Record<string, string> = {
    '[올리브영]': '[Olive Young]',
    '[쿠팡]': '[Coupang]',
    '[다이소]': '[Daiso]',
    '[위버스샵]': '[Weverse Shop]',
    '[Ktown4u]': '[Ktown4u]',
    '[메이크스타]': '[Makestar]',
    '[위치폼]': '[Wicefom]',
    '[FANS]': '[FANS]',
    '[yes24]': '[yes24]',
    '[알라딘]': '[aladin]',
};

/** 한국어 상품명 → 일본어 상품명 변환 (더미) */
export const toJaTitle = (titleKo: string): string => {
    if (KO_TO_JA_TITLE[titleKo]) return KO_TO_JA_TITLE[titleKo];
    let result = titleKo;
    for (const [ko, en] of Object.entries(PROVIDER_PREFIX_MAP)) {
        if (result.includes(ko)) {
            result = result.replace(ko, en);
            break;
        }
    }
    return result;
};

/** 옵션명 한→일 번역 사전 */
export const OPTION_KO_JA: Record<string, string> = {
    '기본': '標準', '기본색': '基本色', '일반': '通常',
    '소': '小', '중': '中', '대': '大',
    'S': 'S', 'M': 'M', 'L': 'L', 'XL': 'XL', 'XXL': 'XXL',
    '화이트': 'ホワイト', '블랙': 'ブラック', '핑크': 'ピンク',
    '블루': 'ブルー', '그린': 'グリーン', '레드': 'レッド',
    '베이지': 'ベージュ', '아이보리': 'アイボリー',
    '네이비': 'ネイビー', '그레이': 'グレー',
    '옐로우': 'イエロー', '퍼플': 'パープル',
    '민트': 'ミント', '라벤더': 'ラベンダー',
    '1개': '1個', '2개': '2個', '3개': '3個', '5개': '5個',
    '1세트': '1セット', '2세트': '2セット',
    '본품': '本品', '본품+리필': '本品+リフィル',
    '21호 라이트': '#21 ライト', '23호 미디엄': '#23 ミディアム', '25호 딥': '#25 ディープ',
    '50ml': '50ml', '100ml': '100ml',
    '옵션1': 'オプション1', '옵션2': 'オプション2', '옵션3': 'オプション3',
    'ver. A': 'ver. A', 'ver. B': 'ver. B', 'ver. C': 'ver. C',
};

/** 옵션명 더미 번역 */
export const mockTranslateOption = (nameKo: string): string => OPTION_KO_JA[nameKo.trim()] ?? nameKo;

/** 더미 일본어 상세설명 */
export const MOCK_DESC_JA = `【商品説明】\n韓国から直接仕入れた正規品です。高品質な素材を使用し、使いやすさを追求した商品です。\n\n【使用方法】\nご使用前に必ず使用説明書をお読みください。適量を手に取り、優しくなじませてください。\n\n【注意事項】\n・開封後の返品・交換はお受けできません。\n・商品の色は、モニターの設定により実際と異なる場合があります。\n・お肌に合わない場合はご使用をおやめください。`;

/** 상품의 편집(번역)이 모두 완료되었는지 확인 */
export const isFullyTranslated = (p: ProductDetail): boolean =>
    !!p.titleJa && !hasKorean(p.titleJa) &&
    !!p.descriptionJa && !hasKorean(p.descriptionJa) &&
    (p.options.length === 0 || p.options.every(o => !!o.nameJa || !hasKorean(o.nameKo)));

export const hasKorean = (s: string): boolean => /[\uAC00-\uD7AF]/.test(s);

