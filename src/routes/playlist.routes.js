import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist} from '../controllers/playlist.controller.js'

const router = Router()

router.route("/user/:userName").get(getUserPlaylists)
router.use(verifyJWT)

router.route("/").post(createPlaylist)
router.route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist)

export default router