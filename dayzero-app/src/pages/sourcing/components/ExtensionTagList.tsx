import { X } from 'lucide-react';
import { colors, font, radius, spacing } from '../../../design/tokens';
import type { CollectedUrl, MallId, ProviderMeta } from '../../../shared/extensionProtocol';

// 익스텐션 MallId → 웹앱 로고 파일 매핑
const MALL_LOGO: Record<MallId, string> = {
  oliveyoung: '/logos/oliveyoung.png',
  coupang:    '/logos/coupang.png',
  daiso:      '/logos/daiso.png',
  smartstore: '/logos/smartstore.png',
  gmarket:    '/logos/gmarket.png',
  yes24:      '/logos/yes24.png',
  aladin:     '/logos/aladin.png',
  ktown4u:    '/logos/ktown4u.png',
  weverse:    '/logos/weverseshop.png',
  makestar:   '/logos/makestar.png',
  fans:       '/logos/fans.png',
};

interface ExtensionTagListProps {
  extQueue: CollectedUrl[];
  providers: Record<MallId, ProviderMeta> | null;
  onRemove: (url: string) => void;
}

export const ExtensionTagList = ({ extQueue, providers, onRemove }: ExtensionTagListProps) => {
  if (extQueue.length === 0) return null;

  return (
    <div style={{ marginBottom: spacing['4'] }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing['2'],
        marginBottom: spacing['3'],
      }}>
        <span style={{
          fontSize: font.size.sm,
          fontWeight: font.weight.semibold,
          color: colors.primary,
        }}>
          수집 프로그램으로 담은 상품 ({extQueue.length}건)
        </span>
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacing['2'],
      }}>
        {extQueue.map((item) => {
          const label = providers?.[item.provider]?.label ?? item.provider;
          const logo = MALL_LOGO[item.provider];
          const stripped = item.url.replace(/^https?:\/\//, "");
          const shortUrl = stripped.length > 40 ? stripped.slice(0, 40) + "…" : stripped;

          return (
            <div
              key={item.url}
              title={item.url}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: radius.full,
                background: colors.primaryLight,
                border: `1px solid ${colors.primaryLightBorder}`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
            >
              {logo && (
                <img
                  src={logo}
                  alt={label}
                  style={{ width: 16, height: 16, borderRadius: radius.xs, flexShrink: 0 }}
                />
              )}
              <span style={{
                fontSize: font.size.sm,
                fontWeight: font.weight.semibold,
                color: colors.primary,
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
              <span style={{
                fontSize: font.size.xs,
                color: colors.text.tertiary,
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {shortUrl}
              </span>
              <button
                onClick={() => onRemove(item.url)}
                title="목록에서 제거"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  marginLeft: '2px',
                  display: 'flex',
                  color: colors.primary,
                  borderRadius: radius.full,
                  opacity: 0.7,
                }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '0.7'; }}
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
