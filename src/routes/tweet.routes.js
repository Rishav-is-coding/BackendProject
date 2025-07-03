import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {createTweet, getUserTweets, updateTweet, deleteTweet} from '../controllers/tweet.controller.js'

const router = Router()

router.route("/c/:userName").get(getUserTweets)
router.use(verifyJWT)

router.route("/").post(createTweet)
router.route("/:tweetId").patch(updateTweet)
router.route("/:tweetId").delete(deleteTweet)
export default router