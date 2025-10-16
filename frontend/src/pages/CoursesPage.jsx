import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Star, Clock, Users } from "lucide-react";
import { courseApi } from "@services/api";
import toast from "react-hot-toast";

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    level: "",
    search: "",
  });

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data } = await courseApi.getAll(filters);
      setCourses(data.courses);
    } catch (error) {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Explore <span className="text-gradient">Web3 Courses</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Master NFTs, DeFi, Smart Contracts, and more from industry experts
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search courses..."
              className="input pl-10"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>

          <select
            className="input md:w-48"
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          >
            <option value="">All Categories</option>
            <option value="NFT Creation">NFT Creation</option>
            <option value="Smart Contracts">Smart Contracts</option>
            <option value="Marketing">Marketing</option>
            <option value="Community Building">Community Building</option>
            <option value="DeFi">DeFi</option>
            <option value="Web3 Development">Web3 Development</option>
          </select>

          <select
            className="input md:w-48"
            value={filters.level}
            onChange={(e) => setFilters({ ...filters, level: e.target.value })}
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No courses found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CourseCard = ({ course }) => {
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Link
      to={`/courses/${course.slug}`}
      className="card-hover overflow-hidden group"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
        />
        <div className="absolute top-4 right-4">
          <span className="badge badge-primary">{course.category}</span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 group-hover:text-primary-400 transition">
          {course.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {course.subtitle || course.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-primary-400 fill-current" />
            <span>{course.averageRating.toFixed(1)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{course.enrollmentCount} students</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(course.totalDuration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={
                course.instructor.avatar ||
                `https://ui-avatars.com/api/?name=${course.instructor.username}`
              }
              alt={course.instructor.username}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm font-medium">
              {course.instructor.username}
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-400">
              ${course.price.usd}
            </div>
            <div className="text-xs text-gray-500">
              or {course.price.fdr} $FDR
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CoursesPage;
