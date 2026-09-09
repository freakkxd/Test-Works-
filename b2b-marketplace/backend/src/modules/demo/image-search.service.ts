import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const TIMEOUT_MS = 10_000;
const MIN_COUNT = 40;

interface BraveImageResult {
  url?: string;
  properties?: { url?: string; width?: number; height?: number };
  thumbnail?: { src?: string };
}

interface BraveImageResponse {
  results?: BraveImageResult[];
}

/** Предсказуемые внешние placeholder URL (800×800) */
export function buildFallbackImageUrls(count: number, label = 'Demo Cat'): string[] {
  const prefix = label.trim().replace(/\s+/g, '+');
  return Array.from({ length: count }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return `https://placehold.co/800x800/111827/e5e7eb?text=${prefix}+${num}`;
  });
}

function isValidHttpsUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    const blocked = ['data:', 'file:', 'javascript:'];
    if (blocked.some((p) => raw.toLowerCase().startsWith(p))) return false;
    return true;
  } catch {
    return false;
  }
}

function isSquareEnough(width?: number, height?: number): boolean {
  if (!width || !height || width <= 0 || height <= 0) return true;
  const ratio = width / height;
  return ratio >= 0.9 && ratio <= 1.1;
}

function extractImageUrl(item: BraveImageResult): string | null {
  const candidates = [item.properties?.url, item.url, item.thumbnail?.src].filter(Boolean) as string[];
  for (const c of candidates) {
    if (isValidHttpsUrl(c)) return c;
  }
  return null;
}

/** Валидация поискового запроса (admin / env) */
export function sanitizeImageQuery(raw: string | undefined, fallback: string): string {
  const q = (raw ?? fallback).trim().slice(0, 120);
  if (!q) return fallback;
  if (/https?:\/\//i.test(q)) throw new Error('Query must not contain URLs');
  if (/[<>]/.test(q)) throw new Error('Query must not contain HTML');
  if (!/^[\p{L}\p{N}\s\-_',.+]+$/u.test(q)) {
    throw new Error('Query contains invalid characters');
  }
  return q;
}

/** Поиск изображений через Brave Image Search API */
async function fetchFromBrave(apiKey: string, query: string, count: number): Promise<string[]> {
  const url = new URL('https://api.search.brave.com/res/v1/images/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', String(Math.min(Math.max(count, MIN_COUNT), 200)));
  url.searchParams.set('safesearch', 'strict');

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Brave API HTTP ${response.status}`);
  }

  const data = (await response.json()) as BraveImageResponse;
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const item of data.results ?? []) {
    const imageUrl = extractImageUrl(item);
    if (!imageUrl || seen.has(imageUrl)) continue;
    if (!isSquareEnough(item.properties?.width, item.properties?.height)) continue;
    seen.add(imageUrl);
    urls.push(imageUrl);
    if (urls.length >= count) break;
  }

  return urls;
}

export type ImageSource = 'brave' | 'placeholder';

export interface DemoImageResult {
  urls: string[];
  source: ImageSource;
  query: string;
}

/** Получить URL изображений для demo-каталога (Brave или fallback) */
export async function resolveDemoImageUrls(options: {
  query: string;
  count?: number;
  apiKey?: string;
}): Promise<DemoImageResult> {
  const count = options.count ?? MIN_COUNT;
  const query = options.query;
  const apiKey = options.apiKey?.trim();

  if (apiKey) {
    try {
      const braveUrls = await fetchFromBrave(apiKey, query, count);
      if (braveUrls.length >= count) {
        return { urls: braveUrls.slice(0, count), source: 'brave', query };
      }
      // Дополняем fallback если Brave вернул мало квадратных результатов
      const fallbacks = buildFallbackImageUrls(count - braveUrls.length, 'Demo Cat');
      return {
        urls: [...braveUrls, ...fallbacks].slice(0, count),
        source: 'brave',
        query,
      };
    } catch (err) {
      Logger.warn(
        `Brave Image Search unavailable, using placeholders: ${err instanceof Error ? err.message : 'unknown'}`,
        'ImageSearchService',
      );
    }
  }

  return {
    urls: buildFallbackImageUrls(count, 'Demo Cat'),
    source: 'placeholder',
    query,
  };
}

@Injectable()
export class ImageSearchService {
  constructor(private config: ConfigService) {}

  getDefaultQuery(): string {
    return this.config.get<string>('DEMO_IMAGE_QUERY') || 'cats';
  }

  getImageCount(): number {
    return Number(this.config.get<string>('DEMO_IMAGE_COUNT')) || MIN_COUNT;
  }

  isBraveConfigured(): boolean {
    const key = this.config.get<string>('BRAVE_SEARCH_API_KEY');
    return Boolean(key?.trim());
  }

  async fetchForDemo(imageQuery?: string): Promise<DemoImageResult> {
    const fallback = this.getDefaultQuery();
    const query = sanitizeImageQuery(imageQuery, fallback);
    const count = this.getImageCount();
    const apiKey = this.config.get<string>('BRAVE_SEARCH_API_KEY');

    return resolveDemoImageUrls({ query, count, apiKey });
  }
}
