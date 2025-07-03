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


//routes import 
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'

//routes declaration
app.use("/api/v1/users" , userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/app/v1/tweets" , tweetRouter)
app.use("/app/v1/subscriptions" , subscriptionRouter)

export { app }