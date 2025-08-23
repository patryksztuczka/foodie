import { Router } from 'express';
import { searchController } from '../controllers/search-controller.js';
import { createMealItem, listMealsByDate, deleteMealItem, listMealsSummary } from '../controllers/meals-controller.js';

export const v1Router: Router = Router();

v1Router.get('/search', searchController);
v1Router.post('/meals', createMealItem);
v1Router.get('/meals', listMealsByDate);
v1Router.delete('/meals/:id', deleteMealItem);
v1Router.get('/meals/summary', listMealsSummary);
