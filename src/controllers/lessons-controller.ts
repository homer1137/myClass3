import { NextFunction, Request, Response } from "express";
import { pool } from "../db";
import format from "pg-format";
import { ApiError } from "../exeptions/api-error";
import { TypedRequestBody } from "../types";
import { LessonCreateModel } from "../Models/LessonModel/lessonCreateModel";
import { LessonViewModel } from "../Models/LessonModel/lessonViewModel";
import { LessonGetModel } from "../Models/LessonModel/lessonGetModel";

class LessonController {
  async getAllLessons(req: Request, res: Response, next: NextFunction) {
    try {
      const lessons = await pool.query("SELECT * FROM lessons");
      res.json(lessons.rows);
    } catch (error) {
      next(error);
    }
  }
//
  async getLessonsWithFilter(
    req: TypedRequestBody<LessonGetModel>,
    res: Response<LessonViewModel[]>,
    next: NextFunction
  ) {
    try {
      const {
        date,
        status,
        teacherIds,
        studentsCount,
        lessonPerPage = 5,
        page = 1,
      } = req.body;

      //Валидация полей
      if (typeof status !== "string" && status !== undefined) {
        throw ApiError.BadRequest("Status in bad format ");
      }
      if (date?.length) {
        date?.forEach((item) => {
          if (typeof item !== "string") {
            throw ApiError.BadRequest("Date in bad format ");
          }
        });
      }
      if (teacherIds?.length) {
        teacherIds?.forEach((item) => {
          if (typeof item !== "number") {
            throw ApiError.BadRequest("Teahcer ids in bad format ");
          }
        });
      }
      if (studentsCount?.length) {
        studentsCount?.forEach((item) => {
          if (typeof item !== "number") {
            throw ApiError.BadRequest("Students cound in wrong format");
          }
        });
      }
      if (typeof page !== "number" && page !== undefined) {
        throw ApiError.BadRequest("Page should be number ");
      }
      if (typeof lessonPerPage !== "number" && lessonPerPage !== undefined) {
        throw ApiError.BadRequest("lessonPerPage should be number ");
      }

      const parameters: any[] = [];
      //date
      if (!date) {
        parameters.push("2000-01-01");
        parameters.push("2025-01-01");
      } else if (date.length === 1) {
        parameters.push(date[0]);
        parameters.push("2000-01-01");
      } else if (date.length === 2) {
        parameters.push(...date);
      }
      //status
      if (status !== undefined) {
        parameters.splice(2, 0, status);
      } else {
        parameters.push(10);
      }

      // teachers
      if (teacherIds) {
        parameters.push(teacherIds);
      } else {
        parameters.push(999);
      }

      // students count
      const parameters2 = [];

      if (!studentsCount) {
        parameters2.push(0);
        parameters2.push(500);
      } else if (studentsCount.length === 1) {
        parameters2.push(studentsCount[0]);
        parameters2.push(500);
      } else if (studentsCount.length === 2) {
        parameters2.push(...studentsCount);
      }

      //запрос уроков с разбивкой по количесву учеников
      const lessonsWithStudentsCount = await pool.query(
        `SELECT 
    lessons.id, 
    lessons.title, 
    count(lesson_students.student_id) from lessons 
    LEFT JOIN lesson_students ON lesson_students.lesson_id=lessons.id 
    
    GROUP 
    BY lessons.id, 
    lessons.title ${
      !studentsCount || studentsCount?.length === 2
        ? "HAVING COUNT(lesson_students.student_id) >= $1 AND  COUNT(lesson_students.student_id) <= $2"
        : "HAVING COUNT(lesson_students.student_id) = $1 AND  COUNT(lesson_students.student_id) != $2"
    } `,
        parameters2
      );

      const lessonIds = lessonsWithStudentsCount.rows.map(
        (item: { id: number; title: string }) => item.id
      );
      parameters.push(lessonIds);

      //lessonPerPage + page
      parameters.push(lessonPerPage);
      parameters.push(page);
      const lessons = await pool.query(
        `SELECT 
      lessons.id as id,
      lessons.date,
      lessons.title, 
      lessons.status, 
      teachers.id as teachers_id,
      students.id as students_id,
      students.name as student_name, 
      lesson_students.visit as visit, 
      teachers.name as teachers_name
      FROM lessons LEFT JOIN lesson_teachers ON lessons.id=lesson_teachers.lesson_id LEFT JOIN teachers ON lesson_teachers.teacher_id=teachers.id 
      LEFT JOIN lesson_students ON lessons.id=lesson_students.lesson_id LEFT JOIN students ON lesson_students.student_id=students.id 
      
      ${
        !date || date?.length === 2
          ? "where date>=$1 AND date<=$2"
          : "where date=$1 AND date!=$2"
      } 
      ${status !== undefined ? " AND status=$3" : " AND status!=$3"} 
      ${
        teacherIds !== undefined
          ? "AND teachers.id = ANY($4)"
          : "AND teachers.id != $4"
      }
      ${
        lessonIds !== undefined
          ? "AND lessons.id = ANY($5)"
          : "AND lessons.id != $5"
      }
      
  LIMIT $6 OFFSET $7

    `,

        parameters
      );

      // students arrays for lessons

      function getResult(
        lessonArray: {
          id: number;
          date: Date;
          title: string;
          status: number;
          teachers_id: number;
          teachers_name: string;
          students_id: number;
          student_name: string;
          visit: number;
        }[]
      ): LessonViewModel[] {
        const res: any[] = [];
        lessonArray.forEach((item) => {
          const index = res.findIndex((it) => it.id === item.id);
          if (index === -1) {
            res.push({
              id: item.id,
              date: item.date,
              title: item.title,
              status: item.status,
              teachers: [{ id: item.teachers_id, name: item.teachers_name }],
              students: [
                {
                  id: item.students_id,
                  name: item.student_name,
                  visit: item.visit,
                },
              ],
            });
          } else {
            if (
              res[index].teachers.findIndex(
                (it: any) => it.id === item.teachers_id
              ) === -1
            ) {
              res[index].teachers.push({
                id: item.teachers_id,
                name: item.teachers_name,
              });
            }
            if (
              res[index].students.findIndex(
                (it: any) => it.id === item.students_id
              ) === -1
            ) {
              res[index].students.push({
                id: item.students_id,
                name: item.student_name,
                visit: item.visit,
              });
            }
          }
        });
        const finalRes = res.map((item) => ({
          ...item,
          visitCount: item.students.filter((item: any) => item.visit === true)
            .length,
          teachers: [...new Set(item.teachers)],
          students: [...new Set(item.students)],
        }));
        return finalRes;
      }

      const result = getResult(lessons.rows);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  public async createLesson(
    req: TypedRequestBody<LessonCreateModel>,
    res: Response<LessonViewModel[]>,
    next: NextFunction
  ) {
    try {
      const { title, teacherIds, days, firstDate, lessonsCount, lastDate } =
        req.body;

      //fielda validation
      if (typeof title !== "string") {
        throw ApiError.BadRequest("Title should be a number ");
      }
      if (teacherIds?.length) {
        teacherIds?.forEach((item) => {
          if (typeof item !== "number") {
            throw ApiError.BadRequest("Teacher ids in bad format ");
          }
        });
      }
      if (days?.length) {
        teacherIds?.forEach((item) => {
          if (typeof item !== "number") {
            throw ApiError.BadRequest("Days in bad format ");
          }
        });
      }
      if (typeof firstDate !== "string") {
        throw ApiError.BadRequest("First day has wrong format");
      }
      if (typeof lastDate !== "string" && typeof lastDate !== "undefined") {
        throw ApiError.BadRequest("Last day has wrong format");
      }
      if (
        typeof lessonsCount !== "number" &&
        typeof lessonsCount !== "undefined"
      ) {
        throw ApiError.BadRequest("Lesson count should be a number ");
      }

      //получние дат между первой и последней даты с учетом нужных дней нещдели
      const getDatesBetweenDates = (
        startDate: Date,
        endDate: Date,
        weekDays: number[]
      ) => {
        let dates: Date[] = [];

        const theDate = new Date(startDate);
        while (theDate <= new Date(endDate)) {
          if (weekDays.includes(theDate.getDay())) {
            dates = [...dates, new Date(theDate)];
          }
          theDate.setDate(theDate.getDate() + 1);
        }
        return dates;
      };
      //получение дат когда есть нужное количество уроков с учетом дней недели
      const getDatesWithLessonsCount = (
        startDate: Date,
        weekDays: number[],
        count: number
      ) => {
        let dates: Date[] = [];
        const theDate = new Date(startDate);
        for (let i = count; i > 0; i--) {
          if (weekDays.includes(theDate.getDay())) {
            dates = [...dates, new Date(theDate)];
          }
          theDate.setDate(theDate.getDate() + 1);
        }
        return dates;
      };

      //ограничение по урокам - 300 шт.
      const modifiedLessonsCount =
        lessonsCount && lessonsCount > 300 ? 300 : lessonsCount;

      //ограничение по урокам - 1 год
      const differenceBetweenDates =
        lastDate && +new Date(lastDate) - +new Date(firstDate);

      const modifiedLastDate: number | undefined =
        differenceBetweenDates &&
        differenceBetweenDates / 1000 / 3600 / 24 > 366
          ? new Date(firstDate).setFullYear(
              new Date(firstDate).getFullYear() + 1
            )
          : lastDate;

      const dates: Date[] = modifiedLessonsCount
        ? getDatesWithLessonsCount(firstDate, days, modifiedLessonsCount)
        : modifiedLastDate
        ? getDatesBetweenDates(firstDate, new Date(modifiedLastDate), days)
        : [];

      const lessonArray = dates.map((item) => [title, item]);
      const newLessons = await pool.query(
        format(
          `INSERT INTO lessons (title, date)  VALUES %L  RETURNING * `,
          lessonArray
        )
      );

      const newLessonsWithTeachers: [teacher_id: number, lesson_id: number][] =
        [];
      for (let i = 0; i < newLessons.rows.length; i++) {
        for (let b = 0; b < teacherIds.length; b++) {
          newLessonsWithTeachers.push([teacherIds[b], newLessons.rows[i].id]);
        }
      }

      res.json(newLessons.rows as LessonViewModel[]);
    } catch (error) {
      next(error);
    }
  }

  async getLessonById(req: Request, res: Response) {
    const id = req.params.id;
    const lesson = await pool.query(`SELECT * from lessons WHERE id=$1`, [id]);
    if (lesson.rows.length) {
      res.json(lesson.rows);
    } else res.json("there is no lesson with such id");
  }
}

export const lessons_controller = new LessonController();
