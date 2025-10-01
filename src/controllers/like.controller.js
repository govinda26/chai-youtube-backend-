import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  //get video id from params
  const { videoId } = req.params;

  //check if someone has liked the video
  const likeExists = await Like.find({
    video: {
      $exists: true,
      $eq: videoId,
    },
  });

  if (likeExists.length === 0) {
    //if empty then update document
    const likeVideo = await Like.create(
      {
        video: videoId,
        likedBy: req.user?._id,
      },
      { new: true }
    );

    console.log(likeVideo);
  } else {
    //if someone has liked then unlike
    const unLikeVideo = await Like.findByIdAndUpdate(
      { video: videoId },
      {
        $unset: {
          video: 1,
          likedBy: 1,
        },
      },
      { new: true }
    );

    console.log(unLikeVideo);
  }

  // //add video id to like
  // const like = await Like.create({
  //   video: videoId,
  //   likedBy: req.user?._id,
  // });

  // if (like) {
  //   const unlike = await Like.deleteOne({video:videoId})
  // }

  // //return
  // return res.status(200).json(new ApiResponse(201, { like }, "Video Liked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on comment
  const { commentId } = req.params;

  //add comment id to like
  const like = await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (!like) {
    throw new ApiError(500, "Something went wrong while liking the comment");
  }

  //return
  return res.status(200).json(new ApiResponse(201, { like }, "Comment Liked"));
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
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
