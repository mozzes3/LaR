const bunnyService = require("../config/bunny");
const fs = require("fs").promises;
const path = require("path");

class VideoService {
  async uploadVideo(fileBuffer, fileName, title) {
    try {
      const tempDir = path.join(__dirname, "../temp");
      await fs.mkdir(tempDir, { recursive: true });

      const tempPath = path.join(tempDir, fileName);
      await fs.writeFile(tempPath, fileBuffer);

      const videoData = await bunnyService.uploadVideo(
        tempPath,
        fileName,
        title
      );

      await fs.unlink(tempPath);

      return videoData;
    } catch (error) {
      console.error("Video upload error:", error);
      throw new Error("Failed to upload video");
    }
  }

  async uploadImage(fileBuffer, fileName) {
    try {
      const tempDir = path.join(__dirname, "../temp");
      await fs.mkdir(tempDir, { recursive: true });

      const tempPath = path.join(tempDir, fileName);
      await fs.writeFile(tempPath, fileBuffer);

      const imageUrl = await bunnyService.uploadImage(tempPath, fileName);

      await fs.unlink(tempPath);

      return imageUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      throw new Error("Failed to upload image");
    }
  }

  async deleteVideo(videoId) {
    try {
      await bunnyService.deleteVideo(videoId);
    } catch (error) {
      console.error("Video deletion error:", error);
      throw new Error("Failed to delete video");
    }
  }
}

module.exports = new VideoService();
