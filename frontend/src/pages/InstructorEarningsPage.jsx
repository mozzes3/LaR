import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "@services/api";
import { useWallet } from "@contexts/WalletContext";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Clock,
  Calendar,
  Download,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Users,
  BookOpen,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";

const InstructorEarningsPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useWallet();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    const loadEarningsData = async () => {
      if (!currentUser || !currentUser.isInstructor) {
        toast.error("You must be an instructor to access this page");
        navigate("/");
        return;
      }

      try {
        setLoading(true);

        const [statsResponse, earningsResponse] = await Promise.all([
          userApi.getInstructorDashboardStats(),
          userApi.getInstructorEarningsTransactions(),
        ]);

        setStats(statsResponse.data.stats);
        setEarnings(earningsResponse.data.transactions);
        setLoading(false);
      } catch (error) {
        console.error("Error loading earnings:", error);
        toast.error("Failed to load earnings data");
        setLoading(false);
      }
    };

    loadEarningsData();
  }, [currentUser, navigate]);

  const statCards = stats
    ? [
        {
          label: "Total Earned",
          value: `$${stats.totalEarnings.toLocaleString()}`,
          icon: DollarSign,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          description: "All-time earnings",
        },
        {
          label: "In Escrow",
          value: `$${stats.pendingEarnings.toLocaleString()}`,
          icon: Clock,
          color: "text-orange-500",
          bgColor: "bg-orange-500/10",
          description: "Pending release (30 days)",
        },
        {
          label: "Withdrawn",
          value: `$${stats.availableToWithdraw.toLocaleString()}`,
          icon: CheckCircle,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
          description: "Released from escrow",
        },
        {
          label: "Total Students",
          value: stats.totalStudents.toLocaleString(),
          icon: Users,
          color: "text-purple-500",
          bgColor: "bg-purple-500/10",
          description: "Paying students",
        },
      ]
    : [];

  const filteredEarnings = earnings
    .filter((earning) => {
      if (filter === "all") return true;
      if (filter === "escrow") return earning.status === "escrow";
      if (filter === "released") return earning.status === "released";
      return true;
    })
    .filter((earning) =>
      earning.courseName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === "amount") {
        return b.amount - a.amount;
      }
      return 0;
    });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateEscrowRelease = (date) => {
    const purchaseDate = new Date(date);
    const releaseDate = new Date(purchaseDate);
    releaseDate.setDate(releaseDate.getDate() + 30);

    const now = new Date();
    const daysLeft = Math.ceil((releaseDate - now) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) return "Released";
    return `${daysLeft} days left`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading earnings data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
      <div className="container-custom">
        <div className="mb-8">
          <button
            onClick={() => navigate("/instructor")}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-400 mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Earnings Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your earnings and escrow status
              </p>
            </div>

            <button className="mt-4 lg:mt-0 px-6 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl hover:border-primary-400 transition font-medium flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className={`bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition`}
            >
              <div
                className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mb-4`}
              >
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-gray-500">{stat.description}</div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-2 border-blue-500/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                How Escrow Works
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Your earnings are automatically managed by our smart contract
                escrow system to ensure fair transactions for both instructors
                and students.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Payments are held in escrow for{" "}
                    <strong className="text-gray-900 dark:text-white">
                      30 days
                    </strong>{" "}
                    after purchase
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    After 30 days, funds are{" "}
                    <strong className="text-gray-900 dark:text-white">
                      automatically released
                    </strong>{" "}
                    to you
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Students can request refunds if they watched less than 20%
                    or under 120 minutes
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    No manual withdrawal needed - everything is{" "}
                    <strong className="text-gray-900 dark:text-white">
                      fully automated
                    </strong>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Transaction History
            </h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-sm w-full sm:w-64"
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-sm"
              >
                <option value="all">All Transactions</option>
                <option value="escrow">In Escrow</option>
                <option value="released">Released</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="amount">Highest Amount</option>
              </select>
            </div>
          </div>

          {filteredEarnings.length > 0 ? (
            <div className="space-y-4">
              {filteredEarnings.map((earning) => (
                <div
                  key={earning.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-800 hover:border-primary-400/30 transition"
                >
                  <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                    <img
                      src={earning.courseThumbnail}
                      alt={earning.courseName}
                      className="w-20 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                        {earning.courseName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{earning.studentName}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(earning.date)}</span>
                        </span>
                        {earning.transactionHash && (
                          <a
                            href={`https://etherscan.io/tx/${earning.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-primary-400 hover:text-primary-500"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Transaction</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end space-x-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${earning.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Platform fee: ${earning.platformFee.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      {earning.status === "escrow" ? (
                        <div className="px-3 py-1.5 bg-orange-500/10 text-orange-500 rounded-lg text-xs font-medium">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Escrow</span>
                          </div>
                          <div className="text-[10px] mt-0.5">
                            {calculateEscrowRelease(earning.date)}
                          </div>
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-xs font-medium">
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Released</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-2">No transactions found</p>
              <p className="text-sm text-gray-400">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Earnings will appear here when students purchase your courses"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorEarningsPage;
