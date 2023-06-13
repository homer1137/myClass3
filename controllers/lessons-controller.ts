import { Request, Response } from "express";
import { pool } from "../db";
import format from "pg-format";

class LessonController {
  async getAllLessons(req: Request, res: Response) {
    const lessons = await pool.query("SELECT * FROM lessons");
    res.json(lessons.rows);
  }

  async getLessonsWithFilter(req: Request, res: Response) {
    const {
      date,
      status,
      teacherIds,
      studentsCount,
      lessonPerPage = 5,
      page = 1,
    } = req.body;

    const parameters = [];
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
      parameters.push("sdfsd");
    }

    // students count
    const parameters2 = [];

    if (!studentsCount) {
      parameters2.push(0);
      parameters2.push(500);
    } else if (studentsCount.length === 1) {
      parameters2.push(studentsCount[0]);
      parameters2.push(0);
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

    const lessonIds = lessonsWithStudentsCount.rows.map((item: any) => item.id);
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
          ? "AND teachers.name = ANY($4)"
          : "AND teachers.name != $4"
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

    function getResult(lessonArray: any[]) {
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

    res.json([result]);
  }

  public async createLesson(req: Request, res: Response) {
    const { title, date, teacherIds, days, firstDate, lessonsCount, lastDate } =
      req.body;
    
    //получние дат между первой и последней даты с учетом нужных дней нещдели
    const getDatesBetweenDates = (
      startDate: string,
      endDate: string,
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
    const getDatesWithLessonsCount = (startDate: string, weekDays: number[], count: number) => {
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

    const dates: Date[] = lessonsCount?getDatesWithLessonsCount(firstDate, days, lessonsCount):getDatesBetweenDates(firstDate, lastDate, days)  

    

    
    const lessonArray = dates.map((item)=>([title, item]))
    const newLessons = await pool.query(format(`INSERT INTO lessons (title, date)  VALUES %L  RETURNING * `, lessonArray))
    

    
    const newLessonsWithTeachers:any = [];
    for(let i=0;i<newLessons.rows.length; i++){
       for (let b=0; b<teacherIds.length; b++){  
        newLessonsWithTeachers.push([teacherIds[b], newLessons.rows[i].id])
       }
    }

    res.json(newLessons.rows)
  }

  async getLessonById(req: Request, res: Response) {
    const id = req.params.id;
    const lesson = await pool.query(`SELECT * from lessons WHERE id=$1`, [id]);
    if (lesson.rows.length) {
      res.json(lesson.rows);
    } else res.json("there is no lesson with such id");
  }
  async updateCourse(req: Request, res: Response) {
    const { id, title } = req.body;
    const apdatedCourse = await pool.query(
      `UPDATE courses SET title=$1 where id=$2 RETURNING *`,
      [title, id]
    );
    res.json(apdatedCourse.rows[0]);
  }
  async deleteCourse(req: Request, res: Response) {
    const id = req.params.id;
    const course = await pool.query(`DELETE from courses WHERE id=$1`, [id]);
    if (course.rows.length) {
      res.json(course.rows);
    } else res.json("deleted");
  }
}

export const lessons_controller = new LessonController();
