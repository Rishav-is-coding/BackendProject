import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body

    if(!content?.trim()){
        throw new ApiError(400, "createTweet : tweet content can not be empty")
    }

    const tweet = await Tweet.create({
        content,
        owner: new mongoose.Types.ObjectId(req.user?._id)
    })

    if(!tweet) {
        throw new ApiError(404, "createTweet : error while creating the tweet")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweet,
                "tweet created successfully"
            )
        )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userName } = req.params
    if(!userName) {
        throw new ApiError(400, "getUserTweets : Username is not valid")
    }

    const user = await User.findOne({userName})
    if(!user) {
        throw new ApiError(400, "getUserTweets : User doesnot exist")
    }

    const tweets = await Tweet.aggregate([
        {
            $match :{
                owner: new mongoose.Types.ObjectId(user._id)
            }
        },
        {
            $lookup :{
                from : "likes",
                localField: "_id",
                foreignField: "tweet",
                as : "likes"
            }
        },
        {
            $addFields :{
                likesCount :{
                    $size : "$likes"
                },
                isLiked : {
                    $cond : {
                        if: {
                            $in : [req.user?._id , "$likes.likedBy"]
                        },
                        then : true,
                        else: false
                    }
                }
            }
        },
        {
            $lookup :{
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner"
            }
        },
        {
            $unwind : "$owner"
        },
        {
            $project :{
                _id : 1,
                content : 1,
                likesCount : 1,
                isLiked: 1,
                createdAt : 1,
                updatedAt : 1,
                owner : {
                    userName : "$owner.userName",
                    fullName : "$owner.fullName",
                    avatar : "$owner.avatar"
                }
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweets,
                "User tweet fetched successfully"
            )
        )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const {content} = req.body
    const {tweetId} = req.params

    if(!content?.trim()){
        throw new ApiError(400, "updateTweet : tweet content is required")
    }
    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400, "updateTweet : invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet) {
        throw new ApiError(404, "updateTweet : tweet not found")
    }

    if(tweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(401, "updateTweet : Unauthorized request")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {content},
        {new : true}
    )
    if(!updatedTweet) {
        throw new ApiError(400, "updateTweet : error while updating tweet")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedTweet,
                "tweet updated successfully"
            )
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if(!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(
            400, "deleteTweet : invalid tweetId"
        )
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "deleteTweet : tweet not found")
    }

    if(tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "deleteTweet : Unauthorized access")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    if(!deletedTweet) {
        throw new ApiError(401, "deleteTweet : error while deleting tweet")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "tweet deleted successfully"
            )
        )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}