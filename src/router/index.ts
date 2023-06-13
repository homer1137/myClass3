import { Router } from "express"

import { lessons_controller } from "../controllers/lessons-controller"; 

export const defaultRouter = Router();


defaultRouter.post('/lessons', lessons_controller.createLesson);
defaultRouter.get('/lessons', lessons_controller.getAllLessons);
defaultRouter.get('/filtered_lessons', lessons_controller.getLessonsWithFilter);

 