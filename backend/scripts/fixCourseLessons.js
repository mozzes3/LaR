require("dotenv").config();
const mongoose = require("mongoose");
const Course = require("../models/Course");
const connectDB = require("../config/database");

const fixCourseLessons = async () => {
  try {
    await connectDB();

    console.log("🔧 Fixing course lessons count...");

    const courses = await Course.find({});

    for (const course of courses) {
      let totalLessons = 0;
      let totalDuration = 0;

      course.sections.forEach((section) => {
        totalLessons += section.lessons.length;
        section.lessons.forEach((lesson) => {
          totalDuration += lesson.duration || 0;
        });
      });

      course.totalLessons = totalLessons;
      course.totalDuration = totalDuration;

      await course.save();

      console.log(
        `✅ ${course.title}: ${totalLessons} lessons, ${Math.floor(
          totalDuration / 60
        )} minutes`
      );
    }

    console.log("🎉 All courses fixed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

fixCourseLessons();
