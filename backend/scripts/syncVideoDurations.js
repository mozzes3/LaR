require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Course = require("../models/Course");
const bunnyService = require("../services/bunnyService");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  }
};

const syncVideoDurations = async () => {
  try {
    await connectDB();

    console.log("🔄 Syncing video durations from Bunny...");

    const courses = await Course.find({});
    let updatedCount = 0;

    for (const course of courses) {
      let courseUpdated = false;

      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          if (lesson.videoId) {
            try {
              console.log(`\n📹 Lesson: ${lesson.title}`);
              console.log(`   Video ID: ${lesson.videoId}`);

              const videoInfo = await bunnyService.getVideoInfo(lesson.videoId);

              // ✅ DEBUG: Show full response
              console.log(
                `   Raw response:`,
                JSON.stringify(videoInfo, null, 2)
              );
              console.log(`   Duration field: ${videoInfo.duration}`);
              console.log(`   Length field: ${videoInfo.length}`);

              // Try both 'duration' and 'length' fields
              const duration = videoInfo.duration || videoInfo.length || 0;

              if (duration && duration > 0) {
                lesson.duration = duration;
                console.log(`   ✅ Set duration to: ${duration}s`);
                courseUpdated = true;
                updatedCount++;
              } else {
                console.log(`   ⚠️ No duration available`);
              }
            } catch (error) {
              console.error(`   ❌ Error: ${error.message}`);
              if (error.response) {
                console.error(`   Response:`, error.response.data);
              }
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }

      if (courseUpdated) {
        await course.save();
        console.log(`\n💾 Saved ${course.title}`);
      }
    }

    console.log(`\n🎉 Updated ${updatedCount} video durations!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

syncVideoDurations();
