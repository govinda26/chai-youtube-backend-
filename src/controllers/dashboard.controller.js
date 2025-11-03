import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const total = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    //total Views
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "totalViews",
      },
    },
    //remove items from array totalViews
    {
      $unwind: "$totalViews",
    },
    //find the sum of views
    {
      $group: {
        _id: "$_id",
        totalViews: {
          $sum: "$totalViews.views",
        },
      },
    },
    //total Subscribers
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "totalSubscribers",
      },
    },
    //total Videos
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "totalVideos",
        //total likes
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "totalLikes",
            },
          },
          {
            $addFields: {
              likesCount: {
                $size: "$totalLikes",
              },
            },
          },
        ],
      },
    },
    {
      $project: {
        totalSubscribers: {
          $size: "$totalSubscribers",
        },
        totalViews: 1,
        totalVideos: {
          $size: "$totalVideos",
        },
        totalLikes: {
          $sum: "$totalVideos.likesCount",
        },
        _id: 0,
      },
    },
  ]);

  if (!total) {
    throw new ApiError(500, "Something went wrong while fetching User details");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, total, "Dashboard Details Fetched"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const videos = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "result",
      },
    },
    {
      $project: {
        result: 1,
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

  if (!videos) {
    throw new ApiError("Something went wrong while fetching videos");
  }

  if (videos.length === 0) {
    return res.status(200).json(200, {}, "User has not uploaded any videos");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videos,
        "Videos uploaded by user has been fetched Successfully"
      )
    );
});

export { getChannelStats, getChannelVideos };
