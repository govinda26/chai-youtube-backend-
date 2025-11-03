import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const userTweet = req.query;
  if (!userTweet) {
    throw new ApiError(400, "Enter something inorder to post it");
  }

  const tweet = await Tweet.create({
    content: userTweet?.tweet,
    owner: req.user?._id,
  });

  if (!tweet) {
    throw new ApiError(500, "Something went wrong while uploading the tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet Published Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const tweet = await Tweet.find({
    owner: new mongoose.Types.ObjectId(req.user?._id),
  });
  if (!tweet) {
    throw new ApiError(500, "Something went wrong while fetching user tweets");
  }

  if (!tweet.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(500, {}, "User has not made any tweets"));
  }

  return res
    .status(200)
    .json(new ApiResponse(500, tweet, "User tweets fetched Successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const updatedTweet = req.query;
  if (!updateTweet) {
    throw new ApiError(400, "Updated Tweet is a required field");
  }

  const tweet = await Tweet.updateOne(
    { _id: req.params.tweetId },
    {
      $set: {
        content: req.query.tweet,
      },
    }
  );

  if (!tweet) {
    throw new ApiError(500, "Something went wrong while updating tweet");
  }

  return res.status(200).json(500, {}, "Tweet updated Successfully");
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const tweet = await Tweet.deleteOne({ _id: req.params.tweetId });
  if (!tweet) {
    throw new ApiError(500, "Something went wrong while deleting tweet");
  }

  return res.status(200).json(500, {}, "Tweet deleted Successfully");
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
