import { Router } from 'express';
import { searchController } from '../controllers/search-controller.ts';

export const v1Router: Router = Router();

v1Router.get('/search', searchController);
