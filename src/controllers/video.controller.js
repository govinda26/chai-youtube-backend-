import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteOnCloudinary,
  deleteVideoOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  // TODO: get all videos based on query, sort, pagination
  //get page number and limit
  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);

  //sort video in asc or dsc
  let sortVideos;
  if (sortType === "asc") {
    //asc
    sortVideos = 1;
  } else {
    //dsc
    sortVideos = -1;
  }

  const pipeline = [];

  //get videos with userId
  const matchStage = { owner: new mongoose.Types.ObjectId(userId) };

  //if query is given by user
  if (query) {
    matchStage.$text = { $search: query };
  }

  //push $match into pipeline
  pipeline.push({ $match: matchStage });
  pipeline.push({
    $facet: {
      //total videos using $count
      totalCount: [{ $count: "total" }],
      //pagination
      videos: [
        {
          //sort by most viwed video
          $sort: { [sortBy]: sortVideos },
        },
        { $skip: (pageNumber - 1) * pageSize },
        { $limit: pageSize },
      ],
    },
  });

  //aggregate query
  const videos = await Video.aggregate(pipeline);

  //return statement
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched Successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video
  //accept video, thumbnail, title and description from user
  const { title, description } = req.body;

  //validate if received or not
  //.some returns true if element inside the array satisfies the condition ie empty and thus if statement continues
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are compulsory and required");
  }

  //check for video and thumbnail
  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (!(videoLocalPath && thumbnailLocalPath)) {
    throw new ApiError(400, "Video and thumbnail are a required file");
  }

  //upload video and thumbnail on cloudinary
  const video = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!(video && thumbnail)) {
    throw new ApiError(
      400,
      "Video or thumbnail are not available in local path"
    );
  }

  //add the above inside video object and push it inside db
  const { duration, public_id, url } = video;
  const videoObj = await Video.create({
    videoFile: url,
    videoPublicId: public_id,
    duration: duration,
    thumbnail: thumbnail.url,
    thumbnailPublicId: thumbnail.public_id,
    title,
    description,
    owner: new mongoose.Types.ObjectId(req.user?._id),
  });

  //check for created video document
  const createdVideo = await Video.findById(videoObj._id);
  if (!createdVideo) {
    throw new ApiError("Something went wrong while uploading video");
  }

  //return
  return res
    .status(201)
    .json(new ApiResponse(200, createdVideo, "Video Uploaded Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  //TODO: get video by id
  //get video id from params
  const { videoId } = req.params;

  //search in db using id
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError("Video not found");
  }

  //return
  return res.status(200).json(new ApiResponse(201, video, "Video found"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  //get video id from params
  const { videoId } = req.params;

  //get new title , description and thumbnail
  const { title, description } = req.body;
  const thumbnailLocalPath = req.file.path;
  if (!thumbnailLocalPath) {
    throw new ApiError("Thumbnail is a required field");
  }

  //deleting old thumbnail from cloudinary
  const oldUser = await Video.findById(videoId);
  const oldThumbnail = await deleteOnCloudinary(oldUser.thumbnailPublicId);
  if (!oldThumbnail) {
    throw new ApiError(400, "Error while deleting Thumbnail");
  }

  //uplaoding new thumbnail
  const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!newThumbnail) {
    throw new ApiError(400, "Thumbnail not available in local path");
  }

  //updating video document
  const { url, public_id } = newThumbnail;
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: url,
        thumbnailPublicId: public_id,
      },
    },
    { new: true }
  );
  if (!video) {
    throw new ApiError(400, "Error while updating video");
  }

  //return
  return res
    .status(200)
    .json(new ApiResponse(201, video, "Video updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  //get video id from params
  const { videoId } = req.params;

  //get public id for video and thumbnail
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video does not exists");
  }
  const { videoPublicId, thumbnailPublicId } = video;

  //delete video and thumbnail from cloudinary
  const oldVideo = await deleteVideoOnCloudinary(videoPublicId);
  const oldThumbnail = await deleteOnCloudinary(thumbnailPublicId);
  if (!(oldVideo || oldThumbnail)) {
    throw new ApiError(400, "Error while deleting video and thumbnail");
  }

  //delete it from db
  const deletedVideo = await Video.deleteOne({ _id: videoId });
  if (!deletedVideo) {
    throw new ApiError(500, "Something went wrong while deleting video");
  }

  //return
  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Video deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  //check what state is the video right now
  // const video = await Video.findById(videoId);
  // if (!video) {
  //   throw new ApiError(404, "Video does not exists");
  // }

  // const publishStatus = video.isPublished;
  // console.log(publishStatus);

  //if it is published then unpublished or vice versa
  // const newStatus = await Video.findByIdAndUpdate(
  //   videoId,
  //   {
  //     $set: {
  //       isPublished: !publishStatus,
  //     },
  //   },
  //   { new: true }
  // );

  const video = await Video.findByIdAndUpdate(
    videoId,
    [
      {
        $set: {
          isPublished: {
            $not: "$isPublished",
          },
        },
      },
    ],
    { new: true }
  );

  if (!video) {
    throw new ApiError(404, "Video does not exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Publish Status Updated"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
