import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "toggleSubscription : invalid channel id")
    }

    const existingSubscriptionStatus = await Subscription.findOne({
        subscriber : req.user?._id,
        channel : channelId
    })

    if(existingSubscriptionStatus) {
        const unsubscribe = await Subscription.findByIdAndDelete(existingSubscriptionStatus)
        if(!unsubscribe) {
            throw new ApiError(500 , "toggleSubscription : error while unsubscribing")
        }
    }else {
        const subscribe = await Subscription.create({
            subscriber : req.user?._id,
            channel : channelId
        })
        if(!subscribe) {
            throw new ApiError(500 , "toggleSubscription : Error while subscribing")
        }
    }

    const subscribers = await Subscription.find({
        channel: channelId
    }).countDocuments()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    subscribers: subscribers,
                    isSubscribed : !existingSubscriptionStatus
                },
                "subscribtion toggled successfully"
            )
        )
    

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId, !isValidObjectId(channelId)) {
        throw new ApiError(400, "getUserChannelSubscribers : invalid channelId")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match :{
                channel : new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "channel",
                foreignField : "_id",
                as : "subscribers"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                }
            }
        },
        {
            $project : {
                _id : 0,
                subscribersCount : 1,
                "subscribers._id" : 1,
                "subscribers.userName" : 1,
                "subscribers.avatar" : 1,
                "subscribers.fullName" : 1
            }
        }
    ])

    if(!subscribers) {
        throw new ApiError(
            404,
            "getUserChannelSubscribers : No subscribers found"
        )
    }

    return res 
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers[0],
                "subscribers fetched"
            )
        )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { userName } = req.params
    if (!userName) {
        throw new ApiError(400, "userName is not valid");
    }
    const user = await User.findOne({ userName });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(user._id),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channels",
                pipeline: [
                    {
                        $lookup: {
                        from: "subscriptions",
                        localField: "_id",
                        foreignField: "subscriber",
                        as: "subscribers",
                        },
                    },
                    {
                        $addFields: {
                            subscriberCount: {
                                $size: "$subscribers",
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            userName: 1,
                            fullName: 1,
                            "avatar.url": 1,
                            subscriberCount: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: "$channels" },
        {
            $replaceRoot: {
                newRoot: "$channels", // Replaces the root with the channel object, effectively removing nesting
            },
        },
    ]);

    // console.log("SUBSCRIBED CHANNELS", subscribedChannels);

    return res
        .status(200)
        .json(new ApiResponse(200, subscribedChannels, "Channels fetched"));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}