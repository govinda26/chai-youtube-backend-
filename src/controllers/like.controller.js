import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  //get video id from params
  const { videoId } = req.params;

  //check if video exists
  const like = await Like.find({
    video: new mongoose.Types.ObjectId(videoId),
    likedBy: req.user?._id,
  });
  if (!like) {
    throw new ApiError(
      500,
      "Something went wrong while fetching like information"
    );
  }

  //delete if exists or create if not exists
  if (like.length === 0) {
    //create like
    await Like.create({
      video: new mongoose.Types.ObjectId(videoId),
      likedBy: req.user?._id,
    });

    //return
    return res
      .status(200)
      .json(new ApiResponse(201, { isLiked: true }, "Video Liked"));
  } else {
    //delete like
    await Like.deleteOne({ video: videoId, likedBy: req.user?._id });

    //return
    return res
      .status(200)
      .json(new ApiResponse(200, { isLiked: false }, "Video Unliked"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on comment
  const { commentId } = req.params;

  //check if video exists
  const like = await Like.find({
    video: new mongoose.Types.ObjectId(commentId),
    likedBy: req.user?._id,
  });
  if (!like) {
    throw new ApiError(
      500,
      "Something went wrong while fetching like information"
    );
  }

  //delete if exists or create if not exists
  if (like.length === 0) {
    //create like
    await Like.create({
      comment: new mongoose.Types.ObjectId(commentId),
      likedBy: req.user?._id,
    });

    //return
    return res
      .status(200)
      .json(new ApiResponse(201, { isLiked: true }, "Comment Liked"));
  } else {
    //delete like
    await Like.deleteOne({ comment: commentId, likedBy: req.user?._id });

    //return
    return res
      .status(200)
      .json(new ApiResponse(200, { isLiked: false }, "Comment Unliked"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on tweet
  const { tweetId } = req.params;

  //add tweet id to like
  const like = await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (!like) {
    throw new ApiError(500, "Something went wrong while liking the video");
  }

  //return
  return res.status(200).json(new ApiResponse(201, { like }, "Video Liked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const like = await Like.aggregate([
    {
      $match: {
        //get only user documents liked by user
        likedBy: req.user?._id,
      },
    },
    {
      //left outer join video id from likes to videos
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "result",
      },
    },
    {
      //remove empty result so that we can have inner join
      $match: {
        result: {
          $ne: [],
        },
      },
    },
    {
      $project: {
        result: 1,
      },
    },
    {
      // changes array to object
      $unwind: "$result",
    },
    {
      //removes everything except for result object
      $replaceRoot: {
        newRoot: "$result",
      },
    },
  ]);

  if (!like.length) {
    throw new ApiError(500, "No liked videos found for this user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, like, "Liked Videos Fetched Successfully"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
