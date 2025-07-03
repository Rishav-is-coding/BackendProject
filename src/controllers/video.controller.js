import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary , deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const skip = (page - 1)* limit

    const videos = await Video.aggregate([
        {
            $match: {
                $or: [{ title: { $regex: query, $options: "i" } }],
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            username: 1,
                            fullName: 1,
                        },
                    },
                ],
            },
        },
        {
            $project: {
                _id: 1,
                owner: 1,
                "videoFile.url": 1,
                "thumbnail.url": 1,
                createdAt: 1,
                title: 1,
                duration: 1,
                views: 1,
            },
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1,
            },
        },
        { $limit: limit * 1 },
        { $skip: skip },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "videos fetched successfully"
            )
        )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title){
        throw new ApiError(400, "Title is required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }
    if(!thumbnailLocalPath) {
        throw new ApiError(401, "thumbnail is required")
    }

    //upload on cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile) {
        throw new ApiError(404 , "CLOUDINARY: video file is required")
    }
    if(!thumbnail) {
        throw new ApiError(404, "CLOUDINARY: thumbnail is required")
    }

    const video = await Video.create({
        title: title || "",
        description : description || "",
        thumbnail : {
            url: thumbnail.url,
            publicId : thumbnail.public_id
        },
        videoFile: {
            url : videoFile.url,
            publicId: videoFile.public_id
        },
        duration : videoFile?.duration,
        isPublished : true,
        owner : new mongoose.Types.ObjectId(req.user?._id)
    })

    if(!video) {
        throw new ApiError(500, "Error while uploading video")
    }

    return res
        .status(200)
        .json(
            200,
            video,
            "Video uploaded successfully"
        )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId) throw new ApiError(400, "video not found")
    //TODO: get video by id

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $addFields: {
                likesCount: {
                $size: "$likes",
                },
                isLiked: {
                $cond: {
                    if: { $in: [req.user?._id, "$likes.likedBy"] },
                    then: true,
                    else: false,
                },
                },
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                {
                    $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers",
                    },
                },
                {
                    $addFields: {
                    // These will include in this stage
                    subscriberCount: {
                        $size: "$subscribers",
                    },

                    isSubscribed: {
                        $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                        },
                    },
                    },
                },
                {
                    $project: {
                    fullName: 1,
                    username: 1,
                    subscriberCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    },
                }]  
            },
        },
        {
            $unwind: "$owner",
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
            },
        },
        {
            $project: {
                "videoFile.url": 1,
                "thumbnail.url": 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                likesCount: 1,
                isLiked: 1,
                comments: 1,
                owner: 1,
            }
        }
    ])

    if(!video) {
        throw new ApiError(404, "video not found")
    }

    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views : 1
        }
    })

    await Video.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video[0],
                "video fetched successfully"
            )
        )

})

const updateVideo = asyncHandler(async (req, res) => {
    const {title, description} = req.body

    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "videoId not found")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "video not found")
    }

    if(req.user?._id.toString() !== video?.owner._id.toString()){
        throw new ApiError(401, "This action not permitted")
    }

    const thumbnailLocalPath = req.file?.path

    let thumbnail

    if(thumbnailLocalPath) {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if(!thumbnail) throw new ApiError(404, "Error while uplaoding thumbnail to cloudinary")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set :{
                title: title ||"",
                description : description || "",
                thumbnail : thumbnail?{
                    url: thumbnail.url,
                    publicId : thumbnail.public_id
                } : video?.thumbnail
            }
        },
        {
            new : true
        }
    )

    if(!updateVideo) {
        throw new ApiError(400, "Error while updating video")
    }

    if(thumbnail && video?.thumbnail?.publicId) {
        const deleteOldThumbnail = await deleteFromCloudinary(video.thumbnail.publicId)
        if(!deleteOldThumbnail) {
            throw new ApiError(500, "Error while deleting old thumbnail from cloudinary")
        }
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Video details updated successfully"
            )
        )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "delteVideo : Error while getting videoId")
    }

    const video = await Video.findById(videoId)
    if(!video) throw new ApiError(404, "video not found")

    //if user tries to delete someone else video
    if(req.user?._id.toString() !== video?.owner._id.toString()) {
        throw new ApiError(401, "deleteVideo  :  You can not perform this action")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)
    const deleteVideoFile = await deleteFromCloudinary(video?.videoFile?.publicId)
    const deleteThumbnail = await deleteFromCloudinary(video?.thumbnail?.publicId)

    if(!deleteVideoFile || !deleteThumbnail) {
        throw new ApiError(
            500,
            "deleteVideo : Error while delting video from Cloudinary"
        )
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400 , "togglePublishVideo : VideoId is not valid")
    }

    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(400, "togglePublishVideo : video not found")
    }

    if(req.user?._id.toString() !== video?.owner?._id.toString()) {
        throw new ApiError(401, "togglePublishVideo : Unauthorized access")
    }

    const updatedVideo = await findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video?.isPublished
            }
        },
        {
            new : true
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Public status changed successfully"
            )
        )
})

//todo: understand it clearly
const getAllRecommendedVideos = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);

    const { title, description } = video;
    const titleKeywords = title?.split(" ");
    const descriptionKeywords = description?.split(" ").slice(0, 10);

    const keywords = [
        ...new Set([...titleKeywords, ...descriptionKeywords]),
    ].join("|");

    const recommendedVideos = await Video.find({
        _id: { $ne: videoId },
        $or: [
        { title: { $regex: keywords, $options: "i" } },
        { description: { $regex: keywords, $options: "i" } },
        ],
    })
        .populate("owner", "fullName avatar")
        .limit(10);

    // console.log("Recommended Videos", recommendedVideos);

    return res
        .status(200)
        .json(
        new ApiResponse(
            200,
            recommendedVideos,
            "Recommended videos fetched successfully"
        )
        );
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllRecommendedVideos
}