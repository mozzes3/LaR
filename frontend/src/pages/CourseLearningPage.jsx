import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  CheckCircle,
  Circle,
  Lock,
  Award,
  Download,
  FileText,
  Clock,
  Users,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Bookmark,
  Share2,
  MoreVertical,
  Menu,
  X,
  Sparkles,
  Trophy,
  BookOpen,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react";

const CourseLearningPage = () => {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [completedLessons, setCompletedLessons] = useState([1, 2, 3]); // Use lesson IDs
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [note, setNote] = useState("");
  const [watchTime, setWatchTime] = useState(0);
  const [expandedModules, setExpandedModules] = useState([1]); // Default open first module

  // Mock course data
  const course = {
    id: 1,
    slug: "nft-marketing-masterclass",
    title: "NFT Marketing Masterclass: 0 to 10K Discord Members",
    instructor: {
      username: "CryptoMaverick",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoMaverick",
      verified: true,
      badge: "KOL",
      badgeColor: "purple",
    },
    thumbnail:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=675&fit=crop",
    progress: 25,
    totalLessons: 47,
    completedLessons: 12,
    totalDuration: "12h 30m",
    certificate: true,
    modules: [
      {
        id: 1,
        title: "Getting Started",
        duration: "1h 20m",
        lessons: [
          {
            id: 1,
            title: "Welcome to the Course",
            duration: "5:30",
            type: "video",
            videoUrl: "https://example.com/video1.mp4",
            description: "Introduction to the course and what you'll learn",
            resources: [
              { name: "Course Overview.pdf", size: "2.4 MB" },
              { name: "Resources Guide.pdf", size: "1.8 MB" },
            ],
          },
          {
            id: 2,
            title: "Understanding NFT Communities",
            duration: "12:45",
            type: "video",
            videoUrl: "https://example.com/video2.mp4",
            description: "Deep dive into NFT community dynamics",
            resources: [{ name: "Community Framework.pdf", size: "3.2 MB" }],
          },
          {
            id: 3,
            title: "Setting Up Your Discord Server",
            duration: "18:20",
            type: "video",
            videoUrl: "https://example.com/video3.mp4",
            description: "Step-by-step Discord server setup guide",
            resources: [
              { name: "Discord Setup Checklist.pdf", size: "1.5 MB" },
              { name: "Bot Configuration Guide.pdf", size: "2.1 MB" },
            ],
          },
          {
            id: 4,
            title: "Quiz: Foundation Knowledge",
            duration: "10 questions",
            type: "quiz",
            locked: true,
          },
        ],
      },
      {
        id: 2,
        title: "Marketing Strategies",
        duration: "3h 45m",
        lessons: [
          {
            id: 5,
            title: "Content Strategy for Web3",
            duration: "25:15",
            type: "video",
            locked: true,
          },
          {
            id: 6,
            title: "Twitter Marketing Tactics",
            duration: "30:45",
            type: "video",
            locked: true,
          },
          {
            id: 7,
            title: "Discord Engagement Techniques",
            duration: "22:30",
            type: "video",
            locked: true,
          },
        ],
      },
      {
        id: 3,
        title: "Community Growth",
        duration: "4h 10m",
        lessons: [
          {
            id: 8,
            title: "Organic Growth Strategies",
            duration: "28:50",
            type: "video",
            locked: true,
          },
          {
            id: 9,
            title: "Collaboration & Partnerships",
            duration: "35:20",
            type: "video",
            locked: true,
          },
        ],
      },
    ],
  };

  // **FIX**: Create a flat array of all lessons to simplify logic
  const allLessons = course.modules.flatMap((module) => module.lessons);
  const currentLessonData = allLessons[currentLessonIndex];

  useEffect(() => {
    // Simulate video duration
    setDuration(330); // 5:30 minutes in seconds

    // Track watch time
    const interval = setInterval(() => {
      if (playing) {
        setCurrentTime((prev) => {
          const newTime = prev + 1;
          setWatchTime((prevWatchTime) => prevWatchTime + 1);
          if (newTime >= duration) {
            setPlaying(false);
            return duration;
          }
          return newTime;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [playing, duration]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setCurrentTime(pos * duration);
  };

  const togglePlay = () => setPlaying(!playing);

  const handleNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setCurrentTime(0);
      setPlaying(false);
    }
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setCurrentTime(0);
      setPlaying(false);
    }
  };

  const handleSelectLesson = (lessonId) => {
    const lessonIndex = allLessons.findIndex((l) => l.id === lessonId);
    if (lessonIndex !== -1 && !allLessons[lessonIndex].locked) {
      setCurrentLessonIndex(lessonIndex);
      setCurrentTime(0);
      setPlaying(false);
    }
  };

  const markAsComplete = () => {
    if (!completedLessons.includes(currentLessonData.id)) {
      setCompletedLessons([...completedLessons, currentLessonData.id]);
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const totalWatchPercentage = (
    (watchTime / (course.totalLessons * 330)) *
    100
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/courses/${course.slug}`)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                  {course.title}
                </h1>
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <span>
                    {course.completedLessons} of {course.totalLessons} lessons
                  </span>
                  <span>•</span>
                  <span>{course.progress}% complete</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary-400 transition text-sm font-medium flex items-center space-x-2">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition lg:hidden"
              >
                {showSidebar ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 w-full">
          <div className="bg-black aspect-video relative group">
            <img
              src={course.thumbnail}
              alt={currentLessonData.title}
              className="w-full h-full object-cover"
            />
            {!playing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <button
                  onClick={togglePlay}
                  className="w-20 h-20 bg-primary-400 rounded-full flex items-center justify-center hover:bg-primary-500 transition transform hover:scale-110"
                >
                  <Play className="w-10 h-10 text-black ml-1" />
                </button>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <div
                className="h-1 bg-white/30 rounded-full mb-4 cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-primary-400 rounded-full relative"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePreviousLesson}
                    disabled={currentLessonIndex === 0}
                    className="text-white hover:text-primary-400 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-primary-400 transition"
                  >
                    {playing ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={handleNextLesson}
                    disabled={currentLessonIndex === allLessons.length - 1}
                    className="text-white hover:text-primary-400 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setMuted(!muted)}
                    className="text-white hover:text-primary-400 transition"
                  >
                    {muted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <span className="text-white text-sm font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="text-white hover:text-primary-400 transition text-sm font-medium"
                    >
                      {playbackRate}x
                    </button>
                    {showSpeedMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg p-2 min-w-[80px]">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => {
                              setPlaybackRate(speed);
                              setShowSpeedMenu(false);
                            }}
                            className={`block w-full text-left px-3 py-2 rounded text-sm ${
                              playbackRate === speed
                                ? "bg-primary-400 text-black"
                                : "text-white hover:bg-gray-800"
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="text-white hover:text-primary-400 transition">
                    <Settings className="w-5 h-5" />
                  </button>
                  <button className="text-white hover:text-primary-400 transition">
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {currentLessonData.title}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{currentLessonData.duration}</span>
                  </div>
                  <span>•</span>
                  <span>
                    Lesson {currentLessonIndex + 1} of {allLessons.length}
                  </span>
                </div>
              </div>
              <button
                onClick={markAsComplete}
                className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-2 ${
                  completedLessons.includes(currentLessonData.id)
                    ? "bg-green-500/10 text-green-500 border-2 border-green-500/30"
                    : "bg-primary-400 text-black hover:bg-primary-500"
                }`}
              >
                {completedLessons.includes(currentLessonData.id) ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-5 h-5" />
                    <span>Mark Complete</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.username}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {course.instructor.username}
                  </span>
                  {course.instructor.verified && (
                    <Award className="w-4 h-4 text-primary-400" />
                  )}
                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs font-bold rounded border border-purple-500/30">
                    {course.instructor.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Course Instructor</p>
              </div>
              <button className="px-4 py-2 bg-primary-400 text-black rounded-lg font-bold hover:bg-primary-500 transition text-sm">
                Message
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="flex space-x-6 px-6">
              {[
                { id: "overview", label: "Overview", icon: BookOpen },
                { id: "notes", label: "Notes", icon: FileText },
                { id: "resources", label: "Resources", icon: Download },
                { id: "discussion", label: "Discussion", icon: MessageSquare },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-primary-400 text-primary-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
            {activeTab === "overview" && (
              <div className="max-w-3xl">
                <h3 className="text-xl font-bold mb-4">About this lesson</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  {currentLessonData.description}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      <span className="font-bold text-sm">Your Progress</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-500">
                      {course.progress}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {course.completedLessons} lessons completed
                    </p>
                  </div>
                  <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-5 h-5 text-green-500" />
                      <span className="font-bold text-sm">Watch Time</span>
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                      {totalWatchPercentage}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.floor(watchTime / 60)} minutes watched
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-primary-400/5 border border-primary-400/20 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary-400" />
                    <span className="font-bold">Smart Contract Escrow</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your payment is held in escrow. Watch less than 20% or under
                    120 minutes to be eligible for a full refund within 14 days.
                  </p>
                </div>
              </div>
            )}
            {activeTab === "notes" && (
              <div className="max-w-3xl">
                <h3 className="text-xl font-bold mb-4">Your Notes</h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Take notes while watching..."
                  className="w-full h-64 p-4 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black resize-none focus:border-primary-400 transition"
                />
                <button className="mt-3 px-6 py-2 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition">
                  Save Note
                </button>
              </div>
            )}
            {activeTab === "resources" && (
              <div className="max-w-3xl">
                <h3 className="text-xl font-bold mb-4">
                  Downloadable Resources
                </h3>
                <div className="space-y-3">
                  {currentLessonData.resources?.map((resource, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-400/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {resource.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {resource.size}
                          </p>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-primary-400/10 rounded-lg transition text-primary-400">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "discussion" && (
              <div className="max-w-3xl">
                <h3 className="text-xl font-bold mb-4">Lesson Discussion</h3>
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No discussions yet</p>
                  <button className="mt-4 px-6 py-2 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition">
                    Start Discussion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {showSidebar && (
          <div className="w-full lg:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 lg:sticky lg:top-[89px] lg:h-[calc(100vh-89px)] lg:overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Course Content</h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {course.modules.map((module) => (
                  <div
                    key={module.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full p-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <div className="text-left">
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          {module.title}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {module.lessons.length} lessons • {module.duration}
                        </p>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                          expandedModules.includes(module.id)
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </button>
                    {expandedModules.includes(module.id) && (
                      <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {module.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => handleSelectLesson(lesson.id)}
                            disabled={lesson.locked}
                            className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left ${
                              currentLessonData.id === lesson.id
                                ? "bg-primary-400/10"
                                : ""
                            } ${
                              lesson.locked
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <div className="mt-0.5">
                              {lesson.locked ? (
                                <Lock className="w-5 h-5 text-gray-400" />
                              ) : completedLessons.includes(lesson.id) ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : currentLessonData.id === lesson.id ? (
                                <Play className="w-5 h-5 text-primary-400" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-medium mb-1 ${
                                  currentLessonData.id === lesson.id
                                    ? "text-primary-400"
                                    : "text-gray-900 dark:text-white"
                                }`}
                              >
                                {lesson.title}
                              </p>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span>{lesson.duration}</span>
                                {lesson.type === "quiz" && (
                                  <>
                                    <span>•</span>
                                    <span>Quiz</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {course.certificate && (
                <div className="mt-6 p-4 bg-gradient-to-br from-primary-400/10 to-purple-500/10 border-2 border-primary-400/30 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <Trophy className="w-6 h-6 text-primary-400" />
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        Certificate Progress
                      </h4>
                      <p className="text-sm text-gray-500">
                        {course.progress}% completed
                      </p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-400 to-purple-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseLearningPage;
