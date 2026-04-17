import { useCallback, useEffect, useState } from 'react';
import {
  MSG,
  PROTOCOL_VERSION,
  type CollectedUrl,
  type MallId,
  type ProviderMeta,
} from '../shared/extensionProtocol';

interface UseExtensionBridgeResult {
  extInstalled: boolean;
  extQueue: CollectedUrl[];
  providers: Record<MallId, ProviderMeta> | null;
  removeUrl: (url: string) => void;
}

export function useExtensionBridge(): UseExtensionBridgeResult {
  const [extInstalled, setExtInstalled] = useState(false);
  const [extQueue, setExtQueue] = useState<CollectedUrl[]>([]);
  const [providers, setProviders] = useState<Record<MallId, ProviderMeta> | null>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // 동일 탭 window + 동일 origin 메시지만 허용
      if (event.source !== window || event.origin !== window.location.origin) return;

      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.v !== PROTOCOL_VERSION) return;

      if (msg.type === MSG.EXT_HANDSHAKE) {
        setExtInstalled(true);
        if (msg.payload?.providers) {
          setProviders(msg.payload.providers as Record<MallId, ProviderMeta>);
        }
      } else if (msg.type === MSG.QUEUE_UPDATED) {
        setExtQueue(Array.isArray(msg.payload?.queue) ? msg.payload.queue : []);
      }
    };

    window.addEventListener('message', handler);

    // 마운트 직후 현재 큐 + 핸드셰이크 요청
    window.postMessage(
      { type: MSG.REQUEST_QUEUE, v: PROTOCOL_VERSION, ts: Date.now() },
      window.location.origin,
    );

    return () => window.removeEventListener('message', handler);
  }, []);

  const removeUrl = useCallback((url: string) => {
    window.postMessage(
      { type: MSG.REMOVE_URL, v: PROTOCOL_VERSION, ts: Date.now(), payload: { url } },
      window.location.origin,
    );
  }, []);

  return { extInstalled, extQueue, providers, removeUrl };
}
