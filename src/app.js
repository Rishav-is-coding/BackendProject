import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

console.log('CORS_ORIGIN environment variable:', process.env.CORS_ORIGIN)

app.use((req, res, next) => {
  console.log('Incoming Request Origin Header:', req.headers.origin);
  next();
});

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
import playlistRouter from './routes/playlist.routes.js'
import likeRouter from './routes/like.routes.js'
import commentRouter from './routes/comment.routes.js'
import healthCheckRouter from './routes/healthCheck.routes.js'

//routes declaration
app.use("/api/v1/users" , userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/tweets" , tweetRouter)
app.use("/api/v1/subscriptions" , subscriptionRouter)
app.use("/api/v1/playlists" , playlistRouter)
app.use("/api/v1/likes" , likeRouter)
app.use("/api/v1/comments" , commentRouter)
app.use("/api/v1/healthcheck" , healthCheckRouter)

export { app }