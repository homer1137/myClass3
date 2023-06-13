import { Router } from "express"
import { course_controller } from "../controllers/course-controller";
import { teacher_controller } from "../controllers/teacher-controller";
import { lessons_controller } from "../controllers/lessons-controller"; 

export const defaultRouter = Router();

defaultRouter.post('/registration');
defaultRouter.post('/login');
defaultRouter.post('/logout');
defaultRouter.get('/activate/:link');
defaultRouter.get('/refresh');

defaultRouter.post('/courses', course_controller.createCourse);
defaultRouter.get('/courses', course_controller.getCourses);
defaultRouter.get('/courses/:id', course_controller.getCourseById);
defaultRouter.put('/courses', course_controller.updateCourse);
defaultRouter.delete('/courses/:id', course_controller.deleteCourse);

defaultRouter.post('/teachers', teacher_controller.createTeacher);
defaultRouter.get('/teachers', teacher_controller.getAllTeachers);
defaultRouter.get('/teachers/:id', course_controller.getCourseById);
defaultRouter.put('/teachers', course_controller.updateCourse);
defaultRouter.delete('/teachers/:id', course_controller.deleteCourse);


defaultRouter.post('/lessons', lessons_controller.createLesson);
defaultRouter.get('/lessons', lessons_controller.getAllLessons);
defaultRouter.get('/filtered_lessons', lessons_controller.getLessonsWithFilter);

 