import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

function toJsonDeep(value: any, seen = new WeakMap<object, any>()): any {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }
  if (typeof value.toJSON === 'function') {
    return value.toJSON();
  }
  if (Buffer.isBuffer(value) || value instanceof RegExp) {
    return value;
  }
  const cached = seen.get(value);
  if (cached !== undefined) {
    return cached;
  }
  if (Array.isArray(value)) {
    const arr = new Array(value.length);
    seen.set(value, arr);
    for (let i = 0; i < value.length; i++) {
      arr[i] = toJsonDeep(value[i], seen);
    }
    return arr;
  }
  const out: Record<string, any> = {};
  seen.set(value, out);
  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    out[k] = toJsonDeep(value[k], seen);
  }
  return out;
}

@Injectable()
export class ToJsonInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data === null || data === undefined) {
          return data;
        }
        return toJsonDeep(data);
      }),
    );
  }
}
