import { Request, Response } from "express";
import {pool} from '../db'
class TeacherController {
    async createTeacher(req: Request, res: Response) {
        const {name, surname, course_id} = req.body
        const newTeacher = await pool.query(`INSERT INTO teacher (name, surname, course_id) values ($1, $2, $3) RETURNING *`, [name, surname, course_id])
        res.json(newTeacher.rows[0])
    }
    async getAllTeachers(req: Request, res: Response) {
        const courses = await pool.query('SELECT * FROM teacher')
        res.json(courses.rows)
    }
    async getCourseById(req: Request, res: Response) {
        const id=req.params.id;
        const course = await pool.query(`SELECT * from courses WHERE id=$1`, [id])
        if (course.rows.length){
            res.json(course.rows)
        } else res.json('nothing is here')
        
    }
    async updateCourse(req: Request, res: Response) {
        const {id, title} = req.body;
        const apdatedCourse = await pool.query(`UPDATE courses SET title=$1 where id=$2 RETURNING *`, [title, id])
        res.json(apdatedCourse.rows[0])
    }
    async deleteCourse(req: Request, res: Response) {
        const id=req.params.id;
        const course = await pool.query(`DELETE from courses WHERE id=$1`, [id])
        if (course.rows.length){
            res.json(course.rows)
        } else res.json('deleted')
    }
}

export const teacher_controller = new TeacherController(); 