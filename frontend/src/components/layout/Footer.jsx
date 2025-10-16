import { Link } from "react-router-dom";
import { Twitter, MessageCircle, Github, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <div className="container-custom py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center font-bold text-black">
                FA
              </div>
              <span className="text-xl font-bold">Founder Academy</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Empowering the next generation of Web3 founders and creators.
            </p>
            <div className="flex items-center space-x-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-primary-400 hover:text-black transition"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-primary-400 hover:text-black transition"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-primary-400 hover:text-black transition"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-bold mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/courses"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-400 transition"
                >
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link
                  to="/become-instructor"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-400 transition"
                >
                  Become Instructor
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-400 transition"
                >
                  Pricing & Rewards
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-400 transition"
                >
                  $FDR Token
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-400 transition"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-400 transition"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-400 transition"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-400 transition"
                >
                  Community
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-400 transition"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-400 transition"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-400 transition"
                >
                  Cookie Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-400 transition"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
              © {currentYear} Founder Academy. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Powered by $FDR
              </span>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Built on Ethereum
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
