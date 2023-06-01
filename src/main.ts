import express from 'express'
import morgan from 'morgan'

const app = express()

// 1) MIDDLEWARE
app.use(express.json())
app.use(morgan('dev'))
// 2) ROUTES

export default app
