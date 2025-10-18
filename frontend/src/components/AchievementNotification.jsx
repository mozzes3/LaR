import { useEffect, useState } from "react";
import {
  Trophy,
  Star,
  Award,
  Flame,
  Zap,
  Crown,
  BookOpen,
  Brain,
  Target,
  CheckCircle,
  Clock,
  Sparkles,
  X,
} from "lucide-react";

const iconMap = {
  Play: Star,
  Trophy,
  Flame,
  Zap,
  Crown,
  Award,
  BookOpen,
  Brain,
  Target,
  CheckCircle,
  Clock,
  Sparkles,
  Star,
};

const AchievementNotification = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);

    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const Icon = iconMap[achievement.icon] || Trophy;

  const difficultyColors = {
    easy: "from-blue-500/20 to-cyan-500/20 border-blue-500/40",
    medium: "from-purple-500/20 to-pink-500/20 border-purple-500/40",
    hard: "from-orange-500/20 to-red-500/20 border-orange-500/40",
    extreme: "from-red-500/20 to-pink-500/20 border-red-500/40",
    legendary: "from-primary-400/20 to-purple-500/20 border-primary-400/40",
  };

  return (
    <div
      className={`fixed top-20 right-6 z-50 transition-all duration-300 transform ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`bg-gradient-to-br ${
          difficultyColors[achievement.difficulty] || difficultyColors.medium
        } backdrop-blur-sm border-2 rounded-2xl p-4 shadow-2xl max-w-sm`}
      >
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-primary-400 rounded-xl flex items-center justify-center flex-shrink-0 animate-bounce">
            <Icon className="w-8 h-8 text-black" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-white text-lg">
                Achievement Unlocked!
              </h3>
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="p-1 hover:bg-white/10 rounded transition"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <p className="font-bold text-primary-400 mb-1">
              {achievement.title}
            </p>

            <p className="text-sm text-gray-300 mb-2">
              {achievement.description}
            </p>

            <div className="flex items-center space-x-3 text-xs">
              {achievement.xpReward > 0 && (
                <div className="flex items-center space-x-1 bg-blue-500/20 px-2 py-1 rounded-lg">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span className="text-blue-400 font-bold">
                    +{achievement.xpReward} XP
                  </span>
                </div>
              )}

              {achievement.fdrReward > 0 && (
                <div className="flex items-center space-x-1 bg-primary-400/20 px-2 py-1 rounded-lg">
                  <Trophy className="w-3 h-3 text-primary-400" />
                  <span className="text-primary-400 font-bold">
                    +{achievement.fdrReward} $FDR
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;
