import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { json } from 'body-parser'

import { defaultRouter } from './router'
import { errorMiddleware } from './middlewares/error-middleware'


dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(json())
app.use(cors({credentials: true, origin: process.env.CLIENT_URL}))
app.use('/api', defaultRouter)
app.use('/api', errorMiddleware)

const start = async () => {
  try {

    app.listen(PORT, () => {
      console.log(`🚀 server started at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.log(error)
  }
}

start()