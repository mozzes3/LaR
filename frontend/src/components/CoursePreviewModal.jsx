import {
  X,
  Play,
  Clock,
  Star,
  Award,
  Users,
  BookOpen,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom"; // Added for navigation

const CoursePreviewModal = ({ course, onClose }) => {
  const navigate = useNavigate();

  if (!course) return null; // Added a guard clause

  const handleEdit = () => {
    onClose();
    // Assuming the edit route uses the course slug
    navigate(`/instructor/courses/${course.slug}/edit`);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-screen px-4 py-8">
          {/* Modal */}
          <div
            className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-4xl mx-auto border-2 border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Course Header */}
            <div className="relative h-64 rounded-t-2xl overflow-hidden">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="px-3 py-1 bg-primary-400 text-black text-xs font-bold rounded-lg inline-block mb-3">
                  {course.status === "published"
                    ? "Published"
                    : "Draft Preview"}
                </span>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {course.title}
                </h1>
                <div className="flex items-center space-x-4 text-white/90 text-sm">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{course.students || 0} students</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-primary-400 text-primary-400" />
                    <span>{course.rating || "New"}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration || "8h 30m total"}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {course.totalLessons || 47}
                  </div>
                  <div className="text-xs text-gray-500">Lessons</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {course.completionRate || 0}%
                  </div>
                  <div className="text-xs text-gray-500">Completion</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Users className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {course.students || 0}
                  </div>
                  <div className="text-xs text-gray-500">Enrolled</div>
                </div>
              </div>
              {/* Description */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  About This Course
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {course.description ||
                    "This comprehensive course will teach you everything you need to know about building and growing a successful Web3 community. From Discord setup to advanced engagement strategies, you'll learn proven techniques used by top NFT projects."}
                </p>
              </div>
              {/* What You'll Learn */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  What You'll Learn
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {(
                    course.whatYouWillLearn || [
                      "Set up and configure Discord for NFT projects",
                      "Implement effective community engagement strategies",
                      "Grow from 0 to 10,000+ active members",
                      "Create compelling content that drives engagement",
                      "Manage and moderate large communities",
                      "Analyze community metrics and optimize growth",
                    ]
                  ).map((item, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Course Curriculum Preview */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Course Curriculum
                </h3>
                <div className="space-y-2">
                  {(
                    course.modules || [
                      { title: "Getting Started", lessons: 5, duration: "45m" },
                      {
                        title: "Discord Setup & Configuration",
                        lessons: 8,
                        duration: "1h 20m",
                      },
                      {
                        title: "Community Growth Strategies",
                        lessons: 12,
                        duration: "2h 15m",
                      },
                    ]
                  ).map((section, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                          {section.title}
                        </h4>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>{section.lessons} lessons</span>
                          <span>•</span>
                          <span>{section.duration}</span>
                        </div>
                      </div>
                      <Play className="w-5 h-5 text-primary-400" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Instructor Info */}
              <div className="p-4 bg-gradient-to-br from-primary-400/10 to-purple-500/10 border-2 border-primary-400/30 rounded-xl">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                  Your Instructor
                </h3>
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      course.instructor?.avatar ||
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=Default"
                    }
                    alt={course.instructor?.username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {course.instructor?.username || "Your Name"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {course.instructor?.tagline || "Your Tagline"}
                    </p>
                  </div>
                </div>
              </div>
              {/* Notice */}
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-white">
                    Preview Mode:
                  </strong>{" "}
                  This is how your course will appear to students. Make sure all
                  information is accurate before publishing.
                </p>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-medium hover:border-gray-300 transition"
                >
                  Close Preview
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleEdit}
                    className="px-6 py-3 border-2 border-primary-400 text-primary-400 rounded-xl font-bold hover:bg-primary-400/10 transition"
                  >
                    Edit Course
                  </button>
                  {course.status === "draft" && (
                    <button className="px-6 py-3 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-xl transition">
                      Publish Course
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CoursePreviewModal;
