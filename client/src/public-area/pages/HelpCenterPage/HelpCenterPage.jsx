import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../../components/layout/PublicLayout";
import HeroSection from "../../components/ui/HeroSection";

import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  SparklesIcon,
  UserGroupIcon,
  ShareIcon,
  ShieldCheckIcon,
  CogIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

// Extract components for better organization
const SearchBar = ({ searchQuery, setSearchQuery }) => (
  <div className="max-w-2xl mx-auto">
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Search for help articles, FAQs, or features..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl border-0 shadow-lg focus:ring-2 focus:ring-white focus:ring-opacity-50 text-xs sm:text-base md:text-lg"
      />
    </div>
  </div>
);

const HelpCategoryCard = ({ category, expandedCategories, setExpandedCategories, setSelectedArticle, getArticleContent }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
    <div className="flex items-center mb-4 justify-center md:justify-start">
      <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
        <category.icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">
        {category.title}
      </h3>
    </div>
    <p className="text-gray-600 dark:text-gray-400 mb-4 text-center md:text-left">
      {category.description}
    </p>

    <ul className="space-y-2 text-center md:text-left">
      {category.articles
        .slice(0, 3)
        .map((article, articleIndex) => (
          <li key={articleIndex}>
            <button
              onClick={() =>
                setSelectedArticle({
                  category: category.title,
                  article,
                  content: getArticleContent(category.title, article),
                })
              }
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm transition-colors text-left hover:underline"
            >
              {article}
            </button>
          </li>
        ))}

      {!expandedCategories[category.title] && category.articles.length > 3 && (
        <li>
          <button
            onClick={() =>
              setExpandedCategories((prev) => ({
                ...prev,
                [category.title]: true,
              }))
            }
            className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-all duration-500 ease-out hover:underline italic border-t border-gray-200 dark:border-gray-600 pt-2 mt-2 w-full text-center transform hover:scale-105"
          >
            ▼ More articles ({category.articles.length - 3} more)
          </button>
        </li>
      )}

      <div
        className={`overflow-hidden transition-all duration-1000 ease-out ${
          expandedCategories[category.title]
            ? "max-h-[500px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        {category.articles.length > 3 && (
          <div className="space-y-2">
            {category.articles.slice(3).map((article, articleIndex) => (
              <li
                key={articleIndex + 3}
                className="transform transition-all duration-500 ease-out"
              >
                <button
                  onClick={() =>
                    setSelectedArticle({
                      category: category.title,
                      article,
                      content: getArticleContent(category.title, article),
                    })
                  }
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm transition-all duration-300 text-left hover:underline hover:translate-x-1"
                >
                  {article}
                </button>
              </li>
            ))}
          </div>
        )}
      </div>

      {expandedCategories[category.title] && category.articles.length > 3 && (
        <li className="transition-opacity duration-300 ease-out">
          <button
            onClick={() =>
              setExpandedCategories((prev) => ({
                ...prev,
                [category.title]: false,
              }))
            }
            className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-all duration-500 ease-out hover:underline italic border-t border-gray-200 dark:border-gray-600 pt-2 mt-2 w-full text-center transform hover:scale-105"
          >
            ▲ Show less
          </button>
        </li>
      )}

      {expandedCategories[category.title] && category.articles.length <= 3 && (
        <li className="text-sm text-gray-500 dark:text-gray-400 italic text-center border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
          No additional articles available
        </li>
      )}
    </ul>
  </div>
);

const HelpCategoriesSection = ({ filteredCategories, expandedCategories, setExpandedCategories, setSelectedArticle, getArticleContent }) => (
  <div className="mb-16">
    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 text-center">
      Browse by Category
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredCategories.map((category, index) => (
        <HelpCategoryCard
          key={category.title}
          category={category}
          expandedCategories={expandedCategories}
          setExpandedCategories={setExpandedCategories}
          setSelectedArticle={setSelectedArticle}
          getArticleContent={getArticleContent}
        />
      ))}
    </div>
  </div>
);

const FAQItem = ({ faq, index, openFaq, toggleFaq }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg mb-4 shadow-sm border border-gray-200 dark:border-gray-700">
    <button
      onClick={() => toggleFaq(index)}
      className="w-full text-left p-4 sm:p-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 rounded-lg"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white pr-4 sm:pr-8">
          {faq.question}
        </h3>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform duration-300 ${
            openFaq === index ? "-rotate-90" : "rotate-0"
          }`}
        />
      </div>
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        openFaq === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm sm:text-base">
          {faq.answer}
        </p>
      </div>
    </div>
  </div>
);

const FAQSection = ({ filteredFaqs, openFaq, toggleFaq }) => (
  <div className="mb-16">
    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 text-center">
      Frequently Asked Questions
    </h2>
    <div className="max-w-4xl mx-auto">
      {filteredFaqs.map((faq, index) => (
        <FAQItem
          key={index}
          faq={faq}
          index={index}
          openFaq={openFaq}
          toggleFaq={toggleFaq}
        />
      ))}
    </div>
  </div>
);

const ContactSupportSection = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
    <ChatBubbleLeftRightIcon className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-6" />
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      Still need help?
    </h2>
    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
      Can't find what you're looking for? Our support team is here to help
      you with any questions or issues you might have.
    </p>
    <div className="flex flex-row items-center justify-center gap-4">
      <Link
        to="/contact"
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
      >
        Contact Support
      </Link>
      <a
        href="mailto:groupify.ltd@gmail.com"
        className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        Email Us
      </a>
    </div>
  </div>
);

const ArticleModal = ({ selectedArticle, setSelectedArticle }) => {
  if (!selectedArticle) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
              {selectedArticle.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {selectedArticle.article}
            </h2>
          </div>
          <button
            onClick={() => setSelectedArticle(null)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="prose prose-sm sm:prose-lg dark:prose-invert max-w-none">
            {selectedArticle.content.split("\n\n").map((paragraph, index) => {
              if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
                return (
                  <h3
                    key={index}
                    className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mt-4 sm:mt-6 mb-2 sm:mb-3"
                  >
                    {paragraph.replace(/\*\*/g, "")}
                  </h3>
                );
              } else if (paragraph.includes("**")) {
                return (
                  <p
                    key={index}
                    className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 leading-relaxed"
                  >
                    {paragraph.split("**").map((part, partIndex) =>
                      partIndex % 2 === 1 ? (
                        <strong
                          key={partIndex}
                          className="font-semibold text-gray-900 dark:text-white"
                        >
                          {part}
                        </strong>
                      ) : (
                        part
                      )
                    )}
                  </p>
                );
              } else {
                return (
                  <p
                    key={index}
                    className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 leading-relaxed"
                  >
                    {paragraph}
                  </p>
                );
              }
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center sm:justify-end">
            <button
              onClick={() => {
                setSelectedArticle(null);
                setTimeout(() => {
                  const contactSection = document.querySelector("footer");
                  if (contactSection) {
                    contactSection.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }, 100);
              }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-center"
            >
              Still Need Help?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const helpCategories = [
    {
      icon: BookOpenIcon,
      title: "Getting Started",
      description: "Learn the basics of using Groupify",
      articles: [
        "How to create your first trip",
        "Uploading your first photos",
        "Setting up your profile",
        "Understanding the dashboard",
        "Mobile app basics",
        "Keyboard shortcuts",
        "Getting help and support",
      ],
    },
    {
      icon: SparklesIcon,
      title: "AI Face Recognition",
      description: "Everything about finding yourself in photos",
      articles: [
        "How face recognition works",
        "Training the AI with your photos",
        "Improving recognition accuracy",
        "Privacy and face data",
      ],
    },
    {
      icon: UserGroupIcon,
      title: "Sharing & Collaboration",
      description: "Share trips and photos with friends",
      articles: [
        "Inviting friends to trips",
        "Setting sharing permissions",
        "Managing trip collaborators",
        "Downloading shared photos",
      ],
    },
    {
      icon: CogIcon,
      title: "Account Settings",
      description: "Manage your account and preferences",
      articles: [
        "Changing your password",
        "Updating profile information",
        "Managing privacy settings",
        "Deleting your account",
      ],
    },
    {
      icon: ShieldCheckIcon,
      title: "Privacy & Security",
      description: "Keep your photos safe and secure",
      articles: [
        "How we protect your photos",
        "Understanding privacy controls",
        "Two-factor authentication",
        "Data export and deletion",
        "Security best practices",
        "Account recovery options",
        "Data breach protection",
      ],
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Troubleshooting",
      description: "Solutions to common problems",
      articles: [
        "Photos not uploading",
        "Face recognition not working",
        "Sharing issues",
        "Performance problems",
      ],
    },
  ];

  // Function to get article content
  const getArticleContent = (category, article) => {
    const articles = {
      "Getting Started": {
        "How to create your first trip":
          "Creating your first trip is easy! Follow these steps:\n\n1. **Sign in to your account** - Make sure you're logged into Groupify\n\n2. **Click 'Create New Trip'** - You'll find this button on your dashboard\n\n3. **Enter trip details** - Add a name, dates, and location for your trip\n\n4. **Add a description** - Write a brief description of your trip\n\n5. **Set privacy settings** - Choose who can see and contribute to your trip\n\n6. **Upload your first photos** - Start adding photos to bring your trip to life!\n\nTip: You can always edit trip details later by clicking the settings icon on your trip page.",
        "Uploading your first photos":
          "Ready to upload your memories? Here's how:\n\n1. **Open your trip** - Navigate to the trip where you want to add photos\n\n2. **Click 'Upload Photos'** - Look for the camera icon or upload button\n\n3. **Select your photos** - Choose photos from your device or drag and drop them\n\n4. **Wait for processing** - Our AI will analyze your photos for face recognition\n\n5. **Add captions** - Optionally add descriptions to your photos\n\n6. **Organize by date** - Photos are automatically sorted by date taken\n\nSupported formats: JPEG, PNG, HEIC, and RAW files up to 50MB each.",
        "Setting up your profile":
          "Make your profile yours with these steps:\n\n1. **Go to Profile Settings** - Click your avatar in the top right corner\n\n2. **Upload a profile photo** - This helps friends recognize you in shared trips\n\n3. **Update your display name** - Choose how you want to appear to others\n\n4. **Set your preferences** - Configure notification and privacy settings\n\n5. **Add contact information** - Make it easy for friends to find and invite you\n\n6. **Choose your timezone** - Ensure photos are displayed with correct timestamps\n\nYour profile information helps improve the AI's ability to find you in photos!",
        "Understanding the dashboard":
          "Your dashboard is mission control for all your trips:\n\n**Recent Trips** - Quick access to your latest adventures\n\n**Photo Statistics** - See how many photos you've uploaded and organized\n\n**Shared Trips** - View trips that friends have shared with you\n\n**Quick Actions** - Create new trips or upload photos directly\n\n**Search** - Find specific trips or photos across your entire collection\n\n**Notifications** - Stay updated on shared trip activity\n\nThe dashboard adapts to your usage patterns, showing the most relevant information first.",
      },
      "AI Face Recognition": {
        "How face recognition works":
          "Our AI face recognition technology works through advanced machine learning:\n\n**Feature Detection** - The AI identifies unique facial features like eye spacing, nose shape, and jawline\n\n**Pattern Learning** - As you upload more photos, the system learns to recognize you better\n\n**Matching Algorithm** - Photos are compared against learned patterns to find matches\n\n**Confidence Scoring** - Each match receives a confidence score to ensure accuracy\n\n**Privacy Protection** - All processing happens securely on our encrypted servers\n\nThe more photos you upload, the smarter our AI becomes at finding you!",
        "Training the AI with your photos":
          "Help our AI recognize you better:\n\n1. **Upload diverse photos** - Include photos from different angles and lighting\n\n2. **Confirm correct matches** - When the AI finds you, confirm it's correct\n\n3. **Correct mistakes** - If the AI misidentifies someone, let us know\n\n4. **Add profile photos** - Clear profile photos help train the system\n\n5. **Be patient** - The AI improves with each photo you upload\n\n6. **Use consistent tagging** - Tag yourself consistently across different trips\n\nRemember: The AI learns from your feedback to provide better results over time.",
        "Improving recognition accuracy":
          "Get the best results from face recognition:\n\n**Photo Quality Tips:**\n- Use high-resolution photos when possible\n- Ensure faces are clearly visible and well-lit\n- Avoid heavily filtered or edited photos for training\n\n**Feedback Helps:**\n- Always confirm or correct AI suggestions\n- Report false positives to improve accuracy\n- Tag yourself in group photos\n\n**Best Practices:**\n- Upload photos chronologically when possible\n- Include photos from different time periods\n- Add photos where you look different (haircuts, glasses, etc.)\n\nAccuracy improves significantly after uploading 20-30 photos!",
        "Privacy and face data":
          "Your privacy is our top priority:\n\n**Data Encryption** - All facial recognition data is encrypted at rest and in transit\n\n**No Third-Party Sharing** - We never share your biometric data with external companies\n\n**User Control** - You can disable face recognition or delete your face data anytime\n\n**Secure Processing** - Recognition happens on secure, isolated servers\n\n**Data Retention** - Face recognition data is deleted when you delete your account\n\n**Opt-Out Anytime** - Disable face recognition in your privacy settings\n\nYou maintain full control over how your facial recognition data is used.",
      },
      "Sharing & Collaboration": {
        "Inviting friends to trips":
          "Share your adventures with friends:\n\n1. **Open your trip** - Navigate to the trip you want to share\n\n2. **Click 'Share Trip'** - Look for the share icon in the trip header\n\n3. **Enter email addresses** - Add your friends' email addresses\n\n4. **Set permissions** - Choose 'View Only' or 'Can Contribute'\n\n5. **Add a message** - Include a personal note with your invitation\n\n6. **Send invitations** - Your friends will receive email invitations\n\nFriends can accept invitations and start viewing or contributing immediately!",
        "Setting sharing permissions":
          "Control who can do what with your trips:\n\n**View Only** - Friends can see photos but can't add or edit\n\n**Can Contribute** - Friends can upload photos and add comments\n\n**Co-Owner** - Full access including inviting others and trip settings\n\n**Public Link** - Generate a link for easy sharing (view only)\n\n**Password Protection** - Add password protection to public links\n\n**Expiring Links** - Set expiration dates for temporary access\n\nYou can change permissions anytime from the trip settings menu.",
        "Managing trip collaborators":
          "Keep track of who has access to your trips:\n\n**View Contributors** - See everyone with access to your trip\n\n**Change Permissions** - Upgrade or downgrade user access levels\n\n**Remove Access** - Remove someone's access to your trip\n\n**Pending Invitations** - See who hasn't accepted invitations yet\n\n**Activity Log** - Track who uploaded what and when\n\n**Notification Settings** - Control when you're notified about trip activity\n\nManage all collaborators from the 'People' tab in your trip settings.",
        "Downloading shared photos":
          "Save photos from shared trips:\n\n**Individual Photos** - Click any photo and select 'Download'\n\n**Multiple Selection** - Select multiple photos and download as a zip\n\n**Entire Trip** - Download all photos from a trip at once\n\n**Original Quality** - Photos are downloaded in their original resolution\n\n**Organized Folders** - Downloads are organized by date and trip\n\n**Batch Download** - Use our desktop app for faster bulk downloads\n\nAll downloads maintain original photo metadata and quality.",
      },
      "Account Settings": {
        "Changing your password":
          "Keep your account secure with a strong password:\n\n1. **Go to Account Settings** - Click your profile, then 'Settings'\n\n2. **Select 'Security'** - Navigate to the security section\n\n3. **Click 'Change Password'** - Find the password change option\n\n4. **Enter current password** - Verify your identity\n\n5. **Create new password** - Use a strong, unique password\n\n6. **Confirm changes** - Save your new password\n\nPassword Requirements:\n- At least 8 characters long\n- Include uppercase and lowercase letters\n- Contains numbers and special characters",
        "Updating profile information":
          "Keep your profile current:\n\n**Personal Information:**\n- Update your display name\n- Change your email address\n- Add or update your bio\n\n**Profile Photo:**\n- Upload a clear, recent photo\n- This helps with AI recognition\n- Appears when you're tagged in shared trips\n\n**Contact Preferences:**\n- Set your timezone\n- Choose notification preferences\n- Update contact information\n\n**Privacy Settings:**\n- Control who can find you\n- Manage search visibility\n- Set default sharing preferences",
        "Managing privacy settings":
          "Control your privacy on Groupify:\n\n**Profile Visibility:**\n- Choose who can find your profile\n- Control search discoverability\n- Manage friend suggestions\n\n**Trip Privacy:**\n- Set default privacy for new trips\n- Control who can invite you\n- Manage notification preferences\n\n**Face Recognition:**\n- Enable or disable AI face detection\n- Control automatic tagging\n- Manage facial recognition data\n\n**Data Sharing:**\n- Control analytics participation\n- Manage third-party integrations\n- Set communication preferences",
        "Deleting your account":
          "If you need to delete your account:\n\n**Before You Delete:**\n- Download any photos you want to keep\n- Notify collaborators on shared trips\n- Consider deactivating temporarily instead\n\n**Deletion Process:**\n1. Go to Account Settings > Security\n2. Scroll to 'Delete Account'\n3. Enter your password to confirm\n4. Choose data retention preferences\n5. Confirm deletion\n\n**What Happens:**\n- All your photos are permanently deleted\n- Shared trips transfer to other owners\n- Account recovery is not possible\n\n**Alternative:** Consider deactivating your account temporarily instead.",
      },
      "Privacy & Security": {
        "How we protect your photos":
          "Your photos are safe with enterprise-grade security:\n\n**Encryption at Rest** - All photos encrypted with AES-256 encryption\n\n**Encrypted Transmission** - HTTPS/TLS for all data transfers\n\n**Secure Storage** - Photos stored in ISO 27001 certified data centers\n\n**Access Controls** - Strict employee access controls and monitoring\n\n**Regular Backups** - Multiple geographically distributed backups\n\n**Security Audits** - Regular third-party security assessments\n\n**Incident Response** - 24/7 security monitoring and response team\n\nYour photos are protected by the same security standards used by major financial institutions.",
        "Understanding privacy controls":
          "Take control of your privacy:\n\n**Trip Level Privacy:**\n- Private: Only you can see\n- Shared: Only invited people can access\n- Public Link: Anyone with link can view\n\n**Photo Level Privacy:**\n- Hide specific photos from shared trips\n- Control who can download your photos\n- Manage photo tagging permissions\n\n**Profile Privacy:**\n- Control search visibility\n- Manage who can invite you\n- Set communication preferences\n\n**Face Recognition:**\n- Enable/disable automatic face detection\n- Control AI training participation\n- Delete face recognition data\n\nAdjust all privacy settings from your account preferences.",
        "Two-factor authentication":
          "Add an extra layer of security:\n\n**Setup Process:**\n1. Go to Settings > Security\n2. Click 'Enable 2FA'\n3. Scan QR code with authenticator app\n4. Enter verification code\n5. Save backup codes safely\n\n**Recommended Apps:**\n- Google Authenticator\n- Authy\n- Microsoft Authenticator\n\n**Backup Codes:**\n- Save backup codes in a secure location\n- Each code can only be used once\n- Generate new codes if needed\n\n**Recovery:**\n- Use backup codes if you lose your device\n- Contact support for account recovery\n\nWe strongly recommend enabling 2FA for account security.",
        "Data export and deletion":
          "You own your data - export or delete it anytime:\n\n**Data Export:**\n- Download all your photos in original quality\n- Export trip information and metadata\n- Get a copy of your account data\n- Receive data in standard formats\n\n**Export Process:**\n1. Go to Settings > Data & Privacy\n2. Click 'Export My Data'\n3. Choose what to include\n4. Receive download link via email\n5. Download within 7 days\n\n**Data Deletion:**\n- Delete individual photos or trips\n- Remove specific data types\n- Complete account deletion\n\n**Deletion Timeline:**\n- Immediate removal from your account\n- Complete deletion from backups within 30 days\n- Some data may be retained for legal compliance",
      },
      Troubleshooting: {
        "Photos not uploading":
          "Troubleshoot upload issues:\n\n**Check File Requirements:**\n- Supported formats: JPEG, PNG, HEIC, RAW\n- Maximum file size: 50MB per photo\n- Maximum batch size: 100 photos\n\n**Connection Issues:**\n- Ensure stable internet connection\n- Try uploading fewer photos at once\n- Disable VPN temporarily\n\n**Browser Issues:**\n- Clear browser cache and cookies\n- Disable browser extensions\n- Try incognito/private mode\n- Update your browser\n\n**Mobile App Issues:**\n- Update to latest app version\n- Restart the app\n- Check device storage space\n- Grant camera/photos permissions\n\n**Still Having Issues?**\n- Try uploading one photo at a time\n- Contact support with error details",
        "Face recognition not working":
          "Improve face recognition performance:\n\n**Common Issues:**\n- Poor photo quality or lighting\n- Face partially obscured\n- Heavily filtered photos\n- Very old or low-resolution images\n\n**Troubleshooting Steps:**\n1. Upload clearer photos of yourself\n2. Confirm correct AI suggestions\n3. Add profile photos\n4. Check privacy settings\n5. Wait for AI training to complete\n\n**Optimization Tips:**\n- Upload at least 10-15 clear photos\n- Include photos from different angles\n- Use recent, high-quality images\n- Avoid heavily edited photos\n\n**Reset Face Recognition:**\n- Go to Settings > Privacy\n- Clear face recognition data\n- Re-upload training photos\n\nThe AI improves with more training data!",
        "Sharing issues":
          "Fix problems with sharing trips:\n\n**Invitation Problems:**\n- Check recipient's email address\n- Ask them to check spam folder\n- Resend invitation from trip settings\n- Try sharing via public link instead\n\n**Access Issues:**\n- Verify sharing permissions\n- Check if trip is still shared\n- Ensure recipient has account\n- Try removing and re-adding access\n\n**Permission Problems:**\n- Review collaborator permissions\n- Update access levels as needed\n- Check trip privacy settings\n- Verify owner permissions\n\n**Link Sharing Issues:**\n- Regenerate public link\n- Check link expiration\n- Verify password protection\n- Test link in incognito mode\n\n**Contact Support:**\nIf issues persist, contact us with specific error messages.",
        "Performance problems":
          "Optimize Groupify performance:\n\n**Slow Loading:**\n- Check internet connection speed\n- Clear browser cache\n- Disable unnecessary browser extensions\n- Close other tabs/applications\n\n**Photo Processing:**\n- Large photos take longer to process\n- AI analysis requires processing time\n- Upload during off-peak hours\n- Be patient with batch uploads\n\n**Mobile Performance:**\n- Close other apps\n- Restart your device\n- Update the app\n- Clear app cache\n- Check available storage\n\n**Browser Optimization:**\n- Use latest Chrome, Firefox, or Safari\n- Enable hardware acceleration\n- Disable ad blockers temporarily\n- Try different browser\n\n**Network Issues:**\n- Use WiFi instead of mobile data\n- Avoid peak usage times\n- Check for network restrictions\n- Try different network",
      },
    };

    return (
      articles[category]?.[article] ||
      "Content not available yet. Please contact support for assistance with this topic."
    );
  };

  const faqs = [
    {
      question: "How does the AI face recognition work?",
      answer:
        "Our AI analyzes facial features in your photos to identify and group images of the same person. It uses advanced machine learning algorithms to recognize faces even in different lighting conditions, angles, and expressions. The more photos you upload, the more accurate it becomes.",
    },
    {
      question: "Is my data safe and private?",
      answer:
        "Absolutely! We use enterprise-grade encryption to protect your photos and data. Your photos are stored securely in the cloud with multiple backups. We never share your personal photos with third parties, and you maintain full control over who can see your trips and photos.",
    },
    {
      question: "Can I use Groupify offline?",
      answer:
        "While you need an internet connection to upload and sync photos, you can view previously downloaded photos offline. We're working on enhanced offline capabilities for future updates.",
    },
    {
      question: "How many photos can I upload?",
      answer:
        "Free accounts get 5GB of storage (approximately 2,500 photos). Premium accounts get unlimited storage. You can upgrade anytime from your account settings.",
    },
    {
      question: "Can I export my photos?",
      answer:
        "Yes! You can download individual photos, entire trips, or export all your data at any time. Go to Settings > Data Export to download your photos in their original quality.",
    },
    {
      question: "What photo formats are supported?",
      answer:
        "We support all major photo formats including JPEG, PNG, HEIC, and RAW files. Videos are also supported in MP4, MOV, and AVI formats.",
    },
    {
      question: "How do I invite friends to my trip?",
      answer:
        "Open your trip, click the 'Share' button, and enter your friends' email addresses. They'll receive an invitation to view and contribute to your trip. You can set permissions for each person (view-only or full access).",
    },
    {
      question: "Can I delete photos from shared trips?",
      answer:
        "Trip owners and users with full access can delete photos. If you only have view access, you can't delete photos, but you can hide them from your personal view.",
    },
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const filteredCategories = helpCategories.filter(
    (category) =>
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.articles.some((article) =>
        article.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PublicLayout
      headerType="public"
      footerType="extended"
      footerProps={{ customText: "© 2025 Groupify. Here to help you organize your memories." }}
    >
      {/* Hero Section with Search */}
      <HeroSection
        badge={{ icon: QuestionMarkCircleIcon, text: "Help Center" }}
        title="How can we help you?"
        description="Find answers to your questions, learn how to use Groupify, and get the most out of your photo organization experience."
        variant="help"
        customContent={
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Help Categories */}
        <HelpCategoriesSection
          filteredCategories={filteredCategories}
          expandedCategories={expandedCategories}
          setExpandedCategories={setExpandedCategories}
          setSelectedArticle={setSelectedArticle}
          getArticleContent={getArticleContent}
        />

        {/* FAQ Section */}
        <FAQSection
          filteredFaqs={filteredFaqs}
          openFaq={openFaq}
          toggleFaq={toggleFaq}
        />

        {/* Contact Support */}
        <ContactSupportSection />
      </div>

      {/* Article Modal */}
      <ArticleModal
        selectedArticle={selectedArticle}
        setSelectedArticle={setSelectedArticle}
      />
    </PublicLayout>
  );
};

export default HelpCenter;