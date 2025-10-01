import mongoose, { isValidObjectId, Mongoose, Types } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  //get playlist name and description from user
  const { name, description } = req.body;
  if (!(name || description)) {
    throw new ApiError(400, "Name and description is a required field");
  }

  //add the above data inside the document
  const playlist = await Playlist.create({
    name: name,
    description: description,
    owner: req.user?._id,
  });
  if (!playlist) {
    throw new ApiError(500, "Something went wrong while creating playlist");
  }

  //return
  return res
    .status(200)
    .json(new ApiResponse(201, playlist, "Playlist Created"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists

  //get user id from params
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  //find playlist using user id
  const playlist = await Playlist.find({ owner: userId });
  if (!playlist) {
    throw new ApiError(500, "Something went wrong while fetching playlist");
  }

  //return
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched Successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  //get playlist id from params
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, "Playlist id is required");
  }

  //find playlist using user id
  const playlist = await Playlist.find({ _id: playlistId });
  if (!playlist) {
    throw new ApiError(500, "Something went wrong while fetching playlist");
  }

  //return
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched Successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  //get playlist and video id from params
  const { playlistId, videoId } = req.params;

  //converting videoId into ObjectId
  const newVideoId = new mongoose.Types.ObjectId(videoId);

  //add it inside videos array
  const playlist = await Playlist.updateOne(
    { _id: playlistId },
    { $push: { videos: newVideoId } }
  );
  if (!playlist) {
    throw new ApiError(
      500,
      "Something went wrong while pushing video inside the playlist"
    );
  }

  //return
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  //get playlistId and videoId from user
  const { playlistId, videoId } = req.params;

  //converting videoId into ObjectId
  const newVideoId = new mongoose.Types.ObjectId(videoId);

  //add it inside videos array
  const playlist = await Playlist.updateOne(
    { _id: playlistId },
    { $pull: { videos: newVideoId } }
  );
  if (!playlist) {
    throw new ApiError(
      500,
      "Something went wrong while deleting video from playlist"
    );
  }

  //return
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video removed from playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist

  //get playlist id from params
  const { playlistId } = req.params;

  //delete playlist
  const playlist = await Playlist.deleteOne({ _id: playlistId });
  if (!playlist) {
    throw new ApiError(500, "Something went wrong while deleting playlist");
  }

  //return
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted Successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  //TODO: update playlist

  //get new details
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!(name || description)) {
    throw new ApiError(400, "Name and description are required field ");
  }

  //update playlist details
  const playlist = await Playlist.findByIdAndUpdate(
    { _id: playlistId },
    {
      $set: {
        name: name,
        description: description,
      },
    },
    { new: true }
  );
  if (!playlist) {
    throw new ApiError(
      500,
      "Something went wrong while updating playlist details"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated Successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
