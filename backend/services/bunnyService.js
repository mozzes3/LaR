const axios = require("axios");
const crypto = require("crypto");
const FormData = require("form-data");

class BunnyService {
  constructor() {
    this.storagePasswords = {
      avatars: process.env.BUNNY_STORAGE_PASSWORD_AVATARS,
      thumbnails: process.env.BUNNY_STORAGE_PASSWORD_THUMBNAILS,
      videos: process.env.BUNNY_STORAGE_PASSWORD_VIDEOS,
      resources: process.env.BUNNY_STORAGE_PASSWORD_RESOURCES,
    };

    this.zoneNames = {
      avatars: process.env.BUNNY_ZONE_AVATARS,
      thumbnails: process.env.BUNNY_ZONE_THUMBNAILS,
      videos: process.env.BUNNY_ZONE_VIDEOS,
      resources: process.env.BUNNY_ZONE_RESOURCES,
    };

    this.cdnUrls = {
      avatars: process.env.BUNNY_CDN_AVATARS,
      thumbnails: process.env.BUNNY_CDN_THUMBNAILS,
      videos: process.env.BUNNY_CDN_VIDEOS,
      resources: process.env.BUNNY_CDN_RESOURCES,
    };

    this.tokenKeys = {
      videos: process.env.BUNNY_TOKEN_KEY_VIDEOS,
      resources: process.env.BUNNY_TOKEN_KEY_RESOURCES,
    };

    this.videoLibraryId = process.env.BUNNY_VIDEO_LIBRARY_ID;
    this.videoApiKey = process.env.BUNNY_VIDEO_API_KEY;
    this.tokenExpiry = parseInt(process.env.BUNNY_VIDEO_TOKEN_EXPIRY) || 14400;
  }

  /**
   * Upload file to Bunny Storage
   */
  async uploadToStorage(zone, filePath, fileBuffer, contentType) {
    try {
      const password = this.storagePasswords[zone];
      const zoneName = this.zoneNames[zone];

      if (!password || !zoneName) {
        throw new Error(`Invalid storage zone: ${zone}`);
      }

      const url = `https://storage.bunnycdn.com/${zoneName}/${filePath}`;

      const response = await axios.put(url, fileBuffer, {
        headers: {
          AccessKey: password,
          "Content-Type": contentType || "application/octet-stream",
        },
      });

      if (response.status === 201) {
        const publicUrl = `${this.cdnUrls[zone]}/${filePath}`;
        return {
          success: true,
          url: publicUrl,
          path: filePath,
        };
      }

      throw new Error("Upload failed");
    } catch (error) {
      console.error(
        "Bunny upload error:",
        error.response?.data || error.message
      );
      throw new Error(`Failed to upload to ${zone}: ${error.message}`);
    }
  }

  /**
   * Delete file from Bunny Storage
   */
  async deleteFromStorage(zone, filePath) {
    try {
      const password = this.storagePasswords[zone];
      const zoneName = this.zoneNames[zone];

      const url = `https://storage.bunnycdn.com/${zoneName}/${filePath}`;

      await axios.delete(url, {
        headers: {
          AccessKey: password,
        },
      });

      return { success: true };
    } catch (error) {
      console.error(
        "Bunny delete error:",
        error.response?.data || error.message
      );
      throw new Error(`Failed to delete from ${zone}: ${error.message}`);
    }
  }

  /**
   * Delete file by URL (convenience method)
   */
  async deleteFile(zone, url) {
    try {
      if (!url) {
        console.log(`⚠️ No URL provided for deletion`);
        return { success: true };
      }

      const filePath = this.extractPathFromUrl(zone, url);

      if (!filePath) {
        console.log(`⚠️ Could not extract path from URL: ${url}`);
        return { success: true };
      }

      console.log(`🗑️ Deleting ${zone} file: ${filePath}`);

      return await this.deleteFromStorage(zone, filePath);
    } catch (error) {
      console.error(`Delete file error:`, error.message);
      throw error;
    }
  }

  /**
   * Upload video to Bunny Video Library (for streaming)
   */
  async uploadVideo(title, fileBuffer) {
    try {
      // Step 1: Create video in library
      const createResponse = await axios.post(
        `https://video.bunnycdn.com/library/${this.videoLibraryId}/videos`,
        { title },
        {
          headers: {
            AccessKey: this.videoApiKey,
            "Content-Type": "application/json",
          },
        }
      );

      const videoId = createResponse.data.guid;

      // Step 2: Upload video file
      await axios.put(
        `https://video.bunnycdn.com/library/${this.videoLibraryId}/videos/${videoId}`,
        fileBuffer,
        {
          headers: {
            AccessKey: this.videoApiKey,
            "Content-Type": "application/octet-stream",
          },
        }
      );

      return {
        success: true,
        videoId,
        libraryId: this.videoLibraryId,
      };
    } catch (error) {
      console.error(
        "Bunny video upload error:",
        error.response?.data || error.message
      );
      throw new Error(`Failed to upload video: ${error.message}`);
    }
  }

  /**
   * Delete video from Bunny Video Library
   */
  async deleteVideo(videoId) {
    try {
      await axios.delete(
        `https://video.bunnycdn.com/library/${this.videoLibraryId}/videos/${videoId}`,
        {
          headers: {
            AccessKey: this.videoApiKey,
          },
        }
      );

      return { success: true };
    } catch (error) {
      console.error(
        "Bunny video delete error:",
        error.response?.data || error.message
      );
      throw new Error(`Failed to delete video: ${error.message}`);
    }
  }

  /**
   * Extract file path from CDN URL
   */
  extractPathFromUrl(zone, url) {
    if (!url || typeof url !== "string") return null;

    const cdnUrl = this.cdnUrls[zone];
    if (!cdnUrl || !url.includes(cdnUrl)) return null;

    const urlParts = url.split(cdnUrl + "/");
    return urlParts[1] || null;
  }

  /**
   * Delete old file and upload new one (atomic operation)
   */
  async replaceFile(zone, oldUrl, newFilePath, fileBuffer, contentType) {
    try {
      // Upload new file first
      const uploadResult = await this.uploadToStorage(
        zone,
        newFilePath,
        fileBuffer,
        contentType
      );

      // Delete old file if exists
      if (oldUrl) {
        const oldPath = this.extractPathFromUrl(zone, oldUrl);
        if (oldPath) {
          try {
            await this.deleteFromStorage(zone, oldPath);
            console.log(`🗑️ Deleted old ${zone} file: ${oldPath}`);
          } catch (deleteError) {
            console.error(
              `Warning: Could not delete old ${zone} file:`,
              deleteError.message
            );
            // Don't fail the upload if deletion fails
          }
        }
      }

      return uploadResult;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate signed URL for token-protected content
   */
  generateSignedUrl(zone, path, expiresIn = null) {
    const tokenKey = this.tokenKeys[zone];
    const baseUrl = this.cdnUrls[zone];

    if (!tokenKey) {
      throw new Error(`Token key not configured for zone: ${zone}`);
    }

    const expires =
      Math.floor(Date.now() / 1000) + (expiresIn || this.tokenExpiry);
    const signaturePath = path;

    // Generate token hash
    const hashableBase = `${tokenKey}${signaturePath}${expires}`;
    const token = crypto
      .createHash("sha256")
      .update(hashableBase)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    return `${baseUrl}/${path}?token=${token}&expires=${expires}`;
  }

  /**
   * Get video information including duration
   */
  async getVideoInfo(videoId) {
    try {
      console.log(`📹 Getting video info for: ${videoId}`);

      const response = await axios.get(
        `https://video.bunnycdn.com/library/${this.videoLibraryId}/videos/${videoId}`,
        {
          headers: {
            AccessKey: this.videoApiKey,
          },
        }
      );

      const video = response.data;

      console.log(
        `✅ Video info: ${video.title}, Duration: ${video.length}s, Status: ${video.status}`
      );

      return {
        videoId: video.guid,
        title: video.title,
        duration: video.length, // Duration in seconds
        status: video.status, // 0=queued, 1=processing, 2=encoding, 3=finished, 4=failed
        thumbnailUrl: video.thumbnailFileName
          ? `https://vz-${video.videoLibraryId}.b-cdn.net/${video.guid}/${video.thumbnailFileName}`
          : null,
      };
    } catch (error) {
      console.error(
        "❌ Error getting video info:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Generate signed video URL for Bunny Stream embed player
   */
  generateVideoUrl(videoId, expiresIn = null) {
    const expires =
      Math.floor(Date.now() / 1000) + (expiresIn || this.tokenExpiry);

    const tokenKey = this.tokenKeys?.videos;

    if (!tokenKey) {
      throw new Error(
        "Video token key (BUNNY_TOKEN_KEY_VIDEOS) not configured"
      );
    }

    console.log(`🎬 Generating signed URL for video: ${videoId}`);
    console.log(`🔑 Token key: ${tokenKey.substring(0, 10)}...`);
    console.log(
      `📅 Expires: ${expires} (${new Date(expires * 1000).toISOString()})`
    );

    // Bunny Stream token format: SHA256(tokenKey + videoId + expires)
    const hashInput = `${tokenKey}${videoId}${expires}`;

    console.log(`🔐 Hash input: [tokenKey]${videoId}${expires}`);

    const token = crypto.createHash("sha256").update(hashInput).digest("hex");

    console.log(`✅ Generated token: ${token}`);

    // URL with completely disabled analytics and autoplay
    const url = `https://iframe.mediadelivery.net/embed/${this.videoLibraryId}/${videoId}?token=${token}&expires=${expires}&disableanalytics=true&preload=true&autoplay=false&loop=false`;

    return url;
  }
  /**
   * Get video info
   */
  async getVideoInfo(videoId) {
    try {
      console.log(`📹 Getting video info for: ${videoId}`);

      const response = await axios.get(
        `https://video.bunnycdn.com/library/${this.videoLibraryId}/videos/${videoId}`,
        {
          headers: {
            AccessKey: this.videoApiKey,
          },
        }
      );

      const video = response.data;

      console.log(
        `✅ Video info: ${video.title}, Duration: ${video.length}s, Status: ${video.status}`
      );

      return {
        videoId: video.guid,
        title: video.title,
        duration: video.length, // Duration in seconds
        status: video.status, // 0=queued, 1=processing, 2=encoding, 3=finished, 4=failed
        thumbnailUrl: video.thumbnailFileName
          ? `https://vz-${video.videoLibraryId}.b-cdn.net/${video.guid}/${video.thumbnailFileName}`
          : null,
      };
    } catch (error) {
      console.error(
        "❌ Error getting video info:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

module.exports = new BunnyService();
