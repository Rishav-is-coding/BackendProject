import { Router } from "express";
import {verifyJWT} from '../middlewares/auth.middleware.js'
import {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels} from '../controllers/subscription.controller.js'


const router = Router()

router.route("/c/subscribed-to/:userName").get(getSubscribedChannels)
router.use(verifyJWT)

router.route("/c/subscribers/:channelId").get(getUserChannelSubscribers)
router.route("/c/:channelId").post(toggleSubscription)

export default router