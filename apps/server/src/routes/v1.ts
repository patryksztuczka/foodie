import { Router } from 'express';
import { searchController } from '../controllers/search-controller.ts';
import { createMealItem, listMealsByDate } from '../controllers/meals-controller.ts';

export const v1Router: Router = Router();

v1Router.get('/search', searchController);
v1Router.post('/meals', createMealItem);
v1Router.get('/meals', listMealsByDate);
