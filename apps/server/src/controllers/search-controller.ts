import type { Request, Response } from 'express';
import { z } from 'zod';

import { searchProducts, getProductByCode } from '../services/open-food-facts-service.js';

const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
  page: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 1))
    .pipe(z.number().int().min(1).max(100)),
  pageSize: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 10))
    .pipe(z.number().int().min(1).max(100)),
});

export async function searchController(req: Request, res: Response): Promise<void> {
  const parsed = searchQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_query_parameters', details: z.treeifyError(parsed.error) });
    return;
  }

  const { q, page, pageSize } = parsed.data;

  try {
    const result = await searchProducts({ query: q, page, pageSize });
    res.json(result);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'internal_error';
    const isAbort = error instanceof Error && message.includes('aborted');
    res.status(isAbort ? 504 : 502).json({ error: isAbort ? 'upstream_timeout' : 'upstream_error' });
  }
}

const codeQuerySchema = z.object({
  code: z.string().trim().min(5).max(32),
});

export async function searchByCodeController(req: Request, res: Response): Promise<void> {
  const parsed = codeQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_query_parameters', details: z.treeifyError(parsed.error) });
    return;
  }

  const { code } = parsed.data;

  try {
    const result = await getProductByCode({ code });
    res.json(result);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'internal_error';
    const isAbort = error instanceof Error && message.includes('aborted');
    res.status(isAbort ? 504 : 502).json({ error: isAbort ? 'upstream_timeout' : 'upstream_error' });
  }
}
