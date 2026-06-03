import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageCircle,
  Heart,
  Send,
  Search,
  Plus,
  Clock,
  Pin,
  Lock,
} from 'lucide-react';
import { useGetCommunityPostsQuery, useCreateCommunityPostMutation, useToggleLikeMutation, useAddCommentMutation } from '@redux/api/apiSlice';
import { GlassCard, GradientButton, Badge, Avatar } from '@components/ui/Layout';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '@utils/cn';
import { useAppSelector } from '@hooks/useRedux';

const categories = [
  { id: 'all', label: 'All Posts', icon: Users },
  { id: 'general', label: 'General', icon: MessageCircle },
  { id: 'anxiety', label: 'Anxiety', icon: Heart },
  { id: 'depression', label: 'Depression', icon: Heart },
  { id: 'relationships', label: 'Relationships', icon: Users },
  { id: 'self-care', label: 'Self Care', icon: Heart },
];

export const CommunityPage: React.FC = () => {
  const { profile } = useAppSelector((state) => state.auth);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  const { data: posts = [], refetch } = useGetCommunityPostsQuery({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const [createPost] = useCreateCommunityPostMutation();
  const [toggleLike] = useToggleLikeMutation();
  const [addComment] = useAddCommentMutation();

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('general');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [commentText, setCommentText] = useState('');

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast.error('Please fill in the title and content');
      return;
    }

    try {
      await createPost({
        user_id: profile?.id,
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        category: newPostCategory,
        is_anonymous: isAnonymous,
      }).unwrap();

      toast.success('Post created!');
      setShowNewPost(false);
      setNewPostTitle('');
      setNewPostContent('');
      refetch();
    } catch (error: any) {
      if (error?.data?.is_safety_violation) {
        toast.error(error.data.message, { duration: 6000 });
      } else {
        toast.error(error?.data?.message || 'Failed to create post');
      }
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await toggleLike(postId).unwrap();
    } catch {
      toast.error('Failed to update like');
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;

    try {
      await addComment({
        postId,
        text: commentText.trim(),
      }).unwrap();
      setCommentText('');
      toast.success('Comment added');
    } catch (error: any) {
      if (error?.data?.is_safety_violation) {
        toast.error(error.data.message, { duration: 6000 });
      } else {
        toast.error('Failed to add comment');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-calm-800 dark:text-white">
            Community
          </h1>
          <p className="text-calm-500 dark:text-calm-400">
            Connect with others on their wellness journey
          </p>
        </div>
        <GradientButton
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setShowNewPost(true)}
        >
          New Post
        </GradientButton>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-lavender-500 to-accent-500 text-white shadow-glow'
                : 'bg-calm-100/50 dark:bg-calm-800/50 text-calm-600 dark:text-calm-400 hover:bg-calm-200 dark:hover:bg-calm-700'
            )}
          >
            <category.icon className="w-4 h-4" />
            {category.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <GlassCard className="p-4" hover={false}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-calm-400" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-calm-100/50 dark:bg-calm-800/50 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white placeholder:text-calm-400 focus:outline-none focus:ring-2 focus:ring-lavender-500/50 transition-all"
          />
        </div>
      </GlassCard>

      {/* Posts */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <GlassCard className="p-12 text-center" hover={false}>
            <Users className="w-16 h-16 text-calm-300 dark:text-calm-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-calm-800 dark:text-white mb-2">
              No community posts yet.
            </h3>
            <p className="text-calm-500 dark:text-calm-400 mb-6">
              Start a supportive conversation.
            </p>
            <GradientButton onClick={() => setShowNewPost(true)}>
              Create a Post
            </GradientButton>
          </GlassCard>
        ) : (
          filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar
                    src={post.is_anonymous ? undefined : post.profiles?.avatar_url}
                    size="md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-calm-800 dark:text-white">
                        {post.is_anonymous ? 'Anonymous' : post.profiles?.full_name}
                      </span>
                      {post.is_pinned && (
                        <Pin className="w-4 h-4 text-lavender-500" />
                      )}
                      <Badge variant="info" size="sm">
                        {post.category}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-calm-800 dark:text-white mb-2">
                      {post.title}
                    </h3>
                    <p className="text-calm-600 dark:text-calm-300 mb-4">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-calm-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                      <button
                        onClick={() => handleLike(post.id)}
                        className={cn(
                          "flex items-center gap-1 transition-colors",
                          post.likes?.includes(profile?.id) ? "text-coral-500" : "hover:text-coral-500"
                        )}
                      >
                        <Heart className={cn("w-4 h-4", post.likes?.includes(profile?.id) && "fill-current")} />
                        {post.likes_count}
                      </button>
                      <button
                        onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                        className="flex items-center gap-1 hover:text-lavender-500 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {post.comments_count}
                      </button>
                    </div>

                    {/* Comments Section */}
                    <AnimatePresence>
                      {selectedPost === post.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-calm-200 dark:border-calm-700"
                        >
                          <div className="flex gap-2 mb-4">
                            <input
                              type="text"
                              placeholder="Write a supportive comment..."
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                              className="flex-1 px-4 py-2 rounded-xl bg-calm-100/50 dark:bg-calm-800/50 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white placeholder:text-calm-400 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-500/50"
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              className="p-2 rounded-xl bg-lavender-500 text-white hover:bg-lavender-600 transition-colors"
                            >
                              <Send className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Render Comments */}
                          <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                            {post.comments?.map((comment: any, idx: number) => (
                              <div key={idx} className="flex gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-calm-100 dark:border-white/5">
                                <Avatar size="sm" alt={comment.username} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-xs font-bold text-calm-800 dark:text-white truncate">
                                      {comment.username}
                                    </span>
                                    <span className="text-[10px] text-calm-400 whitespace-nowrap">
                                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-calm-600 dark:text-calm-300 break-words font-medium">
                                    {comment.text}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {(!post.comments || post.comments.length === 0) && (
                              <p className="text-center text-xs text-calm-400 py-4 italic">
                                Be the first to leave a supportive comment.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>

      {/* New Post Modal */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowNewPost(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <GlassCard className="p-6" hover={false}>
                <h2 className="text-2xl font-bold text-calm-800 dark:text-white mb-6">
                  Create a Post
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-calm-700 dark:text-calm-300 mb-2">
                      Category
                    </label>
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-calm-100/50 dark:bg-calm-800/50 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-lavender-500/50"
                    >
                      {categories.slice(1).map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-calm-700 dark:text-calm-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="What's on your mind?"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-calm-100/50 dark:bg-calm-800/50 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white placeholder:text-calm-400 focus:outline-none focus:ring-2 focus:ring-lavender-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-calm-700 dark:text-calm-300 mb-2">
                      Content
                    </label>
                    <textarea
                      placeholder="Share your thoughts..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-calm-100/50 dark:bg-calm-800/50 border border-calm-200 dark:border-calm-700 text-calm-800 dark:text-white placeholder:text-calm-400 focus:outline-none focus:ring-2 focus:ring-lavender-500/50 resize-none"
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-500 to-accent-500 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-calm-800 dark:text-white">
                        Post Anonymously
                      </p>
                      <p className="text-xs text-calm-500">
                        Your identity will be hidden
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={cn(
                        'relative ml-auto w-14 h-7 rounded-full transition-colors',
                        isAnonymous ? 'bg-lavender-500' : 'bg-calm-300 dark:bg-calm-600'
                      )}
                    >
                      <motion.div
                        animate={{ x: isAnonymous ? 28 : 4 }}
                        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                      />
                    </button>
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <GradientButton
                    variant="ghost"
                    onClick={() => setShowNewPost(false)}
                    className="flex-1"
                  >
                    Cancel
                  </GradientButton>
                  <GradientButton onClick={handleCreatePost} className="flex-1">
                    Post
                  </GradientButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityPage;
