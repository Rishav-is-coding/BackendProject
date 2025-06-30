import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true
}))

//data coming from json
app.use(express.json({
    limit: "16kb"
}))

//data coming from url
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

app.use(express.static("public"))

//allow us access cookies of the browser
app.use(cookieParser())

export { app }