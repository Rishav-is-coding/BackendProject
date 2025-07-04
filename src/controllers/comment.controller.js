import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "getVideoComments : invalid videoId")
    }

    const comments = await Comment.aggregate([
        {
            $match : {
                video : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup :{
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner",
                pipeline : [
                    {
                        $project : {
                            _id : 1,
                            UserName : 1,
                            avatar : 1,
                            fullName: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup : {
                from : "likes",
                localField : "_id",
                foreignField : "comment",
                as :"likes"
            }
        },
        {
            $addFields :{
                likesCount : {
                    $size : "$likes"
                },
                isLiked : {
                    $cond :{ 
                        if :{
                            $in : [req.user?._id , "$likes.likedBy"]
                        },
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                _id : 1,
                createdAt : 1,
                userName : 1,
                avatar : 1,
                likesCount :1,
                isLiked : 1,
                content : 1,
                owner : 1
            }
        },
        {
            $skip : (parseInt(page) -1) * limit
        },
        {
            $limit : parseInt(limit)
        }
    ])

    const totalComments = await Comment.countDocuments({ video: videoId })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {comments, totalComments},
                "Comments fetched successfully"
            )
        )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content} = req.body
    const {videoId} = req.params

    if(!content?.trim()) {
        throw new ApiError(400, "addComment : comment content is required")
    }
    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "addComment : invalid videoId")
    }

    const comment = await Comment.create({
        content,
        video : new mongoose.Types.ObjectId(videoId),
        owner : new mongoose.Types.ObjectId(req.user?._id) 
    })

    if(!comment) {
        throw new ApiError(400 , "addComment : error while adding comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comment,
                "comment added successfully"
            )
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {content} = req.body
    const {commentId} = req.params
    if(!content?.trim()) {
        throw new ApiError(400 , "updateComment : content can not be empty")
    }
    if(!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400 , "updateComment : invalid commentId")
    }

    const comment = await Comment.findById(commentId)

    if(comment.owner._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(400 , "updateComment : unauthorized access")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {
            new : true
        }
    )

    if(!updateComment) {
        throw new ApiError(400 , "updateComment : error while updating comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedComment,
                "comment updated successfully"
            )
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    if(!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400 , "deleteComment : invalid commentId")
    }
    const comment = await Comment.findById(commentId)

    if(comment.owner._id.toString() !== req.user?._id.toString()){
        throw new ApiError(400 , "deleteComment : unauthorized access")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId) 
    if(!deletedComment) {
        throw new ApiError(400 , "deleteComment : error while deleting comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                deletedComment,
                "comment deleted successfully"
            )
        )
})

export {
        getVideoComments, 
        addComment, 
        updateComment,
        deleteComment
    }