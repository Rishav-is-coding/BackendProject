import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from '../models/user.model.js'

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name) {
        throw new ApiError(400, "createPlaylist : name is required")
    }

    const playlist = await Playlist.create({
        name,
        description: description || "",
        owner : req.user?._id
    })
    if(!playlist) {
        throw new ApiError(400 , "createPlaylist : error while creating playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "playlist created successfully"
            )
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!userId || !isValidObjectId(userName)) {
        throw new ApiError(400, "getUserPlaylists : invalid userId")
    }

    const user = await User.findOne({userId})
    if(!user){
        throw new ApiError(404, "user not found")
    }

    const playlists = await Playlist.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(user._id)
            }
        },
        {
            $lookup :{
                from : "videos",
                localField : "videos",
                foreignField : "_id",
                as : "videos"
            }
        },
        {
            $project :{
                name : 1,
                description : 1,
                createdAt : 1,
                owner : 1,
                "videos.thumbnail" : 1
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlists,
                "playlists fetched successfully"
            )
        )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "invalid playlistId")
    }

    const playlist = await Playlist.aggregate([
        {
            $match :{ 
                _id : new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner",
                pipeline : [
                    {
                        $lookup :{
                            from : "subscriptions",
                            localField: "id",
                            foreignField : "channel",
                            as : "subscribers"
                        }
                    },
                    {
                        $addFields :{
                            subsciberCount :{
                                $size : "$subcribers"
                            }
                        }
                    },
                    {
                        $project :{
                            avatar : 1,
                            fullName : 1,
                            subsciberCount : 1
                        }
                    }
                ]
            }
        },
        {
            $unwind : "$owner"
        },
        {
            $lookup :{
                from : "videos",
                localField : "videos",
                foreignField : "_id",
                as : "videos",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField :"_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project :{
                                        avatar : 1,
                                        fullName : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind : "$owner"
                    },
                    {
                        $project : {
                            _id : 1,
                            title : 1,
                            description : 1,
                            views : 1,
                            owner : 1,
                            createdAt : 1
                        }
                    }
                ]
            }
        }
    ])

    if(!playlist) {
        throw new ApiError(404, "getPlaylistById : Playlist not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlist fetched successfully"
            )
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}