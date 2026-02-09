import { z } from 'zod';
import { positionDetailsSchema, positions } from './schema';

export const api = {
  positions: {
    list: {
      method: 'GET' as const,
      path: '/api/positions' as const,
      responses: {
        200: z.array(z.custom<typeof positions.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/positions/:id' as const,
      responses: {
        200: positionDetailsSchema,
        404: z.object({ message: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
