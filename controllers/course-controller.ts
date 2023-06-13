import { Request, Response } from "express";
import {pool} from '../db'
class CourseController {
    public async createCourse(req: Request, res: Response) {
        const {title} = req.body 
        const newCourse = await pool.query(`INSERT INTO courses (title) values ($1) RETURNING *`, [title])
        res.json(newCourse.rows[0])
    }
    public async getCourses(req: Request, res: Response) {
        const courses = await pool.query('SELECT * FROM courses ORDER BY id DESC')
        res.json(courses.rows)
    }
    public async getCourseById(req: Request, res: Response) {
        const id=req.params.id;
        const course = await pool.query(`SELECT * from courses WHERE id=$1`, [id])
        if (course.rows.length){
            res.json(course.rows)
        } else res.json('nothing is here')
        
    }
    public async updateCourse(req: Request, res: Response) {
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

export const course_controller = new CourseController(); 