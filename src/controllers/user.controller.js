import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler( async (req , res) => {

    // console.log("BODY:", req.body);
    // console.log("FILES:", req.files);

    //get user details from frontend
    const {userName, email, fullName, password} = req.body

    //validation - not empty

        // if(fullName === "") {
        //     throw new ApiError(400 , "fullName is required")
        // }
        // if(userName === "") //..... same things 

    if(
        [fullName, userName, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400 , "All fields are required")
    }

    //check if user already exists : userName, email
    const existedUser = await User.findOne({
        $or : [{ userName } , { email }]
    })

    if(existedUser) {
        throw new ApiError(409, "User with email or userName already exists")
    }

    //check for images, check for avatar
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path;
    } else {
        throw new ApiError(400, 'Avatar file is missing');
    }
    //const coverImageLocalPath = req.files?.coverImage[0]?.path  //undefined error

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath) {
        throw new ApiError(400, 'avatar is required')
    }
    
    //upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, 'avatar is required')
    }

    //create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })

    //remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //check for user creation
    if(!createdUser) {
        throw new ApiError(500 , 'something went wrong in user creation')
    }

    //return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //get data from req body
    //userName and email
    //find the user
    //password check
    //access and refresh token
    //send cookies
    //return response

    //get data from req body
    const {email, userName, password} = req.body

    //userName and email
    if(!userName && !email) {
        throw new ApiError(400 , "userName or email is required")
    }

    //find the user
    const user = await User.findOne({
        $or : [{userName} , {email}]
    })
    if(!user) {
        throw new ApiError(404, "user not found")
    }

    //password check
    const isPasswordValid =  await user.isPasswordCorrect(password)
    if(!isPasswordValid) {
        throw new ApiError(401, "wrong password")
    }

    //access and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    //send cookies
    const logedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true //only be modified by server
    }
    return res
        .status(200)
        .cookie("accessToken" , accessToken, options)
        .cookie("refreshToken" , refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: logedInUser, accessToken, refreshToken
                },
                "user loggedIn successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    //get the data of logged in user 
    //delete the cookies -> access token and refresh token
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // $set : {
            //     refreshToken : undefined //or null
            // },
            $unset : {
                refreshToken : 1 //this removes the field from the document
            }
        }, 
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
        .status(200)
        .clearCookie("accessToken" , options)
        .clearCookie("refreshToken" , options)
        .json(new ApiResponse(200, {} , "user logged out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new ApiError(404, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError (401 , "refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure : true
        }
    
        const {accessToken, newrefreshToken} =await generateAccessAndRefreshToken(user._id)
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken" , newrefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newrefreshToken,
                    },
                    "Access Token Refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400 , "wrong old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: true})

    return res
        .status(200)
        .json(
            new ApiResponse(200, {} , "password changed successfully")
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200, req.user , "current user fetched successfully"
            )
        )
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email) {
        throw new ApiError(400, "all fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName: fullName,
                email: email
            } 
        },
        {new: true}
    ).select("-password")

    return res  
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "name and email updated successfully"
            )
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(404, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(400, "error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res  
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "avatar updated successfully"
            )
        )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400 , "cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    //check if uploaded on cloudinary
    if(!coverImage.url){
        throw new ApiError(400 , "Error while uploading coverImage to cloudinary")
    }

    //update the uploaded file in user

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "coverImage updated successfully"
            )
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    
    const {userName} = req.params

    if(!userName?.trim()) {
        throw new ApiError(400 , "userName is missing")
    }

    const channel = await User.aggregate([
        {
            $match : {
                userName : userName?.toLowerCase()
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project : {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage:1,
                email: 1
            }
        }
    ])

    if(!channel?.length) {
        throw new ApiError(404 , "channel does not exist")
    }

    return res  
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "user channel fetched successfully"
            )
        )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match : {
                //filters current users id matches with logged in user
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as:"owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullName : 1, 
                                        userName: 1,
                                        avatar : 1
                                    }
                                },
                                {
                                    $addFields : {
                                        owner : {
                                            $first : "$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200) 
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "watch history fetched successfully"
            )
        )
})

const getUserChannelVideos = asyncHandler(async (req, res) => {
    const {userName} = req.params
    if(!userName) {
        throw new ApiError(404 , "userName not found")
    }

    const user = await User.findOne({userName})
    if(!user) {
        throw new ApiError(400 , "user not found")
    }

    const videos = await Video.find({owner : user._id}).populate(
        "owner",
        "fullName avatar"
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "Videos fetched successfully"
            )
        )
})

const getDashboardData = asyncHandler(async (req, res) => {
    const {userName} = req.params
    if(!userName) {
        throw new ApiError(404, "userName not found")
    }

    const user = await User.findOne({userName})
    if(!user) {
        throw new ApiError(400, "user not found")
    }

    if (user._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "You are not an admin");
    }

    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: user._id,
            },
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
            },
        },
    ]);

    const totalLikes = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
            },
        },
        {
            $unwind: "$videoDetails",
        },
        {
            $match: {
                "videoDetails.owner": user._id,
            },
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: 1 },
            },
        },
    ]);

    const totalVideos = await Video.find({ owner: user._id }).select(
        "-password -refreshToken"
    );

    const subscribers = await User.aggregate([
        {
            $match: {
                subscriber: user._id,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribers",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                $size: "$subscribers",
                },
            },
        },
        {
            $project: {
                subscribersCount: 1,
            },
        },
  ]);
  // console.log("SUBSCRIBERS", subscribers);

  // console.log("TOTAL VIDEOS", videos.length);
  // console.log("TOTAL VIEWS", totalViews);

  return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalViews: totalViews[0]?.totalViews || 0,
                totalSubscribers: subscribers[0]?.subscribersCount || 0,
                totalVideos: totalVideos || 0,
                totalLikes: totalLikes[0]?.totalLikes || 0,
            },
            "Dashboard data fetched successfully"
        )
    )
})

export {registerUser, loginUser, logoutUser , refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar,  updateUserCoverImage, getUserChannelProfile, getWatchHistory, getUserChannelVideos, getDashboardData}