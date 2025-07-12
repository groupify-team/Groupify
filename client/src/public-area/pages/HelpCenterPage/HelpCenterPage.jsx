import React, { useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../../components/layout/PublicLayout";
import HeroSection from "../../components/ui/HeroSection";
import { usePublicNavigation } from "../../hooks/usePublicNavigation";
import AccessibilityModal from "@/shared/components/accessibility/AccessibilityModal";

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
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

// Search Bar Component
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

const HelpCategoryCard = ({
  category,
  expandedCategories,
  setExpandedCategories,
  setSelectedArticle,
  getArticleContent,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 relative z-10">
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
      {category.articles.slice(0, 3).map((article, articleIndex) => (
        <li key={articleIndex}>
          <button
            onClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setSelectedArticle({
                category: category.title,
                article,
                content: getArticleContent(category.title, article),
              });
            }}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm transition-colors text-left hover:underline relative z-0"
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
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    setSelectedArticle({
                      category: category.title,
                      article,
                      content: getArticleContent(category.title, article),
                    });
                  }}
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
    </ul>
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
        <ChevronRightIcon
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform duration-300 ${
            openFaq === index ? "rotate-90" : "rotate-0"
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

const ArticleModal = ({ selectedArticle, setSelectedArticle }) => {
  if (!selectedArticle) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-modal-backdrop-enter">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-modal-enter relative z-[10000]">
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
      </div>
    </div>
  );
};

const ContactSupportSection = () => (
  <div className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
    <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
      <ChatBubbleLeftRightIcon className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-4 sm:mb-6" />
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
        Still need help?
      </h2>
      <p className="text-base sm:text-lg md:text-xl text-indigo-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
        Can't find what you're looking for? Our support team is here to help you
        with any questions or issues you might have.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
        <Link
          to="/contact"
          className="inline-flex items-center justify-center bg-white text-indigo-600 px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
        >
          Contact Support
        </Link>
        <a
          href="mailto:groupify.ltd@gmail.com"
          className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold border border-white/30 hover:bg-white/30 transition-all duration-200"
        >
          Email Us
        </a>
      </div>
    </div>
  </div>
);

const HelpCenter = () => {
  const { handleSmoothNavigation, headerProps, accessibilityModalProps } =
    usePublicNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Help categories with corrected information
  const helpCategories = [
    {
      icon: BookOpenIcon,
      title: "Getting Started",
      description: "Learn the basics of using Groupify",
      articles: [
        "How to create your first event",
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
      description: "Share Events and photos with friends",
      articles: [
        "Inviting friends to events",
        "Setting sharing permissions",
        "Managing event collaborators",
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
        "Exporting your data",
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
        "Search visibility settings",
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
        "Plan limit issues",
      ],
    },
  ];

  // Function to get article content with CORRECTED information
  const getArticleContent = (category, article) => {
    const articles = {
      "Getting Started": {
        "How to create your first event":
          "Creating your first event is easy! Follow these steps:\n\n1. **Sign in to your account** - Make sure you're logged into Groupify\n\n2. **Click 'Create New Event'** - You'll find this button on your dashboard\n\n3. **Enter event details** - Add a name, dates, and location for your event\n\n4. **Add a description** - Write a brief description of your event\n\n5. **Set privacy settings** - Choose who can see and contribute to your event\n\n6. **Upload your first photos** - Start adding photos to bring your event to life!\n\nTip: You can always edit event details later by clicking the settings icon on your event page.",
        "Uploading your first photos":
          "Ready to upload your memories? Here's how:\n\n1. **open your event** - Navigate to the event where you want to add photos\n\n2. **Click 'Upload Photos'** - Look for the camera icon or upload button\n\n3. **Select your photos** - Choose photos from your device or drag and drop them\n\n4. **Wait for processing** - Our AI will analyze your photos for face recognition\n\n5. **Add captions** - Optionally add descriptions to your photos\n\n6. **Organize by date** - Photos are automatically sorted by date taken\n\n**Technical Specifications:**\n- Supported formats: JPEG, PNG, GIF\n- Maximum file size: **10MB per photo**\n- Upload limits vary by plan (Free: 30 photos per event, Premium: 200 photos per event, Pro: unlimited)",
        "Setting up your profile":
          "Make your profile yours with these steps:\n\n1. **Go to Profile Settings** - Click your avatar in the top right corner\n\n2. **Upload a profile photo** - This helps friends recognize you in Shared Events\n\n3. **Update your display name** - Choose how you want to appear to others\n\n4. **Set your preferences** - Configure notification and privacy settings\n\n5. **Add contact information** - Make it easy for friends to find and invite you\n\n6. **Choose your timezone** - Ensure photos are displayed with correct timestamps\n\nYour profile information helps improve the AI's ability to find you in photos!",
        "Understanding the dashboard":
          "Your dashboard is mission control for all your events:\n\n**Recent Events** - Quick access to your latest adventures\n\n**Photo Statistics** - See how many photos you've uploaded and organized\n\n**Shared Events** - View events that friends have shared with you\n\n**Quick Actions** - Create New Events or upload photos directly\n\n**Search** - Find specific events or photos across your entire collection\n\n**Notifications** - Stay updated on shared event activity\n\nThe dashboard adapts to your usage patterns, showing the most relevant information first.",
      },
      "AI Face Recognition": {
        "How face recognition works":
          "Our AI face recognition technology uses the advanced face-api.js library:\n\n**Feature Detection** - The AI identifies unique facial features using 128D face embeddings\n\n**Quality Assessment** - Photos are automatically evaluated for clarity, lighting, and face visibility\n\n**Pattern Learning** - The system creates a profile from 2-5 high-quality photos of you\n\n**Matching Algorithm** - Photos are compared against learned patterns with confidence scoring\n\n**Privacy Protection** - All processing happens securely on our encrypted servers\n\n**Smart Face Scan** - Our guided capture system ensures optimal photo quality for 90%+ accuracy\n\nThe system works best with clear, well-lit photos taken from different angles.",
        "Training the AI with your photos":
          "Help our AI recognize you better:\n\n1. **Upload diverse photos** - Include photos from different angles and lighting\n\n2. **Confirm correct matches** - When the AI finds you, confirm it's correct\n\n3. **Correct mistakes** - If the AI misidentifies someone, let us know\n\n4. **Add profile photos** - Clear profile photos help train the system\n\n5. **Be patient** - The AI improves with each photo you upload\n\n6. **Use consistent tagging** - Tag yourself consistently across different events\n\nRemember: The AI learns from your feedback to provide better results over time.",
        "Improving recognition accuracy":
          "Get the best results from face recognition:\n\n**Photo Quality Tips:**\n- Use high-resolution photos (minimum 300x300 pixels)\n- Ensure faces are clearly visible and well-lit\n- Avoid heavily filtered or edited photos for training\n- Include photos from different angles (front, slight turns)\n\n**Face-api.js Technology:**\n- Uses 128D face embeddings for precise matching\n- Real-time quality assessment during capture\n- Confidence scoring for each match\n- Advanced neural networks for feature detection\n\n**Best Practices:**\n- Always confirm or correct AI suggestions\n- Use the Smart Face Scan for best results\n- Re-create your profile if accuracy decreases\n- Ensure good lighting when taking new photos\n\nAccuracy improves significantly with 3-5 high-quality training photos!",
        "Privacy and face data":
          "Your privacy is our top priority:\n\n**Data Encryption** - All facial recognition data is encrypted at rest and in transit\n\n**No Third-Party Sharing** - We never share your biometric data with external companies\n\n**User Control** - You can disable face recognition or delete your face data anytime\n\n**Secure Processing** - Recognition happens on secure, isolated servers using face-api.js\n\n**Data Retention** - Face recognition data is deleted when you delete your account\n\n**Opt-Out Anytime** - Disable face recognition in your privacy settings\n\n**Local Processing** - Face-api.js processes data locally in your browser when possible\n\nYou maintain full control over how your facial recognition data is used.",
      },
      "Sharing & Collaboration": {
        "Inviting friends to events":
          "Share your adventures with friends:\n\n1. **open your event** - Navigate to the event you want to share\n\n2. **Click 'Share Event'** - Look for the share icon in the event header\n\n3. **Enter email addresses** - Add your friends' email addresses\n\n4. **Set permissions** - Choose 'View Only' or 'Can Contribute'\n\n5. **Add a message** - Include a personal note with your invitation\n\n6. **Send invitations** - Your friends will receive email invitations\n\nFriends can accept invitations and start viewing or contributing immediately!",
        "Setting sharing permissions":
          "Control who can do what with your events:\n\n**View Only** - Friends can see photos but can't add or edit\n\n**Can Contribute** - Friends can upload photos and add comments\n\n**Co-Owner** - Full access including inviting others and event settings\n\n**Public Link** - Generate a link for easy sharing (view only)\n\n**Password Protection** - Add password protection to public links\n\n**Expiring Links** - Set expiration dates for temporary access\n\nYou can change permissions anytime from the event settings menu.",
        "Managing event collaborators":
          "Keep track of who has access to your events:\n\n**View Contributors** - See everyone with access to your event\n\n**Change Permissions** - Upgrade or downgrade user access levels\n\n**Remove Access** - Remove someone's access to your event\n\n**Pending Invitations** - See who hasn't accepted invitations yet\n\n**Activity Log** - Track who uploaded what and when\n\n**Notification Settings** - Control when you're notified about event activity\n\nManage all collaborators from the 'People' tab in your event settings.",
        "Downloading shared photos":
          "Save photos from shared events:\n\n**Individual Photos** - Click any photo and select 'Download'\n\n**Multiple Selection** - Select multiple photos and download as a zip\n\n**entire event** - Download all photos from a event at once\n\n**Original Quality** - Photos are downloaded in their original resolution\n\n**Organized Folders** - Downloads are organized by date and event\n\n**Batch Download** - Use our desktop app for faster bulk downloads\n\nAll downloads maintain original photo metadata and quality.",
      },
      "Account Settings": {
        "Changing your password":
          "Keep your account secure with a strong password:\n\n1. **Go to Account Settings** - Click your profile, then 'Settings'\n\n2. **Select 'Account'** - Navigate to the account section\n\n3. **Click 'Edit Profile'** - Find the profile edit option\n\n4. **Enter current password** - Verify your identity\n\n5. **Create new password** - Use a strong, unique password\n\n6. **Confirm changes** - Save your new password\n\n**Password Requirements:**\n- At least 8 characters long\n- Include uppercase and lowercase letters\n- Contains numbers and special characters",
        "Updating profile information":
          "Keep your profile current:\n\n**Personal Information:**\n- Update your display name\n- Change your email address\n- Add or update your bio\n\n**Profile Photo:**\n- Upload a clear, recent photo\n- This helps with AI recognition\n- Appears when you're tagged in Shared Events\n\n**Contact Preferences:**\n- Set your timezone\n- Choose notification preferences\n- Update contact information\n\n**Privacy Settings:**\n- Control who can find you\n- Manage search visibility\n- Set default sharing preferences",
        "Managing privacy settings":
          "Control your privacy on Groupify:\n\n**Profile Visibility:**\n- Choose who can find your profile\n- Control search discoverability\n- Manage friend suggestions\n\n**event privacy:**\n- Set default privacy for new events\n- Control who can invite you\n- Manage notification preferences\n\n**Face Recognition:**\n- Enable or disable AI face detection\n- Control automatic tagging\n- Manage facial recognition data\n\n**Data Sharing:**\n- Control analytics participation\n- Manage third-party integrations\n- Set communication preferences",
        "Deleting your account":
          "If you need to delete your account:\n\n**Before You Delete:**\n- Download any photos you want to keep\n- Notify collaborators on shared events\n- Consider deactivating temporarily instead\n\n**Deletion Process:**\n1. Go to Account Settings > Security\n2. Scroll to 'Delete Account'\n3. Enter your password to confirm\n4. Choose data retention preferences\n5. Confirm deletion\n\n**What Happens:**\n- All your photos are permanently deleted\n- Shared Events transfer to other owners\n- Account recovery is not possible\n\n**Alternative:** Consider deactivating your account temporarily instead.",
      },
      "Privacy & Security": {
        "How we protect your photos":
          "Your photos are safe with enterprise-grade security:\n\n**Encryption at Rest** - All photos encrypted with AES-256 encryption\n\n**Encrypted Transmission** - HTTPS/TLS for all data transfers\n\n**Secure Storage** - Photos stored in ISO 27001 certified data centers\n\n**Access Controls** - Strict employee access controls and monitoring\n\n**Regular Backups** - Multiple geographically distributed backups\n\n**Security Audits** - Regular third-party security assessments\n\n**Incident Response** - 24/7 security monitoring and response team\n\nYour photos are protected by the same security standards used by major financial institutions.",
        "Understanding privacy controls":
          "Take control of your privacy:\n\n**event level Privacy:**\n- Private: Only you can see\n- Shared: Only invited people can access\n- Public Link: Anyone with link can view\n\n**Photo Level Privacy:**\n- Hide specific photos from shared events\n- Control who can download your photos\n- Manage photo tagging permissions\n\n**Profile Privacy:**\n- Control search visibility\n- Manage who can invite you\n- Set communication preferences\n\n**Face Recognition:**\n- Enable/disable automatic face detection\n- Control AI training participation\n- Delete face recognition data\n\nAdjust all privacy settings from your account preferences.",
        "Two-factor authentication":
          "Add an extra layer of security:\n\n**Setup Process:**\n1. Go to Settings > Security\n2. Click 'Enable 2FA'\n3. Scan QR code with authenticator app\n4. Enter verification code\n5. Save backup codes safely\n\n**Recommended Apps:**\n- Google Authenticator\n- Authy\n- Microsoft Authenticator\n\n**Backup Codes:**\n- Save backup codes in a secure location\n- Each code can only be used once\n- Generate new codes if needed\n\n**Recovery:**\n- Use backup codes if you lose your device\n- Contact support for account recovery\n\nWe strongly recommend enabling 2FA for account security.",
        "Data export and deletion":
          "You own your data - export or delete it anytime:\n\n**Data Export:**\n- Download all your photos in original quality\n- Export event information and metadata\n- Get a copy of your account data\n- Receive data in standard formats\n\n**Export Process:**\n1. Go to Settings > Data & Privacy\n2. Click 'Export My Data'\n3. Choose what to include\n4. Receive download link via email\n5. Download within 7 days\n\n**Data Deletion:**\n- Delete individual photos or events\n- Remove specific data types\n- Complete account deletion\n\n**Deletion Timeline:**\n- Immediate removal from your account\n- Complete deletion from backups within 30 days\n- Some data may be retained for legal compliance",
      },
      Troubleshooting: {
        "Photos not uploading":
          "Troubleshoot upload issues:\n\n**Check File Requirements:**\n- Supported formats: JPEG, PNG, GIF\n- Maximum file size: **10MB per photo**\n- Check your plan's photo limits\n\n**Plan Limits:**\n- **Free**: 30 photos per event, 2GB total storage\n- **Premium**: 200 photos per event, 50GB total storage\n- **Pro**: Unlimited photos per event, 500GB total storage\n\n**Connection Issues:**\n- Ensure stable internet connection\n- Try uploading fewer photos at once\n- Disable VPN temporarily\n- Clear browser cache\n\n**Browser Issues:**\n- Update your browser to the latest version\n- Disable browser extensions\n- Try incognito/private mode\n- Check JavaScript is enabled\n\n**Mobile App Issues:**\n- Update to latest app version\n- Restart the app\n- Check device storage space\n- Grant camera/photos permissions\n\n**Still Having Issues?**\n- Try uploading one photo at a time\n- Contact support with error details",
        "Face recognition not working":
          "Improve face recognition performance:\n\n**Common Issues:**\n- Poor photo quality or lighting\n- Face partially obscured\n- Heavily filtered photos\n- Very old or low-resolution images\n\n**Troubleshooting Steps:**\n1. **Use Smart Face Scan** - Our guided system provides best results\n2. **Upload clearer photos** - Use high-quality, well-lit images\n3. **Check privacy settings** - Ensure face recognition is enabled\n4. **Recreate profile** - Delete and recreate with better photos\n5. **Wait for processing** - AI training takes a few minutes\n\n**Optimization Tips:**\n- Use 3-5 clear photos for profile creation\n- Include photos from different angles\n- Ensure faces are at least 300x300 pixels\n- Avoid sunglasses, masks, or heavy shadows\n- Use recent, high-quality images\n\n**Technical Details:**\n- Uses face-api.js for 90%+ accuracy\n- 128D face embeddings for precise matching\n- Real-time quality assessment\n- Confidence scoring for matches\n\nThe AI improves with better training data!",
        "Sharing issues":
          "Fix problems with sharing events:\n\n**Invitation Problems:**\n- Check recipient's email address\n- Ask them to check spam folder\n- Resend invitation from event settings\n- Try sharing via public link instead\n\n**Access Issues:**\n- Verify sharing permissions\n- Check if event is still shared\n- Ensure recipient has account\n- Try removing and re-adding access\n\n**Permission Problems:**\n- Review collaborator permissions\n- Update access levels as needed\n- Check event privacy settings\n- Verify owner permissions\n\n**Link Sharing Issues:**\n- Regenerate public link\n- Check link expiration\n- Verify password protection\n- Test link in incognito mode\n\n**Contact Support:**\nIf issues persist, contact us with specific error messages.",
        "Performance problems":
          "Optimize Groupify performance:\n\n**Slow Loading:**\n- Check internet connection speed\n- Clear browser cache and cookies\n- Disable unnecessary browser extensions\n- Close other tabs/applications\n- Try different browser\n\n**Photo Processing:**\n- Large photos (>5MB) take longer to process\n- Face recognition analysis requires processing time\n- Upload during off-peak hours\n- Be patient with batch uploads\n\n**Mobile Performance:**\n- Close other apps running in background\n- Restart your device\n- Update the app to latest version\n- Clear app cache and data\n- Check available storage space\n\n**Browser Optimization:**\n- Use latest Chrome, Firefox, or Safari\n- Enable hardware acceleration\n- Disable ad blockers temporarily\n- Check for browser updates\n\n**Network Issues:**\n- Use WiFi instead of mobile data\n- Avoid peak usage times\n- Check for network restrictions\n- Try different network connection\n\n**Storage Issues:**\n- Free up device storage space\n- Check your plan's storage limits\n- Consider upgrading your plan",
        "Plan limit issues":
          "Understanding and managing plan limits:\n\n**Current Plan Limits:**\n\n**Free Plan:**\n- 5 events maximum\n- 30 photos per event\n- 2GB total storage\n- 8 members per event\n\n**Premium Plan:**\n- 50 events maximum\n- 200 photos per event\n- 50GB total storage\n- 20 members per event\n\n**Pro Plan:**\n- Unlimited events\n- Unlimited photos per event\n- 500GB total storage\n- Unlimited members per event\n\n**When You Hit Limits:**\n- You'll see upgrade prompts\n- New uploads will be blocked\n- Consider deleting old content\n- Upgrade your plan for more capacity\n\n**Managing Usage:**\n- Check usage in Settings > Account\n- Delete unused events or photos\n- Download and delete old content\n- Optimize photo sizes before upload\n\n**Upgrade Benefits:**\n- Immediate access to higher limits\n- Better performance and features\n- Priority customer support\n- Advanced AI recognition features",
      },
    };

    return (
      articles[category]?.[article] ||
      "Content not available yet. Please contact support for assistance with this topic."
    );
  };

  // Updated FAQs with correct information
  const faqs = [
    {
      question: "How does the AI face recognition work?",
      answer:
        "Our AI uses the advanced face-api.js library to analyze facial features with 128D face embeddings. It creates a profile from 2-5 high-quality photos and can achieve 90%+ accuracy with proper lighting. The system includes real-time quality assessment and confidence scoring for matches.",
    },
    {
      question: "Is my data safe and private?",
      answer:
        "Absolutely! We use enterprise-grade encryption to protect your photos and data. Your photos are stored securely in the cloud with multiple backups. We never share your personal photos with third parties, and you maintain full control over who can see your events and photos.",
    },
    {
      question: "What are the storage limits for each plan?",
      answer:
        "Free accounts get 2GB of storage with 5 events and 30 photos per event. Premium accounts get 50GB of storage with 50 events and 200 photos per event. Pro accounts get 500GB of storage with unlimited events and photos per event.",
    },
    {
      question: "What photo formats are supported?",
      answer:
        "We support JPEG, PNG, and GIF formats. Maximum file size is 10MB per photo. Photos are automatically optimized for storage and display while maintaining quality.",
    },
    {
      question: "How do I invite friends to my event?",
      answer:
        "Yes! You can download individual photos, entire events, or export all your data at any time. Go to Settings > Data Export to download your photos in their original quality.",
    },
    {
      question: "Can I export my photos and data?",
      answer:
        "Yes! You can download individual photos, entire events, or export all your data at any time. Go to Settings > Account > Export Data to download your photos in their original quality plus all your event and account data.",
    },
    {
      question: "How do I invite friends to my event?",
      answer:
        "open your event, click the 'Share' button, and enter your friends' email addresses. They'll receive an invitation to view and contribute to your event. You can set permissions for each person (view-only or full access).",
    },
    {
      question: "Can I delete photos from shared events?",
      answer:
        "Event owners and users with full access can delete photos. If you only have view access, you can't delete photos, but you can hide them from your personal view.",
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
      headerProps={{ ...headerProps, handleSmoothNavigation }}
      footerType="extended"
      footerProps={{
        customText: "© 2025 Groupify. Here to help you organize your memories.",
        handleSmoothNavigation,
      }}
    >
      {/* Hero Section with Search */}
      <HeroSection
        badge={{ icon: QuestionMarkCircleIcon, text: "Help Center" }}
        title="How can we help you?"
        description="Find answers to your questions, learn how to use Groupify, and get the most out of your photo organization experience."
        variant="help"
        customContent={
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        }
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Help Categories */}
        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
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

        {/* FAQ Section */}
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
      </div>

      {/* Contact Support Section */}
      <ContactSupportSection />

      {/* Article Modal */}
      <ArticleModal
        selectedArticle={selectedArticle}
        setSelectedArticle={setSelectedArticle}
      />

      {/* Accessibility Modal */}
      <AccessibilityModal {...accessibilityModalProps} />
    </PublicLayout>
  );
};

export default HelpCenter;
