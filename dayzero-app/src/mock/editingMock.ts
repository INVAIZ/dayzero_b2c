import type { ProductDetail } from '../types/editing';
import { DETAIL_KO_SVGS } from './detailImageSvgs';


const PENDING_DESC = '피부 타입에 맞는 순한 성분으로 만들어진 스킨케어 제품입니다. 자극 없이 촉촉하게 피부를 가꿔줍니다.';

const prodNum = (productId: string) => parseInt(productId.replace('prod-', ''), 10) || 1;

const makeThumbnails = (count: number, productId: string) =>
    Array.from({ length: count }, (_, i) => ({
        id: `thumb-${productId}-${i}`,
        url: `https://placehold.co/600x600/F2F4F6/8B95A1?text=IMG${i + 1}`,
        translatedUrl: null,
        translationStatus: 'none' as const,
        backgroundRemoved: false,
    }));

const makeDetailImages = (count: number, productId: string) =>
    Array.from({ length: count }, (_, i) => ({
        id: `detail-${productId}-${i}`,
        url: DETAIL_KO_SVGS[i % DETAIL_KO_SVGS.length],
        translatedUrl: null,
        translationStatus: 'none' as const,
        backgroundRemoved: false,
    }));


const makeOptions = (productId: string) => {
    const n = prodNum(productId);
    if (n % 3 === 0) return [
        { id: `opt-${productId}-0`, nameKo: '소', nameJa: null, stock: 50 },
        { id: `opt-${productId}-1`, nameKo: '중', nameJa: null, stock: 80 },
        { id: `opt-${productId}-2`, nameKo: '대', nameJa: null, stock: 30 },
    ];
    if (n % 2 === 0) return [
        { id: `opt-${productId}-0`, nameKo: '화이트', nameJa: null, stock: 100 },
        { id: `opt-${productId}-1`, nameKo: '블랙', nameJa: null, stock: 60 },
    ];
    return [{ id: `opt-${productId}-0`, nameKo: '기본', nameJa: null, stock: 999 }];
};

const pendingProductsData = [
    // 기존 번역 완료 상품 1~13 (초기 상태로 변경)
    { id: 'prod-1', title: '[올리브영] 토리든 다이브인 세럼 50ml', krw: 18000, provider: '올리브영', cat: 'ビューティー > スキンケア > 美容液', catId: 'qoo10-beauty-skincare' },
    { id: 'prod-2', title: '[올리브영] 라운드랩 1025 독도 토너 200ml', krw: 14000, provider: '올리브영', cat: 'ビューティー > スキンケア > 化粧水', catId: 'qoo10-beauty-toner' },
    { id: 'prod-3', title: '[올리브영] 아누아 어성초 토너패드 70매', krw: 22000, provider: '올리브영', cat: 'ビューティー > スキンケア > フェイスパック・シートマスク', catId: 'qoo10-beauty-pad' },
    { id: 'prod-4', title: '[올리브영] 메디힐 티트리 케어 솔루션 마스크 10매', krw: 12000, provider: '올리브영', cat: 'ビューティー > スキンケア > フェイスパック・シートマスク', catId: 'qoo10-beauty-mask' },
    { id: 'prod-5', title: '[올리브영] 바이오힐보 프로바이오덤 밸런싱 토너 200ml', krw: 28000, provider: '올리브영', cat: 'ビューティー > スキンケア > 化粧水', catId: 'qoo10-beauty-toner' },
    { id: 'prod-6', title: '[쿠팡] 락앤락 클리어비 밀폐용기 8p 세트', krw: 15800, provider: '쿠팡', cat: 'キッチン・台所 > 保存容器', catId: 'qoo10-kitchen-storage' },
    { id: 'prod-7', title: '[쿠팡] 3M 스카치 다목적 테이프 12mm×30m 10개입', krw: 7200, provider: '쿠팡', cat: 'オフィス・文具 > テープ・接着', catId: 'qoo10-office-tape' },
    { id: 'prod-8', title: '[쿠팡] 퍼실 파워젤 세탁세제 3L', krw: 11000, provider: '쿠팡', cat: '日用品・生活雑貨 > 洗濯・柔軟剤', catId: 'qoo10-laundry' },
    { id: 'prod-9', title: '[다이소] 실리콘 주방 장갑 2p', krw: 3000, provider: '다이소', cat: 'キッチン・台所 > キッチングッズ', catId: 'qoo10-kitchen' },
    { id: 'prod-10', title: '[다이소] 분리수거함 대형 3단', krw: 5000, provider: '다이소', cat: '日用品・生活雑貨 > ゴミ箱・ダストボックス', catId: 'qoo10-dustbin' },
    { id: 'prod-11', title: '[다이소] 욕실 수납 선반 흡착식', krw: 4000, provider: '다이소', cat: '日用品・生活雑貨 > 浴室用品', catId: 'qoo10-bath' },
    { id: 'prod-12', title: '[쿠팡] 에어팟 케이스 실리콘 커버', krw: 3500, provider: '쿠팡', cat: '家電・スマホ・カメラ > スマートフォンアクセサリー', catId: 'qoo10-phone' },
    { id: 'prod-13', title: '[쿠팡] USB-C 고속 충전 케이블 1m', krw: 6500, provider: '쿠팡', cat: '家電・スマホ・カメラ > ケーブル・充電器', catId: 'qoo10-cable' },

    // 쿠팡 20건
    { id: 'prod-14', title: '[쿠팡] 크록스 클래식 클로그 남여공용', krw: 52000, provider: '쿠팡', cat: 'ファッション > 靴・シューズ > サンダル', catId: 'qoo10-shoes' },
    { id: 'prod-15', title: '[쿠팡] 오뚜기 참깨라면 5개입 멀티팩', krw: 4200, provider: '쿠팡', cat: '食品・飲料 > 麺類・パスタ', catId: 'qoo10-food-noodle' },
    { id: 'prod-16', title: '[쿠팡] 남양 맛있는두유GT 900ml 24팩', krw: 28000, provider: '쿠팡', cat: '食品・飲料 > 豆乳・乳製品', catId: 'qoo10-food-drink' },
    { id: 'prod-17', title: '[쿠팡] 비비고 왕교자 냉동만두 1.05kg', krw: 9800, provider: '쿠팡', cat: '食品・飲料 > 冷凍食品', catId: 'qoo10-frozen' },
    { id: 'prod-18', title: '[쿠팡] 신라면 블랙 5개입', krw: 5500, provider: '쿠팡', cat: '食品・飲料 > 麺類・パスタ', catId: 'qoo10-food-noodle' },
    { id: 'prod-19', title: '[쿠팡] 동원 참치 라이트 스탠다드 100g×10캔', krw: 14500, provider: '쿠팡', cat: '食品・飲料 > 缶詰・瓶詰', catId: 'qoo10-food-can' },
    { id: 'prod-20', title: '[쿠팡] CJ 스팸 클래식 340g×6캔', krw: 32000, provider: '쿠팡', cat: '食品・飲料 > 缶詰・瓶詰', catId: 'qoo10-food-can' },
    { id: 'prod-21', title: '[쿠팡] 핵불닭볶음면 5개입', krw: 6500, provider: '쿠팡', cat: '食品・飲料 > 麺類・パスタ', catId: 'qoo10-food-noodle' },
    { id: 'prod-22', title: '[쿠팡] 테팔 인지니오 프라이팬 28cm', krw: 39000, provider: '쿠팡', cat: 'キッチン・台所 > フライパン・鍋', catId: 'qoo10-pan' },
    { id: 'prod-23', title: '[쿠팡] 쿠쿠 6인용 전기밥솥 CRP-P0660FW', krw: 89000, provider: '쿠팡', cat: '家電 > 炊飯器', catId: 'qoo10-ricecooker' },
    { id: 'prod-24', title: '[쿠팡] 다이슨 에어랩 컴플리트 롱', krw: 699000, provider: '쿠팡', cat: '家電 > ヘアケア家電', catId: 'qoo10-haircare' },
    { id: 'prod-25', title: '[쿠팡] 필립스 전동칫솔 소닉케어 HX3671', krw: 49000, provider: '쿠팡', cat: 'ビューティー > オーラルケア > 電動歯ブラシ', catId: 'qoo10-toothbrush' },
    { id: 'prod-26', title: '[쿠팡] 안마의자 휴테크 HCP-600D', krw: 1290000, provider: '쿠팡', cat: '家電 > マッサージ機器', catId: 'qoo10-massage' },
    { id: 'prod-27', title: '[쿠팡] 나이키 에어포스1 07 화이트', krw: 109000, provider: '쿠팡', cat: 'ファッション > 靴・シューズ > スニーカー', catId: 'qoo10-sneaker' },
    { id: 'prod-28', title: '[쿠팡] 뉴발란스 993 그레이 MR993GL', krw: 239000, provider: '쿠팡', cat: 'ファッション > 靴・シューズ > スニーカー', catId: 'qoo10-sneaker' },
    { id: 'prod-29', title: '[쿠팡] 애플 아이폰 15 프로 실리콘 케이스', krw: 25000, provider: '쿠팡', cat: '家電・スマホ・カメラ > スマートフォンアクセサリー', catId: 'qoo10-phone' },
    { id: 'prod-30', title: '[쿠팡] 삼성 갤럭시 버즈2 프로 화이트', krw: 149000, provider: '쿠팡', cat: '家電・スマホ・カメラ > イヤホン・ヘッドホン', catId: 'qoo10-earphone' },
    { id: 'prod-31', title: '[쿠팡] 로지텍 MX Keys S 무선 키보드', krw: 129000, provider: '쿠팡', cat: '家電・スマホ・カメラ > PCアクセサリー', catId: 'qoo10-pc' },
    { id: 'prod-32', title: '[쿠팡] 헤드앤숄더 쿨멘솔 샴푸 900ml', krw: 12000, provider: '쿠팡', cat: 'ビューティー > ヘアケア > シャンプー', catId: 'qoo10-shampoo' },
    { id: 'prod-33', title: '[쿠팡] 다우니 섬유유연제 퍼플 3.2L', krw: 19500, provider: '쿠팡', cat: '日用品・生活雑貨 > 洗濯・柔軟剤', catId: 'qoo10-laundry' },

    // 다이소 15건
    { id: 'prod-34', title: '[다이소] 스팀 다리미 소형 휴대용', krw: 5000, provider: '다이소', cat: '家電 > アイロン', catId: 'qoo10-iron' },
    { id: 'prod-35', title: '[다이소] 멀티 케이블 정리함 데스크 오거나이저', krw: 3000, provider: '다이소', cat: 'オフィス・文具 > デスクオーガナイザー', catId: 'qoo10-organizer' },
    { id: 'prod-36', title: '[다이소] 원터치 물통 500ml 트라이탄', krw: 3000, provider: '다이소', cat: 'スポーツ・アウトドア > ウォーターボトル', catId: 'qoo10-bottle' },
    { id: 'prod-37', title: '[다이소] 미니 선풍기 USB 타입 탁상용', krw: 5000, provider: '다이소', cat: '家電 > 扇風機', catId: 'qoo10-fan' },
    { id: 'prod-38', title: '[다이소] 아크릴 화장품 수납함 3단', krw: 3000, provider: '다이소', cat: '日用品・生活雑貨 > 収納・整理 > コスメ収納', catId: 'qoo10-cosmetic-storage' },
    { id: 'prod-39', title: '[다이소] 접이식 빨래건조대 소형', krw: 5000, provider: '다이소', cat: '日用品・生活雑貨 > 洗濯グッズ > 物干し', catId: 'qoo10-laundry-rack' },
    { id: 'prod-40', title: '[다이소] 클립형 독서대 책상 거치대', krw: 3000, provider: '다이소', cat: 'オフィス・文具 > 書見台・タブレットスタンド', catId: 'qoo10-stand' },
    { id: 'prod-41', title: '[다이소] 실리콘 빨대 세트 6개입 케이스 포함', krw: 2000, provider: '다이소', cat: 'キッチン・台所 > キッチングッズ', catId: 'qoo10-kitchen' },
    { id: 'prod-42', title: '[다이소] 마그네틱 메모보드 A4 화이트', krw: 3000, provider: '다이소', cat: 'オフィス・文具 > ホワイトボード', catId: 'qoo10-whiteboard' },
    { id: 'prod-43', title: '[다이소] 캠핑 접이식 의자 미니 경량', krw: 5000, provider: '다이소', cat: 'スポーツ・アウトドア > アウトドアチェア', catId: 'qoo10-camp' },
    { id: 'prod-44', title: '[다이소] 방수 보관백 지퍼 대형 5p', krw: 2000, provider: '다이소', cat: '日用品・生活雑貨 > 収納・整理 > 収納袋', catId: 'qoo10-storage-bag' },
    { id: 'prod-45', title: '[다이소] 욕실 논슬립 매트 40×60cm', krw: 3000, provider: '다이소', cat: '日用品・生活雑貨 > 浴室用品 > バスマット', catId: 'qoo10-bathmat' },
    { id: 'prod-46', title: '[다이소] 주방 세제 거품 디스펜서 500ml', krw: 2000, provider: '다이소', cat: 'キッチン・台所 > キッチングッズ', catId: 'qoo10-kitchen' },
    { id: 'prod-47', title: '[다이소] 자동 개폐 쓰레기통 10L 스마트 센서', krw: 5000, provider: '다이소', cat: '日用品・生活雑貨 > ゴミ箱・ダストボックス', catId: 'qoo10-dustbin' },
    { id: 'prod-48', title: '[다이소] 모션 감지 LED 센서등 실내용', krw: 5000, provider: '다이소', cat: 'インテリア・寝具 > 照明器具', catId: 'qoo10-light' },
];

const makeSourceUrl = (provider: string, id: string): string => {
    const num = id.replace('prod-', '');
    switch (provider) {
        case '올리브영': return `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A00000${num.padStart(6, '0')}`;
        case '쿠팡': return `https://www.coupang.com/vp/products/${num}00000${num}`;
        case '다이소': return `https://www.daiso.co.kr/goods/detail/${num.padStart(8, '0')}`;
        default: return `https://www.coupang.com/vp/products/${num}`;
    }
};

const pendingProducts: ProductDetail[] = pendingProductsData.map((p) => ({
    id: p.id,
    titleKo: p.title,
    titleJa: null,
    descriptionKo: PENDING_DESC,
    descriptionJa: null,
    options: makeOptions(p.id),
    thumbnails: makeThumbnails(3, p.id),
    detailImages: makeDetailImages(5, p.id),
    salePriceJpy: Math.round((p.krw / 10.5) * 1.3 / 10) * 10,
    qoo10CategoryId: p.catId,
    qoo10CategoryPath: p.cat,
    provider: p.provider,
    sourceUrl: makeSourceUrl(p.provider, p.id),
    thumbnailUrl: `https://placehold.co/600x600/F2F4F6/8B95A1?text=${p.id}`,
    originalPriceKrw: p.krw,
    translationStatus: 'pending' as const,
    editStatus: 'pending' as const,
    lastSavedAt: null,
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    isRead: true,
    weightKg: [0.15, 0.25, 0.3, 0.5, 0.45, 0.8, 0.2, 1.2, 0.35, 0.6][prodNum(p.id) % 10],
    isWeightEstimated: prodNum(p.id) % 3 !== 0,
    weightSource: (prodNum(p.id) % 3 === 0 ? 'crawled' : 'ai') as 'crawled' | 'ai' | 'manual',
    priceSource: (prodNum(p.id) % 4 === 0 ? 'ai' : 'crawled') as 'crawled' | 'ai' | 'manual',
}));

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

// n-2: 쿠팡 URL 수집 완료 8건, n-3: 다이소 자동 수집 완료 (다이소 pending 전체)
const COUPANG_NEW_IDS = new Set(['prod-14','prod-15','prod-16','prod-17','prod-18','prod-19','prod-20','prod-21']);

// pending 상품들의 번역 완료 시 사용할 일본어 제목 맵
export const PENDING_JA_TITLES: Record<string, string> = {
    'prod-1': '[Olive Young] TORRIDEN ダイブイン セラム 50ml',
    'prod-2': '[Olive Young] ROUND LAB 1025 独島トナー 200ml',
    'prod-3': '[Olive Young] ANUA ドクダミトナーパッド 70枚',
    'prod-4': '[Olive Young] MEDIHEAL ティーツリーケアソリューション マスク 10枚',
    'prod-5': '[Olive Young] Baiohealbeau プロバイオダーム バランシングトナー 200ml',
    'prod-6': '[Coupang] ロック＆ロック クリアビ 密閉容器 8個セット',
    'prod-7': '[Coupang] 3M スコッチ 多目的テープ 12mm×30m 10個入り',
    'prod-8': '[Coupang] Persil パワージェル 洗濯洗剤 3L',
    'prod-9': '[Daiso] シリコン キッチングローブ 2個セット',
    'prod-10': '[Daiso] 分別ゴミ箱 大型 3段',
    'prod-11': '[Daiso] 浴室収納棚 吸盤式',
    'prod-12': '[Coupang] AirPodsケース シリコンカバー',
    'prod-13': '[Coupang] USB-C 急速充電ケーブル 1m',
    'prod-14': '[Coupang] クロックス クラシック クロッグ ユニセックス',
    'prod-15': '[Coupang] オトゥギ ごまラーメン 5個入りマルチパック',
    'prod-16': '[Coupang] ナムヤン おいしい豆乳GT 900ml 24本入り',
    'prod-17': '[Coupang] bibigo 王餃子 冷凍餃子 1.05kg',
    'prod-18': '[Coupang] 辛ラーメン ブラック 5個入り',
    'prod-19': '[Coupang] 東遠 ライトスタンダードツナ缶 100g×10缶',
    'prod-20': '[Coupang] CJ SPAM クラシック 340g×6缶',
    'prod-21': '[Coupang] ヘクプルダック炒め麺 5個入り',
    'prod-22': '[Coupang] T-fal インジニオ フライパン 28cm',
    'prod-23': '[Coupang] CUCKOO 6合炊き電気炊飯器 CRP-P0660FW',
    'prod-24': '[Coupang] Dyson エアラップ コンプリート ロング',
    'prod-25': '[Coupang] Philips 電動歯ブラシ ソニッケアー HX3671',
    'prod-26': '[Coupang] Hutech マッサージチェア HCP-600D',
    'prod-27': "[Coupang] Nike エアフォース1 '07 ホワイト",
    'prod-28': '[Coupang] New Balance 993 グレー MR993GL',
    'prod-29': '[Coupang] Apple iPhone 15 Pro シリコーンケース',
    'prod-30': '[Coupang] Samsung Galaxy Buds2 Pro ホワイト',
    'prod-31': '[Coupang] Logicool MX Keys S ワイヤレスキーボード',
    'prod-32': '[Coupang] Head & Shoulders クールメントール シャンプー 900ml',
    'prod-33': '[Coupang] Downy 柔軟剤 パープル 3.2L',
    'prod-34': '[Daiso] スチームアイロン 小型 携帯用',
    'prod-35': '[Daiso] マルチケーブル整理ボックス デスクオーガナイザー',
    'prod-36': '[Daiso] ワンタッチ水筒 500ml トライタン',
    'prod-37': '[Daiso] ミニ卓上扇風機 USB式',
    'prod-38': '[Daiso] アクリルコスメ収納ケース 3段',
    'prod-39': '[Daiso] 折りたたみ物干しラック 小型',
    'prod-40': '[Daiso] クリップ式書見台 デスクスタンド',
    'prod-41': '[Daiso] シリコンストローセット 6本入り ケース付き',
    'prod-42': '[Daiso] マグネットメモボード A4 ホワイト',
    'prod-43': '[Daiso] 折りたたみキャンプチェア ミニ軽量',
    'prod-44': '[Daiso] 防水収納袋 ジッパー大型 5枚入り',
    'prod-45': '[Daiso] 浴室用ノンスリップバスマット 40×60cm',
    'prod-46': '[Daiso] キッチン洗剤泡ディスペンサー 500ml',
    'prod-47': '[Daiso] 自動開閉ゴミ箱 10L スマートセンサー付き',
    'prod-48': '[Daiso] モーションセンサーLEDライト 室内用',
};

// 번역 완료(13건): 7~19일 전 수집 / 번역 필요(35건): 1~6일 전 수집
export const MOCK_PRODUCTS: ProductDetail[] = [
    ...pendingProducts.map((p, i) => {
        const isCoupangNew = COUPANG_NEW_IDS.has(p.id);
        const isDaisoNew = p.provider === '다이소';
        return {
            ...p,
            createdAt: daysAgo(Math.floor(i / 7) + 1),
            isRead: !(isCoupangNew || isDaisoNew),
            ...(isCoupangNew ? { jobId: 'n-2' } : {}),
            ...(isDaisoNew ? { jobId: 'n-3' } : {}),
        };
    }),
];
