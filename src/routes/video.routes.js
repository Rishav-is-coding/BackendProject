import { upload } from "../middlewares/multer.middleware";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus, getAllRecommendedVideos} from '../controllers/video.controller.js'

const router = Router()

router.route("/").get(getAllVideos)
router.route("/recommendation/:videoId").get(getAllRecommendedVideos)

router.use(verifyJWT) //if verifyJWT need to applied on every route in the file

router.route("/upload-video").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name : "thumbnail",
            maxCount : 1
        }
    ]),
    publishAVideo
)

router.route("/:videoId").get(getVideoById)

router.route("/update/:videoId").patch(upload.single("thumbnail"), updateVideo)

router.route("/delete/:videoId").delete(deleteVideo)

router.route("/toggle/:videoId").patch(togglePublishStatus)

export default router
