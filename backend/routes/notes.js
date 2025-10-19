const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const Note = require("../models/Note");
const Purchase = require("../models/Purchase");

/**
 * @route   GET /api/notes/:courseId/:lessonId
 * @desc    Get user's notes for a specific lesson
 * @access  Private
 */
router.get("/:courseId/:lessonId", authenticate, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.userId;

    // Verify user has purchased the course
    const purchase = await Purchase.findOne({
      user: userId,
      course: courseId,
      status: "active",
    });

    if (!purchase) {
      return res.status(403).json({ error: "Access denied" });
    }

    const notes = await Note.find({
      user: userId,
      course: courseId,
      lesson: lessonId,
    }).sort({ createdAt: -1 });

    res.json({ success: true, notes });
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ error: "Failed to get notes" });
  }
});

/**
 * @route   POST /api/notes
 * @desc    Create a new note
 * @access  Private
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { courseId, lessonId, content, timestamp } = req.body;
    const userId = req.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Note content is required" });
    }

    // Verify user has purchased the course
    const purchase = await Purchase.findOne({
      user: userId,
      course: courseId,
      status: "active",
    });

    if (!purchase) {
      return res.status(403).json({ error: "Access denied" });
    }

    const note = await Note.create({
      user: userId,
      course: courseId,
      lesson: lessonId,
      content: content.trim(),
      timestamp: timestamp || 0,
    });

    res.status(201).json({ success: true, note });
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

/**
 * @route   PUT /api/notes/:noteId
 * @desc    Update a note
 * @access  Private
 */
router.put("/:noteId", authenticate, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Note content is required" });
    }

    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    if (note.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    note.content = content.trim();
    await note.save();

    res.json({ success: true, note });
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({ error: "Failed to update note" });
  }
});

/**
 * @route   DELETE /api/notes/:noteId
 * @desc    Delete a note
 * @access  Private
 */
router.delete("/:noteId", authenticate, async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.userId;

    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    if (note.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await note.deleteOne();

    res.json({ success: true, message: "Note deleted" });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

module.exports = router;
