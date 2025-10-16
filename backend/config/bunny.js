const axios = require("axios");
const FormData = require("form-data");

class BunnyService {
  constructor() {
    this.storageZone = process.env.BUNNY_STORAGE_ZONE;
    this.apiKey = process.env.BUNNY_API_KEY;
    this.videoLibraryId = process.env.BUNNY_VIDEO_LIBRARY_ID;
    this.cdnUrl = process.env.BUNNY_CDN_URL;
  }

  // Upload video to Bunny Stream
  async uploadVideo(filePath, fileName, title) {
    try {
      const fs = require("fs");
      const videoStream = fs.createReadStream(filePath);

      // Create video in Bunny Stream
      const createResponse = await axios.post(
        `https://video.bunnycdn.com/library/${this.videoLibraryId}/videos`,
        { title },
        {
          headers: {
            AccessKey: this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      const videoId = createResponse.data.guid;

      // Upload video file
      await axios.put(
        `https://video.bunnycdn.com/library/${this.videoLibraryId}/videos/${videoId}`,
        videoStream,
        {
          headers: {
            AccessKey: this.apiKey,
            "Content-Type": "application/octet-stream",
          },
        }
      );

      return {
        videoId,
        playbackUrl: `https://iframe.mediadelivery.net/embed/${this.videoLibraryId}/${videoId}`,
        thumbnailUrl: `https://vz-${this.storageZone}.b-cdn.net/${videoId}/thumbnail.jpg`,
      };
    } catch (error) {
      console.error(
        "Bunny upload error:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Upload thumbnail/image to Bunny Storage
  async uploadImage(filePath, fileName) {
    try {
      const fs = require("fs");
      const fileStream = fs.createReadStream(filePath);

      await axios.put(
        `https://storage.bunnycdn.com/${this.storageZone}/images/${fileName}`,
        fileStream,
        {
          headers: {
            AccessKey: this.apiKey,
            "Content-Type": "application/octet-stream",
          },
        }
      );

      return `${this.cdnUrl}/images/${fileName}`;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    }
  }

  // Delete video
  async deleteVideo(videoId) {
    try {
      await axios.delete(
        `https://video.bunnycdn.com/library/${this.videoLibraryId}/videos/${videoId}`,
        {
          headers: {
            AccessKey: this.apiKey,
          },
        }
      );
      return true;
    } catch (error) {
      console.error("Delete video error:", error);
      throw error;
    }
  }
}

module.exports = new BunnyService();
