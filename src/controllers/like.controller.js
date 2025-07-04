import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Tweet} from "../models/tweet.model.js"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "toggleVideoLike : invalid VideoId")
    }

    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(401, "toggleVideoLike : video not found")
    }

    const existingLikeStatus = await Like.findOne({
        video : new mongoose.Types.ObjectId(videoId),
        likedBy : new mongoose.Types.ObjectId(req.user?._id)
    })
    //already liked
    if(existingLikeStatus) { 
        const disliked = await Like.findByIdAndDelete(existingLikeStatus._id)
        if(!disliked) {
            throw new ApiError(400, "toggleVideoLike : error while deleting like")
        }
    }else{ //not already liked
        const liked = await Like.create({
            video : new mongoose.Types.ObjectId(videoId),
            likedBy : new mongoose.Types.ObjectId(req.user?._id) 
        })
        if(!liked){
            throw new ApiError(401, "toggleVideoLike : error while adding like")
        }
    }

    const likes = await Video.aggregate([
        {
            $match :{
                _id : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup :{
                from : "likes",
                localField : "_id",
                foreignField : "video",
                as : "likes"
            }
        },
        {
            $addFields :{
                likesCount : {
                    $size : "$likes"
                }
            }
        },
        {
            $project : {
                likesCount: 1
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    isLiked : !existingLikeStatus,
                    likes : likes[0]?.likesCount
                },
                "Like status updated"
            )
        )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "toggleCommentLike : invalid commentId")
    }

    const comment = await Comment.findById(commentId)
    if(!comment) {
        throw new ApiError(401, "toggleCommentLike : comment not found")
    }

    const existingLikeStatus = await Like.findOne({
        comment : new mongoose.Types.ObjectId(commentId),
        likedBy : new mongoose.Types.ObjectId(req.user?._id)
    })
    //already liked
    if(existingLikeStatus) { 
        const disliked = await Like.findByIdAndDelete(existingLikeStatus._id)
        if(!disliked) {
            throw new ApiError(400, "toggleCommentLike : error while deleting like")
        }
    }else{ //not already liked
        const liked = await Like.create({
            comment : new mongoose.Types.ObjectId(commentId),
            likedBy : new mongoose.Types.ObjectId(req.user?._id) 
        })
        if(!liked){
            throw new ApiError(401, "toggleCommentLike : error while adding like")
        }
    }

    const likes = await Comment.aggregate([
        {
            $match :{
                _id : new mongoose.Types.ObjectId(commentId)
            }
        },
        {
            $lookup :{
                from : "likes",
                localField : "_id",
                foreignField : "comment",
                as : "likes"
            }
        },
        {
            $addFields :{
                likesCount : {
                    $size : "$likes"
                }
            }
        },
        {
            $project : {
                likesCount: 1
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    isLiked : !existingLikeStatus,
                    likes : likes[0]?.likesCount
                },
                "Like status updated"
            )
        )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "toggleTweetLike : invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet) {
        throw new ApiError(401, "toggleTweetLike : tweet not found")
    }

    const existingLikeStatus = await Like.findOne({
        tweet : new mongoose.Types.ObjectId(tweetId),
        likedBy : new mongoose.Types.ObjectId(req.user?._id)
    })
    //already liked
    if(existingLikeStatus) { 
        const disliked = await Like.findByIdAndDelete(existingLikeStatus._id)
        if(!disliked) {
            throw new ApiError(400, "toggleTweetLike : error while deleting like")
        }
    }else{ //not already liked
        const liked = await Like.create({
            tweet: new mongoose.Types.ObjectId(tweetId),
            likedBy : new mongoose.Types.ObjectId(req.user?._id) 
        })
        if(!liked){
            throw new ApiError(401, "toggleTweetLike : error while adding like")
        }
    }

    const likes = await Comment.aggregate([
        {
            $match :{
                _id : new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $lookup :{
                from : "likes",
                localField : "_id",
                foreignField : "tweet",
                as : "likes"
            }
        },
        {
            $addFields :{
                likesCount : {
                    $size : "$likes"
                }
            }
        },
        {
            $project : {
                likesCount: 1
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    isLiked : !existingLikeStatus,
                    likes : likes[0]?.likesCount
                },
                "Like status updated"
            )
        )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $match :{
                likedBy : new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup :{
                from : "videos",
                localField: "video",
                foreignField : "_id",
                as :"videos",
                pipeline : [
                    {
                        $lookup :{
                            from : "users",
                            localField: "owner",
                            foreignField : "_id",
                            as : "owner"
                        }
                    },
                    {
                        $unwind : "$owner"
                    },
                    {
                        $project : {
                            _id : 1,
                            title : 1,
                            thumbnail : 1,
                            duration : 1,
                            views : 1,
                            createdAt : 1,
                            owner : {
                                _id : 1,
                                userName : 1,
                                "avatar.url" :1 ,
                                fullName : 1
                            }
                        }
                    }
                ]
            }
        },
        {
            $project : {
                _id : 0,
                videos :1
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos?.[0]?.videos || 0,
                "liked videos fetched successfully"
            )
        )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}