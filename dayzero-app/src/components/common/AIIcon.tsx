import { colors } from '../../design/tokens';

interface Props {
    size?: number;
    color?: string;
}

/** 채워진 4각 스파클 AI 아이콘 */
export const AIIcon: React.FC<Props> = ({ size = 14, color = colors.primary }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
    >
        {/* 큰 스파클 */}
        <path d="M10 2C10 2 12 7.5 13 9C14 10.5 19.5 11.5 19.5 11.5C19.5 11.5 14 12.5 13 14C12 15.5 10 21 10 21C10 21 8 15.5 7 14C6 12.5 0.5 11.5 0.5 11.5C0.5 11.5 6 10.5 7 9C8 7.5 10 2 10 2Z" />
        {/* 작은 스파클 */}
        <path d="M19.5 3C19.5 3 20.3 5.2 20.8 5.8C21.3 6.4 23.5 7 23.5 7C23.5 7 21.3 7.6 20.8 8.2C20.3 8.8 19.5 11 19.5 11C19.5 11 18.7 8.8 18.2 8.2C17.7 7.6 15.5 7 15.5 7C15.5 7 17.7 6.4 18.2 5.8C18.7 5.2 19.5 3 19.5 3Z" />
    </svg>
);
