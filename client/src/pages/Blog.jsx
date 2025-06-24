import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import {
  CameraIcon,
  SunIcon,
  MoonIcon,
  ArrowLeftIcon,
  PencilIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  BookOpenIcon,
  SparklesIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

const Blog = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load posts from localStorage on component mount
  useEffect(() => {
    const savedPosts = localStorage.getItem("groupify_blog_posts");
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    } else {
      // Initialize with some sample posts
      const initialPosts = [
        {
          id: 1,
          title: "How AI is Revolutionizing Photo Organization",
          excerpt:
            "Discover how artificial intelligence is changing the way we organize and find our photos, making memory management effortless.",
          content:
            "Artificial Intelligence has transformed many aspects of our digital lives, and photo organization is no exception. At Groupify, we've harnessed the power of AI to make finding and organizing your memories as simple as thinking about them.\n\nOur advanced face recognition technology can identify people across thousands of photos, even as they age or change their appearance. The system learns from each photo you upload, becoming more accurate over time.\n\nBeyond face recognition, our AI can also identify objects, locations, and even emotions in photos. This means you can search for 'beach photos' or 'happy moments' and find exactly what you're looking for.\n\nThe future of photo organization is here, and it's more intelligent than ever before.",
          author: "Groupify Team",
          date: "2025-06-20",
          category: "technology",
          readTime: "5 min read",
          views: 1247,
          likes: 89,
          comments: 23,
          tags: ["AI", "Photo Organization", "Technology"],
          featured: true,
        },
        {
          id: 2,
          title: "Top 10 Tips for Better Travel Photography",
          excerpt:
            "Learn professional techniques to capture stunning travel photos that tell the story of your adventures.",
          content:
            "Travel photography is an art that combines technical skill with creative vision. Here are our top 10 tips to help you capture better photos on your next adventure:\n\n1. **Golden Hour Magic**: Shoot during sunrise or sunset for warm, flattering light.\n\n2. **Rule of Thirds**: Position key elements along the grid lines for more dynamic compositions.\n\n3. **Include People**: Adding people to landscape shots provides scale and emotional connection.\n\n4. **Tell a Story**: Capture not just landmarks, but the journey, the food, the culture.\n\n5. **Pack Light**: Bring only essential gear to stay mobile and spontaneous.\n\n6. **Research Locations**: Know the best viewpoints and timing before you arrive.\n\n7. **Backup Everything**: Use cloud storage to protect your precious memories.\n\n8. **Interact with Locals**: Some of the best photos come from genuine human connections.\n\n9. **Experiment with Angles**: Don't just shoot at eye level - get low, climb high, find unique perspectives.\n\n10. **Edit Thoughtfully**: Enhance your photos but maintain their authentic feel.\n\nRemember, the best camera is the one you have with you. Sometimes the most memorable shots come from unexpected moments captured with just your phone.",
          author: "Adir Edri",
          date: "2025-06-18",
          category: "photography",
          readTime: "8 min read",
          views: 892,
          likes: 156,
          comments: 34,
          tags: ["Travel", "Photography", "Tips"],
          featured: false,
        },
        {
          id: 3,
          title: "Building Community Through Shared Memories",
          excerpt:
            "Explore how sharing photos creates stronger connections and builds lasting communities among friends and family.",
          content:
            "In our digital age, sharing memories has become easier than ever, but meaningful connection often gets lost in the noise. At Groupify, we believe that sharing photos should strengthen relationships, not just fill social media feeds.\n\nWhen you share a trip or event with friends and family through Groupify, you're not just sharing images - you're creating a collaborative memory book that everyone can contribute to and enjoy.\n\nResearch shows that shared experiences and memories strengthen social bonds. When we look at photos together, we relive those moments and often discover new perspectives from other people's viewpoints.\n\nOur platform encourages this type of meaningful sharing by:\n- Making it easy to invite others to contribute\n- Preserving photos in their original quality\n- Organizing memories by trips and events\n- Providing privacy controls for intimate moments\n\nThe next time you return from a trip, consider creating a shared album. You might be surprised by the photos others captured and the memories you forgot.",
          author: "Ofir Almog",
          date: "2025-06-15",
          category: "community",
          readTime: "6 min read",
          views: 654,
          likes: 78,
          comments: 19,
          tags: ["Community", "Sharing", "Memories"],
          featured: false,
        },
      ];
      setPosts(initialPosts);
      localStorage.setItem("groupify_blog_posts", JSON.stringify(initialPosts));
    }
    setIsLoaded(true);
  }, []);

  // Save posts to localStorage whenever posts change
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem("groupify_blog_posts", JSON.stringify(posts));
    }
  }, [posts]);

  const categories = [
    { id: "all", name: "All Posts", icon: BookOpenIcon },
    { id: "technology", name: "Technology", icon: SparklesIcon },
    { id: "photography", name: "Photography", icon: CameraIcon },
    { id: "community", name: "Community", icon: UserGroupIcon },
    { id: "updates", name: "Updates", icon: ChartBarIcon },
  ];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = posts.filter((post) => post.featured);
  const recentPosts = posts
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const handleLike = (postId) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );
  };

  const CreatePostModal = () => {
    const [formData, setFormData] = useState({
      title: "",
      excerpt: "",
      content: "",
      category: "technology",
      tags: "",
      featured: false,
    });

    const handleSubmit = (e) => {
      e.preventDefault();

      if (!formData.title || !formData.excerpt || !formData.content) {
        toast.error("Please fill in all required fields");
        return;
      }

      const newPost = {
        id: Date.now(),
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        author: currentUser?.displayName || "Anonymous",
        date: new Date().toISOString().split("T")[0],
        readTime:
          Math.ceil(formData.content.split(" ").length / 200) + " min read",
        views: 0,
        likes: 0,
        comments: 0,
      };

      setPosts((prev) => [newPost, ...prev]);
      setShowCreateModal(false);
      toast.success("Post created successfully!");

      // Reset form
      setFormData({
        title: "",
        excerpt: "",
        content: "",
        category: "technology",
        tags: "",
        featured: false,
      });
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Post
            </h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter post title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Excerpt *
              </label>
              <textarea
                required
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
                }
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="Brief description of your post..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {categories
                    .filter((cat) => cat.id !== "all")
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="AI, Photography, Tips..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content *
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={15}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="Write your post content here..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    featured: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label
                htmlFor="featured"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Feature this post
              </label>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <CheckIcon className="w-5 h-5 mr-2" />
                Publish Post
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const PostDetailModal = ({ post, onClose }) => {
    if (!post) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium capitalize">
                {post.category}
              </span>
              {post.featured && (
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full text-sm font-medium">
                  Featured
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <div className="flex items-center">
                <UserIcon className="w-4 h-4 mr-1" />
                {post.author}
              </div>
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {new Date(post.date).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                {post.readTime}
              </div>
              <div className="flex items-center">
                <EyeIcon className="w-4 h-4 mr-1" />
                {post.views} views
              </div>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
              {post.content.split("\n\n").map((paragraph, index) => (
                <p
                  key={index}
                  className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
                >
                  <HeartIcon className="w-5 h-5" />
                  <span>{post.likes}</span>
                </button>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  <span>{post.comments}</span>
                </div>
                <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-indigo-500 transition-colors">
                  <ShareIcon className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-colors duration-500">
      {/* Navigation Header */}
      <nav className="relative z-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="ml-2 text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Groupify
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>

              {currentUser && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <PlusIcon className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Post</span>
                </button>
              )}

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === "dark" ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4 sm:mb-6">
            <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white mr-2" />
            <span className="text-white font-medium text-sm sm:text-base">
              Groupify Blog
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Stories, Tips & Updates
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-indigo-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
            Discover insights about photo organization, AI technology, and
            building communities through shared memories.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 rounded-xl border-0 shadow-lg focus:ring-2 focus:ring-white/50 text-base sm:text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Category Filter */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? "bg-indigo-600 text-white"
                        : "bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <category.icon className="w-4 h-4 mr-1 sm:mr-2" />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Posts */}
            {featuredPosts.length > 0 &&
              selectedCategory === "all" &&
              searchQuery === "" && (
                <div className="mb-8 sm:mb-12">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    Featured Posts
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {featuredPosts.slice(0, 2).map((post) => (
                      <article
                        key={post.id}
                        className={`group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${
                          isLoaded
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-8"
                        }`}
                        onClick={() => setSelectedPost(post)}
                      >
                        <div className="p-4 sm:p-6">
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <span className="px-2 py-1 sm:px-3 sm:py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs sm:text-sm font-medium capitalize">
                              {post.category}
                            </span>
                            <span className="px-2 py-1 sm:px-3 sm:py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full text-xs sm:text-sm font-medium">
                              Featured
                            </span>
                          </div>

                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                            {post.title}
                          </h3>

                          <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base line-clamp-3">
                            {post.excerpt}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
                            <div className="flex items-center">
                              <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              {post.author}
                            </div>
                            <div className="flex items-center">
                              <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              {new Date(post.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              {post.readTime}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(post.id);
                                }}
                                className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <HeartIcon className="w-4 h-4" />
                                <span>{post.likes}</span>
                              </button>
                              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                                <EyeIcon className="w-4 h-4" />
                                <span>{post.views}</span>
                              </div>
                            </div>

                            {post.tags && post.tags.length > 0 && (
                              <div className="flex items-center">
                                <TagIcon className="w-4 h-4 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {post.tags.slice(0, 2).join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

            {/* All Posts */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                {selectedCategory === "all"
                  ? "All Posts"
                  : categories.find((c) => c.id === selectedCategory)?.name}
                <span className="text-sm sm:text-base font-normal text-gray-500 dark:text-gray-400 ml-2">
                  ({filteredPosts.length})
                </span>
              </h2>

              {filteredPosts.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <BookOpenIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No posts found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery
                      ? "Try adjusting your search terms or browse by category."
                      : "No posts in this category yet. Check back soon!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {filteredPosts.map((post, index) => (
                    <article
                      key={post.id}
                      className={`group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${
                        isLoaded
                          ? `opacity-100 translate-y-0 delay-${index * 100}`
                          : "opacity-0 translate-y-8"
                      }`}
                      onClick={() => setSelectedPost(post)}
                    >
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                              <span className="px-2 py-1 sm:px-3 sm:py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs sm:text-sm font-medium capitalize">
                                {post.category}
                              </span>
                              {post.featured && (
                                <span className="px-2 py-1 sm:px-3 sm:py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full text-xs sm:text-sm font-medium">
                                  Featured
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {post.title}
                            </h3>

                            <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base line-clamp-2">
                              {post.excerpt}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
                              <div className="flex items-center">
                                <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                {post.author}
                              </div>
                              <div className="flex items-center">
                                <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                {new Date(post.date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                {post.readTime}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 sm:space-x-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLike(post.id);
                                  }}
                                  className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <HeartIcon className="w-4 h-4" />
                                  <span>{post.likes}</span>
                                </button>
                                <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                                  <ChatBubbleLeftIcon className="w-4 h-4" />
                                  <span>{post.comments}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                                  <EyeIcon className="w-4 h-4" />
                                  <span>{post.views}</span>
                                </div>
                              </div>

                              {post.tags && post.tags.length > 0 && (
                                <div className="hidden sm:flex items-center">
                                  <TagIcon className="w-4 h-4 text-gray-400 mr-1" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {post.tags.slice(0, 2).join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Recent Posts */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Recent Posts
                </h3>
                <div className="space-y-4">
                  {recentPosts.slice(0, 5).map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="group cursor-pointer"
                    >
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-1">
                        {post.title}
                      </h4>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Tags */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Popular Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(posts.flatMap((post) => post.tags || [])))
                    .slice(0, 10)
                    .map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                </div>
              </div>

              {/* Newsletter Signup */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 p-4 sm:p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Stay Updated
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Get the latest posts and updates delivered to your inbox.
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-t border-white/20 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="ml-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Groupify
              </span>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              © 2025 Groupify. Sharing stories and memories.
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showCreateModal && <CreatePostModal />}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
};

export default Blog;
