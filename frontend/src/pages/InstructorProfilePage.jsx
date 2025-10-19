import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
// import { userApi, courseApi } from "@services/api"; // In a real app, these would be used
import { useWallet } from "@contexts/WalletContext";
import toast from "react-hot-toast";
import { userApi, courseApi } from "@services/api";
import {
  Award,
  Star,
  Users,
  BookOpen,
  Globe,
  Twitter,
  Linkedin,
  Github,
  CheckCircle,
  TrendingUp,
  Play,
  Clock,
  BarChart3,
  MessageSquare,
  Shield,
  Sparkles,
  Zap,
  Trophy,
  Settings,
  ArrowLeft,
} from "lucide-react";

const InstructorProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useWallet();
  const [instructor, setInstructor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("courses");

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const loadInstructorProfile = async () => {
      try {
        setLoading(true);

        // Load instructor profile
        const profileResponse = await userApi.getProfile(username);
        const instructorData = profileResponse.data.user;

        console.log("👨‍🏫 Instructor data:", instructorData);

        if (!instructorData.isInstructor) {
          toast.error("This user is not an instructor");
          navigate("/courses");
          return;
        }

        // Load instructor's courses and stats in parallel for performance
        const [coursesResponse, statsResponse] = await Promise.all([
          courseApi.getByInstructor(instructorData.username),
          userApi.getInstructorStats(instructorData.username),
        ]);

        console.log("📚 Instructor courses:", coursesResponse.data.courses);
        console.log("📊 Instructor stats:", statsResponse.data.stats);

        setCourses(coursesResponse.data.courses || []);

        // Set instructor with REAL calculated stats from backend
        setInstructor({
          ...instructorData,
          ...statsResponse.data.stats, // Overwrite with accurate stats
        });

        setLoading(false);
      } catch (error) {
        console.error("Error loading instructor profile:", error);
        toast.error("Failed to load instructor profile");
        setLoading(false);
      }
    };

    loadInstructorProfile();
  }, [username, navigate]);

  const getBadgeIcon = (badge) => {
    switch (badge?.toLowerCase()) {
      case "kol":
        return <Sparkles className="w-4 h-4" />;
      case "professional":
        return <Shield className="w-4 h-4" />;
      case "expert":
        return <Trophy className="w-4 h-4" />;
      case "creator":
        return <Zap className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  const getBadgeColors = (badge) => {
    switch (badge?.toLowerCase()) {
      case "kol":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "professional":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "expert":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "creator":
        return "bg-primary-400/10 text-primary-400 border-primary-400/30";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading instructor profile...
          </p>
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Instructor not found</h2>
          <Link
            to="/courses"
            className="text-primary-400 hover:text-primary-500"
          >
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
      <div className="container-custom max-w-6xl">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-purple-500 to-primary-400"></div>

          {/* Profile Info */}
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
              {/* Avatar */}
              <div className="relative -mt-24 mb-4 md:mb-0">
                <img
                  src={
                    instructor.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${instructor.username}`
                  }
                  alt={instructor.displayName || instructor.username}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 object-cover"
                />
                {instructor.instructorVerified && (
                  <div className="absolute bottom-0 right-0 w-10 h-10 bg-primary-400 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900">
                    <CheckCircle className="w-6 h-6 text-black" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {instructor.displayName || instructor.username}
                      </h1>
                      {instructor.instructorVerified && (
                        <Award className="w-6 h-6 text-primary-400" />
                      )}
                      {instructor.badge && (
                        <div
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-bold border ${getBadgeColors(
                            instructor.badge
                          )}`}
                        >
                          {getBadgeIcon(instructor.badge)}
                          <span>{instructor.badge}</span>
                        </div>
                      )}
                    </div>
                    {instructor.displayName &&
                      instructor.displayName !== instructor.username && (
                        <p className="text-sm text-gray-500 mb-2">
                          @{instructor.username}
                        </p>
                      )}
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                      {instructor.instructorBio ||
                        instructor.bio ||
                        "No bio yet"}
                    </p>
                  </div>

                  {isOwnProfile && (
                    <Link
                      to="/instructor/dashboard"
                      className="mt-4 md:mt-0 px-6 py-3 bg-primary-400 text-black rounded-xl font-medium hover:bg-primary-500 transition"
                    >
                      Dashboard
                    </Link>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {instructor.totalStudents?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-500">Students</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <BookOpen className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {instructor.totalCoursesCreated || courses.length}
                    </div>
                    <div className="text-sm text-gray-500">Courses</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {instructor.averageRating?.toFixed(1) || "0.0"}
                    </div>
                    <div className="text-sm text-gray-500">Rating</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {instructor.totalReviews || 0}
                    </div>
                    <div className="text-sm text-gray-500">Reviews</div>
                  </div>
                </div>

                {/* Expertise Tags */}
                {instructor.expertise && instructor.expertise.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Expertise
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {instructor.expertise.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary-400/10 text-primary-400 rounded-full text-sm font-medium border border-primary-400/20"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {(instructor.socialLinks?.twitter ||
                  instructor.socialLinks?.website ||
                  instructor.socialLinks?.linkedin ||
                  instructor.socialLinks?.github) && (
                  <div className="flex items-center space-x-3">
                    {instructor.socialLinks.website && (
                      <a
                        href={instructor.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                    {instructor.socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${instructor.socialLinks.twitter.replace(
                          "@",
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {instructor.socialLinks.linkedin && (
                      <a
                        href={instructor.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {instructor.socialLinks.github && (
                      <a
                        href={instructor.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                      >
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex space-x-6 px-6 border-b border-gray-200 dark:border-gray-800">
            {["courses", "about"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 font-medium capitalize transition relative ${
                  activeTab === tab
                    ? "text-primary-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
          {activeTab === "courses" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Courses by {instructor.displayName || instructor.username}
              </h2>

              {courses.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <Link
                      key={course._id}
                      to={`/courses/${course.slug}`}
                      className="group border-2 border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:border-primary-400 transition"
                    >
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2 group-hover:text-primary-400 transition line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {course.subtitle}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-bold">
                              {course.averageRating?.toFixed(1) || "0.0"}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({course.totalRatings || 0})
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Users className="w-4 h-4" />
                            <span>{course.enrollmentCount || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {course.totalLessons || 0} lessons
                          </span>
                          <span className="font-bold text-primary-400">
                            ${course.price?.usd || 0}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No courses published yet
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "about" && (
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                About {instructor.displayName || instructor.username}
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {instructor.instructorBio ||
                    instructor.bio ||
                    "This instructor hasn't added a biography yet."}
                </p>
              </div>

              {instructor.expertise && instructor.expertise.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Areas of Expertise
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {instructor.expertise.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <CheckCircle className="w-5 h-5 text-primary-400 flex-shrink-0" />
                        <span className="text-gray-900 dark:text-white">
                          {skill}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorProfilePage;
