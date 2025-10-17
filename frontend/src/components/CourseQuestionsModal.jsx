import { useState } from "react";
import {
  X,
  MessageSquare,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";

const CourseQuestionsModal = ({ course, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Mock questions data
  const questions = [
    {
      id: 1,
      student: {
        name: "CryptoNinja",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoNinja",
      },
      lesson: "Setting Up Your Discord Server",
      question: "How do I set up role permissions for moderators?",
      timestamp: "2 hours ago",
      status: "unanswered",
      replies: [],
    },
    {
      id: 2,
      student: {
        name: "BlockchainBob",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=BlockchainBob",
      },
      lesson: "Community Engagement Strategies",
      question:
        "What's the best time to post announcements for maximum engagement?",
      timestamp: "5 hours ago",
      status: "answered",
      replies: [
        {
          from: "instructor",
          text: "Great question! Based on analytics, posting between 6-9 PM EST typically gets the highest engagement. However, test different times for your specific community.",
          timestamp: "3 hours ago",
        },
      ],
    },
    {
      id: 3,
      student: {
        name: "Web3Warrior",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Web3Warrior",
      },
      lesson: "Growing Your Community",
      question: "Should I use paid ads or focus on organic growth?",
      timestamp: "1 day ago",
      status: "answered",
      replies: [
        {
          from: "instructor",
          text: "I recommend starting with organic growth to build an authentic community. Once you have 500+ engaged members, then consider targeted paid campaigns.",
          timestamp: "18 hours ago",
        },
      ],
    },
    {
      id: 4,
      student: {
        name: "DeFiDave",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DeFiDave",
      },
      lesson: "Discord Bot Setup",
      question: "Which Discord bot do you recommend for NFT verification?",
      timestamp: "2 days ago",
      status: "unanswered",
      replies: [],
    },
  ];

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.lesson.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "unanswered" && q.status === "unanswered") ||
      (selectedFilter === "answered" && q.status === "answered");

    return matchesSearch && matchesFilter;
  });

  const handleSendReply = (questionId) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }
    toast.success("Reply sent successfully!");
    setReplyText("");
    setReplyingTo(null);
    // API call would go here
  };

  const getStatusBadge = (status) => {
    if (status === "answered") {
      return (
        <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg flex items-center space-x-1">
          <CheckCircle className="w-3 h-3" />
          <span>Answered</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-xs font-bold rounded-lg flex items-center space-x-1">
        <AlertCircle className="w-3 h-3" />
        <span>Needs Reply</span>
      </span>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] border-2 border-gray-200 dark:border-gray-800 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Course Questions
                </h2>
                <p className="text-sm text-gray-500">{course.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setSelectedFilter("all")}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    selectedFilter === "all"
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow"
                      : "text-gray-500"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedFilter("unanswered")}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    selectedFilter === "unanswered"
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow"
                      : "text-gray-500"
                  }`}
                >
                  Unanswered
                </button>
                <button
                  onClick={() => setSelectedFilter("answered")}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    selectedFilter === "answered"
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow"
                      : "text-gray-500"
                  }`}
                >
                  Answered
                </button>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={q.student.avatar}
                      alt={q.student.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {q.student.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {q.lesson} • {q.timestamp}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(q.status)}
                </div>

                {/* Question */}
                <p className="text-gray-900 dark:text-white mb-3">
                  {q.question}
                </p>

                {/* Existing Replies */}
                {q.replies.length > 0 && (
                  <div className="pl-4 border-l-2 border-primary-400 mb-3 space-y-2">
                    {q.replies.map((reply, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-gray-900 rounded-lg"
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-bold text-primary-400">
                            You (Instructor)
                          </span>
                          <span className="text-xs text-gray-500">
                            {reply.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {reply.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === q.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition resize-none text-sm"
                    />
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                        className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium hover:border-gray-300 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendReply(q.id)}
                        className="px-4 py-2 bg-primary-400 text-black rounded-lg text-sm font-bold hover:bg-primary-500 transition flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send Reply</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(q.id)}
                    className="text-sm text-primary-400 hover:text-primary-500 font-medium"
                  >
                    Reply to this question
                  </button>
                )}
              </div>
            ))}

            {filteredQuestions.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No questions found
                </h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Students haven't asked any questions yet"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseQuestionsModal;
