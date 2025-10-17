import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Award,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Upload,
  X,
  Sparkles,
  Shield,
  Zap,
  Target,
  Globe,
  Linkedin,
  Twitter,
  Github,
  BookOpen,
  Video,
  Mail,
  Loader,
  Star,
  Trophy,
  Heart,
  Briefcase,
  GraduationCap,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { useWallet } from "@contexts/WalletContext";
import toast from "react-hot-toast";

const BecomeInstructorPage = () => {
  const navigate = useNavigate();
  const { user } = useWallet(); // Assuming useWallet provides user info
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.username || "",
    email: "",
    bio: "",
    tagline: "",
    expertise: [""],
    experience: "",
    socialLinks: {
      website: "",
      twitter: "",
      linkedin: "",
      github: "",
    },
    whyTeach: "",
    courseIdeas: [""],
    portfolio: null,
    portfolioPreview: null,
    agreedToTerms: false,
  });
  const [errors, setErrors] = useState({});

  const benefits = [
    {
      icon: DollarSign,
      title: "Earn Crypto",
      description:
        "Get paid instantly in crypto when students complete your courses",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Users,
      title: "Global Reach",
      description: "Teach thousands of students worldwide in the Web3 space",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Shield,
      title: "Smart Contracts",
      description: "Automated payments and refunds handled by blockchain",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Target,
      title: "Full Control",
      description: "Set your own prices and manage your content",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  const stats = [
    { label: "Active Instructors", value: "500+", icon: Users },
    { label: "Total Earnings", value: "$2.5M", icon: DollarSign },
    { label: "Students Taught", value: "50K+", icon: GraduationCap },
    { label: "Avg. Rating", value: "4.8", icon: Star },
  ];

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSocialChange = (platform, value) => {
    setFormData({
      ...formData,
      socialLinks: { ...formData.socialLinks, [platform]: value },
    });
  };

  const addArrayItem = (field) => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ""],
    });
  };

  const updateArrayItem = (field, index, value) => {
    const updated = [...formData[field]];
    updated[index] = value;
    setFormData({ ...formData, [field]: updated });
  };

  const removeArrayItem = (field, index) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  const handlePortfolioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          portfolio: file,
          portfolioPreview: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.displayName || !formData.email || !formData.bio) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.agreedToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Application submitted successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.displayName || !formData.email || !formData.bio) {
        toast.error("Please fill in all required fields on this page.");
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
      <div className="container-custom max-w-6xl">
        {currentStep === 1 && (
          <div className="mb-12 text-center">
            <div className="inline-block p-3 bg-gradient-to-br from-primary-400 to-purple-600 rounded-2xl mb-6">
              <GraduationCap className="w-12 h-12 text-black" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Become an Instructor
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Share your Web3 knowledge and earn crypto by teaching students
              worldwide
            </p>
          </div>
        )}

        {currentStep === 1 && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className={`${benefit.bgColor} border-2 border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center`}
                >
                  <div
                    className={`w-12 h-12 ${benefit.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4`}
                  >
                    <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-br from-primary-400/10 to-purple-500/10 border-2 border-primary-400/30 rounded-2xl p-8 mb-12">
              <div className="grid md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-primary-400 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <stat.icon className="w-6 h-6 text-black" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepItem) => (
              <div key={stepItem} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                    currentStep >= stepItem
                      ? "bg-primary-400 text-black"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                  }`}
                >
                  {currentStep > stepItem ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    stepItem
                  )}
                </div>
                {stepItem < 3 && (
                  <div
                    className={`w-20 h-1 mx-2 transition ${
                      currentStep > stepItem
                        ? "bg-primary-400"
                        : "bg-gray-200 dark:bg-gray-800"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-24 mt-3">
            <span className="text-xs text-gray-500">Basic Info</span>
            <span className="text-xs text-gray-500">Experience</span>
            <span className="text-xs text-gray-500">Review</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-800 p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Tell us about yourself
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) =>
                      handleInputChange("displayName", e.target.value)
                    }
                    placeholder="How you want to be known"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="your@email.com"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Professional Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange("tagline", e.target.value)}
                  placeholder="e.g., Web3 Marketing Expert & NFT Consultant"
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Bio *
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about your background, experience, and what makes you qualified to teach..."
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Social Links
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.socialLinks.website}
                      onChange={(e) =>
                        handleSocialChange("website", e.target.value)
                      }
                      placeholder="https://yourwebsite.com"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                    />
                  </div>
                  <div className="relative">
                    <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.socialLinks.twitter}
                      onChange={(e) =>
                        handleSocialChange("twitter", e.target.value)
                      }
                      placeholder="@username"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                    />
                  </div>
                  <div className="relative">
                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.socialLinks.linkedin}
                      onChange={(e) =>
                        handleSocialChange("linkedin", e.target.value)
                      }
                      placeholder="linkedin.com/in/username"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Your Teaching Experience
                </h2>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Areas of Expertise
                </label>
                <div className="space-y-3">
                  {formData.expertise.map((exp, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={exp}
                        onChange={(e) =>
                          updateArrayItem("expertise", index, e.target.value)
                        }
                        placeholder="e.g., NFT Marketing, Smart Contracts, DeFi"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                      />
                      {formData.expertise.length > 1 && (
                        <button
                          onClick={() => removeArrayItem("expertise", index)}
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem("expertise")}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-400 transition font-medium text-gray-500 hover:text-primary-400"
                  >
                    + Add Expertise
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Teaching/Professional Experience
                </label>
                <textarea
                  value={formData.experience}
                  onChange={(e) =>
                    handleInputChange("experience", e.target.value)
                  }
                  placeholder="Describe your relevant experience, previous teaching, projects, or achievements..."
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Why do you want to teach on Founder Academy?
                </label>
                <textarea
                  value={formData.whyTeach}
                  onChange={(e) =>
                    handleInputChange("whyTeach", e.target.value)
                  }
                  placeholder="Share your motivation for becoming an instructor..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Course Ideas
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  What courses are you planning to create?
                </p>
                <div className="space-y-3">
                  {formData.courseIdeas.map((idea, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={idea}
                        onChange={(e) =>
                          updateArrayItem("courseIdeas", index, e.target.value)
                        }
                        placeholder="e.g., NFT Marketing Masterclass"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black focus:border-primary-400 transition"
                      />
                      {formData.courseIdeas.length > 1 && (
                        <button
                          onClick={() => removeArrayItem("courseIdeas", index)}
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayItem("courseIdeas")}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-400 transition font-medium text-gray-500 hover:text-primary-400"
                  >
                    + Add Course Idea
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Portfolio/Work Samples (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center">
                  {formData.portfolioPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={formData.portfolioPreview}
                        alt="Portfolio preview"
                        className="max-h-64 rounded-lg"
                      />
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            portfolio: null,
                            portfolioPreview: null,
                          })
                        }
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Upload portfolio, resume, or work samples
                      </p>
                      <label className="inline-block px-6 py-3 bg-primary-400 text-black rounded-xl font-bold cursor-pointer hover:bg-primary-500 transition">
                        Choose File
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handlePortfolioUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Review Your Application
                </h2>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    Basic Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Name:</strong> {formData.displayName}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Email:</strong> {formData.email}
                    </p>
                    {formData.tagline && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <strong>Tagline:</strong> {formData.tagline}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    Bio
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.bio || "Not provided"}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.expertise
                      .filter((e) => e.trim())
                      .map((exp, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-primary-400/10 text-primary-400 rounded-lg text-sm"
                        >
                          {exp}
                        </span>
                      ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    Course Ideas
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {formData.courseIdeas
                      .filter((idea) => idea.trim())
                      .map((idea, i) => (
                        <li key={i}>{idea}</li>
                      ))}
                  </ul>
                </div>
              </div>
              <div className="bg-blue-500/5 border-2 border-blue-500/20 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        agreedToTerms: e.target.checked,
                      })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      I agree to the{" "}
                      <a
                        href="#"
                        className="text-primary-400 hover:text-primary-500 font-medium"
                      >
                        Instructor Terms & Conditions
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="text-primary-400 hover:text-primary-500 font-medium"
                      >
                        Privacy Policy
                      </a>
                      . I understand that my application will be reviewed within
                      3-5 business days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={
                currentStep === 1 ? () => navigate("/dashboard") : prevStep
              }
              className="px-6 py-3 border-2 border-gray-200 dark:border-gray-800 rounded-xl font-bold hover:border-primary-400 transition"
            >
              {currentStep === 1 ? "Cancel" : "Back"}
            </button>
            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-primary-400 text-black rounded-xl font-bold hover:bg-primary-500 transition flex items-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !formData.agreedToTerms}
                className="px-8 py-3 bg-gradient-to-r from-primary-400 to-primary-600 text-black rounded-xl font-bold hover:shadow-xl transition disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeInstructorPage;
