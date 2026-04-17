// DayZero 익스텐션 ↔ 웹앱 postMessage 프로토콜 타입 정의 (v1)
// 원본: dayzero_extension/src/shared/messages.ts + docs/PROTOCOL.md
// 이 파일은 외부 의존성 없이 standalone으로 유지한다.

export const PROTOCOL_VERSION = '1' as const;

export type MallId =
  | 'oliveyoung'
  | 'coupang'
  | 'daiso'
  | 'smartstore'
  | 'gmarket'
  | 'yes24'
  | 'aladin'
  | 'ktown4u'
  | 'weverse'
  | 'makestar'
  | 'fans';

export interface ProviderMeta {
  label: string;  // 한글 표시 이름 (예: '올리브영')
  domain: string; // 대표 도메인 (예: 'oliveyoung.co.kr')
}

export interface CollectedUrl {
  url: string;
  provider: MallId;
  addedAt: string;  // ISO 8601
  source: 'extension';
}

export const MSG = {
  QUEUE_UPDATED:  'DAYZERO_QUEUE_UPDATED',
  REQUEST_QUEUE:  'DAYZERO_REQUEST_QUEUE',
  REMOVE_URL:     'DAYZERO_REMOVE_URL',
  REMOVE_URLS:    'DAYZERO_REMOVE_URLS',
  COLLECTION_PROGRESS: 'DAYZERO_COLLECTION_PROGRESS',
  EXT_HANDSHAKE:  'DAYZERO_EXT_HANDSHAKE',
} as const;

export type MsgType = (typeof MSG)[keyof typeof MSG];

interface BaseEnvelope {
  type: MsgType;
  v: string;
  ts: number;
}

export interface QueueUpdatedMsg extends BaseEnvelope {
  type: typeof MSG.QUEUE_UPDATED;
  payload: { queue: CollectedUrl[] };
}

export interface ExtHandshakeMsg extends BaseEnvelope {
  type: typeof MSG.EXT_HANDSHAKE;
  payload: { version: string; providers: Record<MallId, ProviderMeta> };
}

export interface RequestQueueMsg extends BaseEnvelope {
  type: typeof MSG.REQUEST_QUEUE;
}

export interface RemoveUrlMsg extends BaseEnvelope {
  type: typeof MSG.REMOVE_URL;
  payload: { url: string };
}

export interface RemoveUrlsMsg extends BaseEnvelope {
  type: typeof MSG.REMOVE_URLS;
  payload: { urls: string[] };
}

export interface CollectionProgressMsg extends BaseEnvelope {
  type: typeof MSG.COLLECTION_PROGRESS;
  payload: { current: number; total: number; active: boolean };
}

export type DayzeroMessage =
  | QueueUpdatedMsg
  | ExtHandshakeMsg
  | RequestQueueMsg
  | RemoveUrlMsg
  | RemoveUrlsMsg
  | CollectionProgressMsg;
