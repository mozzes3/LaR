import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  DollarSign,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Award,
} from "lucide-react";
import { adminApi, adminProfessionalCertificationApi } from "@services/api";
import toast from "react-hot-toast";

const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    pendingCourses: 0,
    pendingReviews: 0,
    pendingApplications: 0,
    flaggedReviews: 0,
    totalCertifications: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [dashboardStats, certStats] = await Promise.all([
        adminApi.getDashboardStats(),
        adminProfessionalCertificationApi.getDashboardStats(),
      ]);

      setStats({
        ...dashboardStats.data.stats,
        totalCertifications: certStats.data.stats.totalCertifications || 0,
      });
    } catch (error) {
      console.error("Load stats error:", error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };
  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "blue",
      link: "/admin/users",
    },

    {
      title: "Total Courses",
      value: stats.totalCourses,
      icon: BookOpen,
      color: "purple",
      link: "/admin/courses",
    },
    {
      title: "Total Purchases",
      value: stats.totalPurchases,
      icon: DollarSign,
      color: "green",
      link: "/admin/purchases",
    },
    {
      title: "Total Revenue",
      value: `${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "orange",
    },
    {
      title: "Pending Applications",
      value: stats.pendingApplications,
      icon: Clock,
      color: "yellow",
      link: "/admin/applications?status=pending",
    },
    {
      title: "Pending Courses",
      value: stats.pendingCourses,
      icon: BookOpen,
      color: "purple",
      link: "/admin/courses?status=pending",
    },
    {
      title: "Pending Reviews",
      value: stats.pendingReviews,
      icon: Star,
      color: "blue",
      link: "/admin/reviews?status=pending",
    },
    {
      title: "Flagged Reviews",
      value: stats.flaggedReviews,
      icon: AlertCircle,
      color: "red",
      link: "/admin/reviews?status=flagged",
    },
    {
      title: "Total Certifications",
      value: stats.totalCertifications || 0,
      icon: Award,
      color: "purple",
      link: "/admin/professional-certifications",
    },
  ];

  const quickActions = [
    {
      title: "Manage Users",
      description: "View and manage all users",
      icon: Users,
      link: "/admin/users",
      color: "blue",
    },

    {
      title: "Manage Roles",
      description: "Configure roles and permissions",
      icon: Shield,
      link: "/admin/roles",
      color: "purple",
    },
    {
      title: "Review Applications",
      description: "Approve instructor applications",
      icon: CheckCircle,
      link: "/admin/applications",
      color: "green",
    },
    {
      title: "Manage Courses",
      description: "Moderate and manage courses",
      icon: BookOpen,
      link: "/admin/courses",
      color: "orange",
    },
    {
      title: "Review Management",
      description: "Moderate course reviews",
      icon: Star,
      link: "/admin/reviews",
      color: "yellow",
    },
    {
      title: "Professional Certifications",
      description: "Manage certification tests",
      icon: Award, // import Award from lucide-react
      link: "/admin/professional-certifications",
      color: "purple",
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      green: "bg-green-500/10 text-green-500 border-green-500/20",
      orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      red: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your platform and monitor activity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const card = (
              <div
                key={index}
                className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-primary-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClasses(
                      stat.color
                    )}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
              </div>
            );

            return stat.link ? (
              <Link key={index} to={stat.link}>
                {card}
              </Link>
            ) : (
              card
            );
          })}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.link}
                  className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:border-primary-500 transition-colors group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${getColorClasses(
                      action.color
                    )}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
