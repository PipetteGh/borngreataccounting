import {
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  type CallHandler,
  Optional,
} from '@nestjs/common';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const camelToSnakeKeyCache = new Map<string, string>();
const snakeToCamelKeyCache = new Map<string, string>();

function toSnakeCaseKey(key: string): string {
  const cached = camelToSnakeKeyCache.get(key);
  if (cached !== undefined) return cached;
  const converted = key
    .split(/(?=[A-Z])/)
    .join('_')
    .toLowerCase();
  if (camelToSnakeKeyCache.size > 10000) camelToSnakeKeyCache.clear();
  camelToSnakeKeyCache.set(key, converted);
  return converted;
}

function toCamelCaseKey(key: string): string {
  if (!key) return key;
  const cached = snakeToCamelKeyCache.get(key);
  if (cached !== undefined) return cached;
  const converted = key.replace(/([-_]\w)/g, (group) =>
    group[1].toUpperCase(),
  );
  const normalized =
    converted.length > 0
      ? converted[0].toLowerCase() + converted.slice(1)
      : converted;
  if (snakeToCamelKeyCache.size > 10000) snakeToCamelKeyCache.clear();
  snakeToCamelKeyCache.set(key, normalized);
  return normalized;
}

function mapObjectKeysFast(
  value: any,
  transformKey: (key: string) => string,
  seen: WeakMap<object, any>,
): any {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date || Buffer.isBuffer(value) || value instanceof RegExp) {
    return value;
  }
  const existing = seen.get(value);
  if (existing !== undefined) {
    return existing;
  }
  if (Array.isArray(value)) {
    const arr = new Array(value.length);
    seen.set(value, arr);
    for (let i = 0; i < value.length; i++) {
      arr[i] = mapObjectKeysFast(value[i], transformKey, seen);
    }
    return arr;
  }
  const out: Record<string, any> = {};
  seen.set(value, out);
  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    out[transformKey(k)] = mapObjectKeysFast(value[k], transformKey, seen);
  }
  return out;
}

export function camelToSnake<T = any>(value: T): T {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }
  return mapObjectKeysFast(value, toSnakeCaseKey, new WeakMap()) as T;
}

export function snakeToCamel<T = any>(value: T): T {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }
  return mapObjectKeysFast(value, toCamelCaseKey, new WeakMap()) as T;
}

export const DEFAULT_STRATEGY = {
  in: snakeToCamel,
  out: camelToSnake,
};

@Injectable()
export class SerializeInterceptor implements NestInterceptor<any, any> {
  constructor(@Optional() readonly strategy = DEFAULT_STRATEGY) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Transform both body and query parameters
    request.body = this.strategy.in(request.body);
    request.query = this.strategy.in(request.query);

    // handle returns stream..
    return next.handle().pipe(map(this.strategy.out));
  }
}
