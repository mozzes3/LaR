const express = require("express");
const router = express.Router();
const multer = require("multer");
const bunnyService = require("../services/bunnyService");
const { authenticate, isInstructor, isAdmin } = require("../middleware/auth");

// Separate upload configs for different file types
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for images
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB for videos
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only videos are allowed"));
    }
  },
});

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for documents
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, and TXT files are allowed"
        )
      );
    }
  },
});

/**
 * @route   POST /api/upload/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post(
  "/avatar",
  authenticate,
  imageUpload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Validate file size (1MB for avatars)
      if (req.file.size > 1 * 1024 * 1024) {
        return res.status(400).json({ error: "Avatar must be less than 1MB" });
      }

      const User = require("../models/User");

      const user = await User.findById(req.userId);
      const oldAvatar = user.avatar;

      const fileExtension = req.file.originalname.split(".").pop();
      const fileName = `${req.userId}-${Date.now()}.${fileExtension}`;
      const filePath = `avatars/${fileName}`;

      const result = await bunnyService.replaceFile(
        "avatars",
        oldAvatar,
        filePath,
        req.file.buffer,
        req.file.mimetype
      );

      await User.findByIdAndUpdate(req.userId, {
        avatar: result.url,
      });

      res.json({
        success: true,
        url: result.url,
        message: "Avatar uploaded successfully",
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  }
);

router.post(
  "/certification-thumbnail",
  authenticate,
  isAdmin,
  imageUpload.single("thumbnail"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { oldThumbnailUrl } = req.body;
      const axios = require("axios");

      console.log("📸 Starting certification thumbnail upload");
      console.log("📸 Old thumbnail URL:", oldThumbnailUrl);

      // STEP 1: Delete old thumbnail FIRST (before uploading new one)
      if (oldThumbnailUrl && oldThumbnailUrl.trim() !== "") {
        try {
          // Extract file path from old URL
          let oldFilePath = null;

          if (oldThumbnailUrl.includes(process.env.BUNNY_CDN_CONTENTS)) {
            oldFilePath = oldThumbnailUrl.split(
              process.env.BUNNY_CDN_CONTENTS + "/"
            )[1];
          } else if (oldThumbnailUrl.includes("lizard-academy-contents")) {
            const urlParts = oldThumbnailUrl.split(".net/");
            if (urlParts[1]) {
              oldFilePath = urlParts[1];
            }
          }

          if (oldFilePath) {
            console.log("🗑️  Deleting old file:", oldFilePath);

            const deleteUrl = `https://storage.bunnycdn.com/${process.env.BUNNY_ZONE_CONTENTS}/${oldFilePath}`;

            await axios.delete(deleteUrl, {
              headers: {
                AccessKey: process.env.BUNNY_STORAGE_PASSWORD_CONTENTS,
              },
            });

            console.log("✅ Old thumbnail deleted successfully:", oldFilePath);
          } else {
            console.log("⚠️  Could not extract old file path from URL");
          }
        } catch (deleteError) {
          // Don't fail the upload if deletion fails
          console.error(
            "⚠️ Failed to delete old thumbnail:",
            deleteError.message
          );
          if (deleteError.response?.status === 404) {
            console.log(
              "⚠️  Old file not found on CDN (already deleted or doesn't exist)"
            );
          }
        }
      }

      // STEP 2: Upload new thumbnail
      const fileExtension = req.file.originalname.split(".").pop();
      const fileName = `cert-thumb-${Date.now()}.${fileExtension}`;
      const filePath = `certification-thumbnails/${fileName}`;

      const uploadUrl = `https://storage.bunnycdn.com/${process.env.BUNNY_ZONE_CONTENTS}/${filePath}`;

      console.log("📤 Uploading new thumbnail:", fileName);

      await axios.put(uploadUrl, req.file.buffer, {
        headers: {
          AccessKey: process.env.BUNNY_STORAGE_PASSWORD_CONTENTS,
          "Content-Type": req.file.mimetype,
        },
      });

      const cdnUrl = `${process.env.BUNNY_CDN_CONTENTS}/${filePath}`;

      console.log("✅ New thumbnail uploaded successfully:", cdnUrl);

      res.json({
        success: true,
        url: cdnUrl,
        message: "Certification thumbnail uploaded successfully",
      });
    } catch (error) {
      console.error("❌ Certification thumbnail upload error:", error.message);
      console.error("❌ Error response:", error.response?.data);
      res.status(500).json({
        error: error.response?.data?.Message || "Failed to upload thumbnail",
      });
    }
  }
);
/**
 * @route   POST /api/upload/thumbnail
 * @desc    Upload course thumbnail
 * @access  Private (Instructor only)
 */
router.post(
  "/thumbnail",
  authenticate,
  isInstructor,
  imageUpload.single("thumbnail"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { courseSlug, oldThumbnailUrl } = req.body;

      const fileExtension = req.file.originalname.split(".").pop();
      const fileName = `${req.userId}-${Date.now()}.${fileExtension}`;
      const filePath = `thumbnails/${fileName}`;

      const result = await bunnyService.replaceFile(
        "thumbnails",
        oldThumbnailUrl,
        filePath,
        req.file.buffer,
        req.file.mimetype
      );

      if (courseSlug) {
        const Course = require("../models/Course");
        await Course.findOneAndUpdate(
          { slug: courseSlug, instructor: req.userId },
          { thumbnail: result.url }
        );
      }

      res.json({
        success: true,
        url: result.url,
        path: filePath,
        message: "Thumbnail uploaded successfully",
      });
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      res.status(500).json({ error: "Failed to upload thumbnail" });
    }
  }
);

/**
 * @route   POST /api/upload/video
 * @desc    Upload course video to Bunny Video Library
 * @access  Private (Instructor only)
 */
router.post(
  "/video",
  authenticate,
  isInstructor,
  videoUpload.single("video"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { title, oldVideoId, courseSlug } = req.body;

      console.log(`📹 Video upload request received:`);
      console.log(`   Title: ${title}`);
      console.log(`   Old Video ID: ${oldVideoId}`);
      console.log(`   Course Slug: ${courseSlug}`);
      console.log(
        `   File Size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`
      );

      if (!title) {
        return res.status(400).json({ error: "Video title is required" });
      }

      // Delete old video if exists
      if (oldVideoId && oldVideoId !== "null" && oldVideoId !== "undefined") {
        try {
          console.log(`🗑️ Attempting to delete old video: ${oldVideoId}`);
          await bunnyService.deleteVideo(oldVideoId);
          console.log(`✅ Successfully deleted old video: ${oldVideoId}`);
        } catch (deleteError) {
          console.error(
            `❌ Failed to delete old video ${oldVideoId}:`,
            deleteError.message
          );
          // Continue with upload even if deletion fails
        }
      } else {
        console.log(`ℹ️ No old video to delete (oldVideoId: ${oldVideoId})`);
      }

      // Upload new video
      console.log(`📤 Uploading new video to Bunny...`);
      const result = await bunnyService.uploadVideo(title, req.file.buffer);

      console.log(`✅ Video uploaded successfully: ${result.videoId}`);

      res.json({
        success: true,
        videoId: result.videoId,
        libraryId: result.libraryId,
        message: "Video uploaded successfully and is processing",
      });
    } catch (error) {
      console.error("❌ Video upload error:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  }
);

/**
 * @route   GET /api/upload/video/:videoId/url
 * @desc    Get signed video URL for playback
 * @access  Private
 */
router.get("/video/:videoId/url", authenticate, async (req, res) => {
  try {
    const { videoId } = req.params;

    // TODO: Check if user has access to this video (purchased course)
    // For now, generate URL for any authenticated user

    const videoUrl = bunnyService.generateVideoUrl(videoId);

    res.json({
      success: true,
      url: videoUrl,
      expiresIn: bunnyService.tokenExpiry,
    });
  } catch (error) {
    console.error("Get video URL error:", error);
    res.status(500).json({ error: "Failed to generate video URL" });
  }
});

/**
 * @route   GET /api/upload/video/:videoId/info
 * @desc    Get video information
 * @access  Private (Instructor only)
 */
router.get(
  "/video/:videoId/info",
  authenticate,
  isInstructor,
  async (req, res) => {
    try {
      const { videoId } = req.params;

      const videoInfo = await bunnyService.getVideoInfo(videoId);

      res.json({
        success: true,
        video: videoInfo,
      });
    } catch (error) {
      console.error("Get video info error:", error);
      res.status(500).json({ error: "Failed to get video info" });
    }
  }
);

/**
 * @route   DELETE /api/upload/thumbnail
 * @desc    Delete thumbnail from CDN
 * @access  Private (Instructor only)
 */
router.delete("/thumbnail", authenticate, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Thumbnail URL is required" });
    }

    console.log("🗑️ Deleting thumbnail:", url);

    await bunnyService.deleteFile("thumbnails", url);

    res.json({
      success: true,
      message: "Thumbnail deleted successfully",
    });
  } catch (error) {
    console.error("Delete thumbnail error:", error);
    res.status(500).json({ error: "Failed to delete thumbnail" });
  }
});

/**
 * @route   POST /api/upload/resource
 * @desc    Upload course resource (PDF, DOC, etc.)
 * @access  Private (Instructor only)
 */
router.post(
  "/resource",
  authenticate,
  isInstructor,
  documentUpload.single("resource"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileExtension = req.file.originalname.split(".").pop();
      const fileName = `${req.userId}-${Date.now()}.${fileExtension}`;
      const filePath = `resources/${fileName}`;

      // Use replaceFile instead of uploadFile (it handles upload too)
      const result = await bunnyService.replaceFile(
        "resources",
        null, // no old file to replace
        filePath,
        req.file.buffer,
        req.file.mimetype
      );

      res.json({
        success: true,
        url: result.url,
        path: filePath,
        message: "Resource uploaded successfully",
      });
    } catch (error) {
      console.error("Resource upload error:", error);
      res.status(500).json({ error: "Failed to upload resource" });
    }
  }
);

/**
 * @route   DELETE /api/upload/resource
 * @desc    Delete resource from CDN
 * @access  Private (Instructor only)
 */
router.delete("/resource", authenticate, isInstructor, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Resource URL is required" });
    }

    console.log("🗑️ Deleting resource:", url);

    await bunnyService.deleteFile("resources", url);

    res.json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    console.error("Delete resource error:", error);
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

module.exports = router;
