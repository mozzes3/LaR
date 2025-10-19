import { useState, useEffect } from "react";
import {
  X,
  MessageSquare,
  Search,
  CheckCircle,
  AlertCircle,
  Send,
  Trash2,
  Loader,
  Edit2,
} from "lucide-react";
import toast from "react-hot-toast";
import { questionApi } from "@services/api";
import { useWallet } from "@contexts/WalletContext";

const CourseQuestionsModal = ({ course, onClose, hasPurchased = true }) => {
  const { user: currentUser } = useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionLesson, setNewQuestionLesson] = useState("");
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingReply, setEditingReply] = useState(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editReplyText, setEditReplyText] = useState("");

  console.log("👤 FULL WALLET CONTEXT:", useWallet());
  console.log("👤 currentUser:", currentUser);

  if (!currentUser) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-400" />
          <p className="text-gray-500">Loading user data...</p>
        </div>
      </div>
    );
  }

  const getInstructorId = () => {
    if (!course?.instructor) return null;
    return course.instructor._id || course.instructor;
  };

  const isInstructor = currentUser?.id === getInstructorId();
  const canInteract = hasPurchased || isInstructor;

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        console.log(
          "🔄 Loading questions for course:",
          course._id || course.id
        );

        const response = await questionApi.getCourseQuestions(
          course._id || course.id
        );

        console.log("✅ Questions loaded:", response.data.questions);
        setQuestions(response.data.questions);
      } catch (error) {
        console.error("❌ Error loading questions:", error);
        toast.error("Failed to load questions");
      } finally {
        setLoading(false);
      }
    };

    if (course) {
      loadQuestions();
    }
  }, [course]);

  // Debug logging
  console.log("🔍 Modal Debug:", {
    userId: currentUser?._id,
    courseInstructorId: course.instructor?._id || course.instructor,
    isInstructor,
    hasPurchased,
    canInteract,
  });

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.student?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.lesson.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "unanswered" && q.status === "unanswered") ||
      (selectedFilter === "answered" && q.status === "answered");

    return matchesSearch && matchesFilter;
  });

  console.log("📊 Questions Debug:", {
    totalQuestions: questions.length,
    filteredQuestions: filteredQuestions.length,
    loading,
    selectedFilter,
    searchQuery,
    allQuestions: questions,
  });

  const handleCreateQuestion = async () => {
    if (!newQuestion.trim() || !newQuestionLesson.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await questionApi.createQuestion({
        courseId: course._id || course.id,
        lesson: newQuestionLesson,
        question: newQuestion,
      });

      setQuestions([response.data.question, ...questions]);
      setNewQuestion("");
      setNewQuestionLesson("");
      setShowNewQuestionForm(false);
      toast.success("Question posted successfully!");
    } catch (error) {
      console.error("Error creating question:", error);
      toast.error(error.response?.data?.error || "Failed to post question");
    }
  };

  const handleSendReply = async (questionId) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    console.log("📤 Sending reply:", {
      questionId,
      replyText,
      userId: currentUser?._id,
    });

    try {
      const response = await questionApi.replyToQuestion(questionId, replyText);

      console.log("✅ Reply sent successfully:", response.data);

      // Update the question in the list
      setQuestions(
        questions.map((q) =>
          q._id === questionId ? response.data.question : q
        )
      );

      setReplyText("");
      setReplyingTo(null);
      toast.success("Reply sent successfully!");
    } catch (error) {
      console.error("Error sending reply:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to send reply");
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      await questionApi.deleteQuestion(questionId);
      setQuestions(questions.filter((q) => q._id !== questionId));
      toast.success("Question deleted");
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question._id);
    setEditQuestionText(question.question);
  };

  const handleUpdateQuestion = async (questionId) => {
    if (!editQuestionText.trim()) {
      toast.error("Question cannot be empty");
      return;
    }

    try {
      const response = await questionApi.updateQuestion(
        questionId,
        editQuestionText
      );
      setQuestions(
        questions.map((q) =>
          q._id === questionId ? response.data.question : q
        )
      );
      setEditingQuestion(null);
      setEditQuestionText("");
      toast.success("Question updated");
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error("Failed to update question");
    }
  };

  const handleEditReply = (questionId, reply) => {
    setEditingReply({ questionId, replyId: reply._id });
    setEditReplyText(reply.text);
  };

  const handleUpdateReply = async (questionId, replyId) => {
    if (!editReplyText.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    try {
      const response = await questionApi.updateReply(
        questionId,
        replyId,
        editReplyText
      );
      setQuestions(
        questions.map((q) =>
          q._id === questionId ? response.data.question : q
        )
      );
      setEditingReply(null);
      setEditReplyText("");
      toast.success("Reply updated");
    } catch (error) {
      console.error("Error updating reply:", error);
      toast.error("Failed to update reply");
    }
  };

  const getStatusBadge = (status) => {
    // Only show status badge to instructor
    if (!isInstructor) return null;

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

  const formatTimestamp = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
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

          {/* Ask Question Button (for students) */}
          {!isInstructor && canInteract && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              {!showNewQuestionForm ? (
                <button
                  onClick={() => setShowNewQuestionForm(true)}
                  className="w-full px-4 py-3 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition"
                >
                  Ask a Question
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Which lesson is this about?"
                    value={newQuestionLesson}
                    onChange={(e) => setNewQuestionLesson(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black"
                  />
                  <textarea
                    placeholder="Type your question..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black resize-none"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowNewQuestionForm(false);
                        setNewQuestion("");
                        setNewQuestionLesson("");
                      }}
                      className="px-4 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateQuestion}
                      className="px-4 py-2 bg-primary-400 text-black rounded-lg font-bold hover:bg-primary-500 transition"
                    >
                      Post Question
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
            {loading ? (
              <div className="text-center py-12">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-400" />
                <p className="text-gray-500">Loading questions...</p>
              </div>
            ) : filteredQuestions.length > 0 ? (
              filteredQuestions.map((q) => (
                <div
                  key={q._id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          q.student?.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${q.student?.username}`
                        }
                        alt={q.student?.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {q.student?.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {q.lesson} • {formatTimestamp(q.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(q.status)}
                      {(currentUser?._id === q.student?._id ||
                        isInstructor) && (
                        <button
                          onClick={() => handleDeleteQuestion(q._id)}
                          className="p-1 hover:bg-red-500/10 text-red-500 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-900 dark:text-white mb-3">
                    {q.question}
                  </p>

                  {q.replies.length > 0 && (
                    <div className="pl-4 border-l-2 border-primary-400 mb-3 space-y-2">
                      {q.replies.map((reply, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white dark:bg-gray-900 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-primary-400">
                                {reply.user?.isInstructor
                                  ? "Instructor"
                                  : reply.user?.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(reply.createdAt)}
                              </span>
                            </div>
                            {isInstructor && (
                              <button
                                onClick={() => handleEditReply(q._id, reply)}
                                className="p-1 hover:bg-blue-500/10 text-blue-500 rounded transition"
                                title="Edit reply"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Reply - with edit mode */}
                          {editingReply?.questionId === q._id &&
                          editingReply?.replyId === reply._id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editReplyText}
                                onChange={(e) =>
                                  setEditReplyText(e.target.value)
                                }
                                rows={2}
                                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-black focus:border-primary-400 transition resize-none text-sm"
                              />
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingReply(null);
                                    setEditReplyText("");
                                  }}
                                  className="px-3 py-1 border-2 border-gray-200 dark:border-gray-800 rounded text-xs"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateReply(q._id, reply._id)
                                  }
                                  className="px-3 py-1 bg-primary-400 text-black rounded text-xs font-bold hover:bg-primary-500 transition"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {reply.text}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isInstructor &&
                    canInteract &&
                    (replyingTo === q._id ? (
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
                            onClick={() => handleSendReply(q._id)}
                            className="px-4 py-2 bg-primary-400 text-black rounded-lg text-sm font-bold hover:bg-primary-500 transition flex items-center space-x-2"
                          >
                            <Send className="w-4 h-4" />
                            <span>Send Reply</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(q._id)}
                        className="text-sm text-primary-400 hover:text-primary-500 font-medium"
                      >
                        Reply to this question
                      </button>
                    ))}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No questions found
                </h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Be the first to ask a question!"}
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
