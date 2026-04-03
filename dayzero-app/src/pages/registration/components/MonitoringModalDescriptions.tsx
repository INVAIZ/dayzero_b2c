import { colors, font, radius, spacing } from '../../../design/tokens';

const listStyle: React.CSSProperties = {
    background: colors.bg.subtle,
    borderRadius: radius.img,
    padding: '14px 16px 14px 32px',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2'],
    fontSize: font.size.md,
    color: colors.text.secondary,
    lineHeight: font.lineHeight.normal,
    textAlign: 'left',
};

const introStyle: React.CSSProperties = {
    margin: `0 0 ${spacing['3']}`,
    lineHeight: font.lineHeight.normal,
};

/** 가격·품절 확인 켜기 모달 description */
export const MonitoringEnableDescription = (
    <div>
        <p style={introStyle}>
            매일 7시부터 쇼핑몰의 가격과 재고를 확인하고, 아래 상황을 자동으로 처리해요.
        </p>
        <ul style={listStyle}>
            <li>상품이 품절되면 Qoo10 판매를 자동으로 일시중지해요</li>
            <li>품절된 상품이 재입고되면 판매를 자동으로 재개해요</li>
            <li>쇼핑몰 원가가 바뀌면 마진율에 맞춰 판매가를 자동으로 조정해요</li>
        </ul>
    </div>
);

/** 가격·품절 확인 끄기 모달 description (기본) */
export const MonitoringDisableDescription = (
    <div>
        <p style={introStyle}>
            끄면 이 상품의 가격·품절 변동을 더 이상 확인하지 않아요.
        </p>
        <ul style={listStyle}>
            <li>상품이 품절되어도 판매가 자동으로 중지되지 않아요</li>
            <li>품절된 상품이 재입고되어도 판매가 자동으로 재개되지 않아요</li>
            <li>쇼핑몰 원가가 바뀌어도 판매가가 자동으로 조정되지 않아요</li>
        </ul>
    </div>
);

/** 가격·품절 확인 끄기 모달 description (품절 상태) */
export const MonitoringDisableOosDescription = (
    <div>
        <p style={introStyle}>
            현재 이 상품은 품절 상태로 판매가 일시중지되어 있어요.
        </p>
        <ul style={listStyle}>
            <li>품절된 상품이 재입고되어도 판매가 자동으로 재개되지 않아요</li>
            <li>쇼핑몰 원가가 바뀌어도 판매가가 자동으로 조정되지 않아요</li>
        </ul>
    </div>
);
