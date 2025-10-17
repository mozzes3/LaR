const bunnyService = require("./bunnyService");

class VideoService {
  /**
   * Upload video and return signed streaming URL
   */
  async uploadVideo(title, fileBuffer) {
    return await bunnyService.uploadVideo(title, fileBuffer);
  }

  /**
   * Delete video
   */
  async deleteVideo(videoId) {
    return await bunnyService.deleteVideo(videoId);
  }

  /**
   * Get signed video URL for playback (token-gated)
   */
  getSignedVideoUrl(videoId, expiresIn = 14400) {
    return bunnyService.generateVideoUrl(videoId, expiresIn);
  }

  /**
   * Get video info
   */
  async getVideoInfo(videoId) {
    return await bunnyService.getVideoInfo(videoId);
  }
}

module.exports = new VideoService();
