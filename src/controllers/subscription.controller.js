import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  //check if channel already subscribed
  const subscribe = await Subscription.find({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (!subscribe) {
    throw new ApiError(
      500,
      "Something went wrong while fetching subscriber information "
    );
  }

  //unsubscribe if already subscribed and vice versa
  if (subscribe.length === 0) {
    //subscribe
    await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    });

    //return
    return res
      .status(200)
      .json(new ApiResponse(200, { isSubscribed: true }, "Channel Subscribed"));
  } else {
    //unsubscribe
    await Subscription.deleteOne({
      subscriber: req.user?._id,
      channel: channelId,
    });

    //return
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isSubscribed: false }, "Channel Unsubscribed")
      );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  console.log(channelId);

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: "$subscriber",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "result",
      },
    },
    {
      $unwind: "$result",
    },
    {
      $replaceRoot: {
        newRoot: "$result",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched for User Channel")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  console.log(channelId);

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: "$channel",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "result",
      },
    },
    {
      $unwind: "$result",
    },
    {
      $replaceRoot: {
        newRoot: "$result",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers,
        "Channels User has subscribed are fetched Successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
