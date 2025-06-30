import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';

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

    //check if user already exists : username, email
    const existedUser = await User.findOne({
        $or : [{ userName } , { email }]
    })

    if(existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    //check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
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
    //username and email
    //find the user
    //password check
    //access and refresh token
    //send cookies
    //return response

    //get data from req body
    const {email, userName, password} = req.body

    //username and email
    if(!userName || !email) {
        throw new ApiError(400 , "username or email is required")
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
            $set : {
                refreshToken : undefined
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

export {registerUser, loginUser, logoutUser}