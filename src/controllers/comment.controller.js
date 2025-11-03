import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  //get video id from params
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(404, "Video does not exists");
  }

  //get page number and limit from query
  const { page, limit } = req.query;
  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);

  //aggregate query
  const Comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $facet: {
        PageData: [
          {
            $count: "totalCount",
          },
        ],
        Comments: [
          { $skip: (pageNumber - 1) * pageSize },
          //total 50
          //allowed 10
          //page 2 = 3 - 1 * 10
          { $limit: pageSize },
        ],
      },
    },
  ]);
  if (!Comments) {
    throw new ApiError(500, "Something went wrong while getting comments");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        Comments: Comments[0]?.Comments,
        page: page,
        limit: limit,
        totalCount: Comments[0].PageData[0].totalCount,
      },
      "Comments fetched successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  //get comment from user
  const { comment } = req.body;

  if (!comment) {
    throw new ApiError(400, "Comment is required field");
  }

  //get videoId from params
  const { videoId } = req.params;

  //add comment to video document
  const CreatedComment = await Comment.create({
    content: comment,
    video: videoId,
    owner: req.user?._id,
  });

  //return
  return res
    .status(200)
    .json(new ApiResponse(201, CreatedComment, "Comment added"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  //get new comment from user
  const { comment } = req.body;
  if (!comment) {
    throw new ApiError(400, "Comment is a required field");
  }

  //get commentId from params
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(404, "Comment does not exists");
  }

  //update comment
  const updatedComment = await Comment.findByIdAndUpdate(commentId, {
    $set: { content: comment },
  });

  //return
  return res
    .status(200)
    .json(new ApiResponse(201, updatedComment, "Comment updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(404, "Comment does not exists");
  }

  //delete
  const deleteComment = await Comment.findByIdAndDelete(commentId);
  if (!deleteComment) {
    throw new ApiError(500, "Something went wrong while deleting comment");
  }

  //return
  return res.status(200).json(201, {}, "Comment deleted Successfully");
});

export { getVideoComments, addComment, updateComment, deleteComment };
