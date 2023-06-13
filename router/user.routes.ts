import { Router } from 'express'
import { user_controller } from '../controllers/user-controller'


export const userRouter = Router()

userRouter.post('/users', user_controller.createUser)
userRouter.get('/users', user_controller.getUsers)
userRouter.get('/users/:id', user_controller.getUserById)
userRouter.put('/users', user_controller.updateUserName)
userRouter.delete('/users/:id', user_controller.deleteUser)