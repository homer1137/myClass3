// import { Request, Response } from 'express'
// import { UserCreateModel } from 'models/UserModel/userCreateModel'
// import { UserUpdateTitleModel } from 'models/UserModel/userUpdateTitleModel'
// import { UserUrlParamsId } from 'models/UserModel/userUrlParamsId'
// import { UserViewModel } from 'models/UserModel/userViewModel'
// import { IUser, TypedRequestBody, TypedRequestWithParams } from 'types'
// import { pool } from '../db'
class UserController {
//   async createUser(
//     req: TypedRequestBody<UserCreateModel>,
//     res: Response<IUser>,
//   ) {
//     const { name, surname, email, is_client, is_activated } = req.body
//     const newUser = await pool.query(
//       `INSERT INTO users (name, surname, email, is_client, is_activated) values ($1, $2, $3, $4, $5) RETURNING *`,
//       [name, surname, email, is_client, is_activated],
//     )
//     res.json(newUser.rows[0])
//   }
//   async getUsers(req: Request, res: Response<UserViewModel[]>) {
//     const users = await pool.query('SELECT * FROM users ORDER BY id ASC')
//     res.json(users.rows)
//   }
//   async getUserById(
//     req: TypedRequestWithParams<UserUrlParamsId>,
//     res: Response<UserViewModel | { data: string }>,
//   ) {
//     const id = req.params.id
//     const user = await pool.query(`SELECT * from users WHERE id=$1`, [id])
//     if (user.rows.length) {
//       res.json(user.rows[0])
//     } else res.json({ data: 'there is no user with such id' })
//   }
//   async updateUserName(
//     req: TypedRequestBody<UserUpdateTitleModel>,
//     res: Response<UserViewModel | { data: string }>,
//   ) {
//     const { id, name } = req.body
//     const apdatedUser = await pool.query(
//       `UPDATE users SET name=$1 where id=$2 RETURNING *`,
//       [name, id],
//     )
//     if (apdatedUser.rows.length) {
//       res.json(apdatedUser.rows[0])
//     } else res.json({ data: 'there is no user with such id' })
//   }
//   async deleteUser(
//     req: TypedRequestWithParams<UserUrlParamsId>,
//     res: Response<UserViewModel[] | { data: string }>,
//   ) {
//     const id = req.params.id
//     const user = await pool.query(`DELETE from users WHERE id=$1 RETURNING *`, [
//       id,
//     ])
//     if (user.rows.length) {
//       res.json(user.rows)
//     } else res.json({ data: 'there is no user with such id' })
//   }
}

export const user_controller = new UserController()
