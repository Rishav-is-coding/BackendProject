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
    const likedVideos = await Like.aggregate([
        { // Stage 1: Match 'Like' documents for the current user
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        { // Stage 2: Lookup the 'Video' details for each liked video
            $lookup: {
                from: "videos",        // The collection to join with
                localField: "video",   // Field from the 'likes' collection
                foreignField: "_id",   // Field from the 'videos' collection
                as: "videoDetails"     // Name of the new array field to add to the input documents
            }
        },
        { // Stage 3: Unwind the 'videoDetails' array
          // This deconstructs the array field from the input documents to output a document for each element.
          // If a liked video does not exist (e.g., deleted), this stage will filter out that document,
          // ensuring only valid videos are returned.
            $unwind: "$videoDetails"
        },
        { // Stage 4: Lookup the 'User' details who owns the video
            $lookup: {
                from: "users",           // The collection to join with
                localField: "videoDetails.owner", // Field from the 'videoDetails' (which is the video's owner ID)
                foreignField: "_id",     // Field from the 'users' collection
                as: "ownerDetails"       // Name of the new array field for owner details
            }
        },
        { // Stage 5: Unwind the 'ownerDetails' array to get a direct owner object
            $unwind: "$ownerDetails"
        },
        { // Stage 6: Project the desired fields into the final output document
            $project: {
                _id: "$videoDetails._id",       // Use the video's _id as the main _id
                title: "$videoDetails.title",
                description: "$videoDetails.description",
                duration: "$videoDetails.duration",
                views: "$videoDetails.views",
                createdAt: "$videoDetails.createdAt",
                thumbnail: "$videoDetails.thumbnail.url", // Access the URL directly if thumbnail is an object
                videoFile: "$videoDetails.videoFile.url", // Optionally include video file URL if needed
                owner: {
                    _id: "$ownerDetails._id",
                    userName: "$ownerDetails.userName",
                    fullName: "$ownerDetails.fullName",
                    avatar: "$ownerDetails.avatar.url" // Access the URL directly if avatar is an object
                }
            }
        }
    ]);

    // Now, 'likedVideos' will be a direct array of video objects, or an empty array if no likes are found.
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos, // Directly return the aggregated array
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