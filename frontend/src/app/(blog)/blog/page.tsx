import { Metadata } from 'next';
import { getPosts } from '@/utils/blog/getPosts';
import { BlogCard } from '@/components/blog/BlogCard';
import { Pagination } from '@/components/blog/Pagination';

export const metadata: Metadata = {
  title: 'Blog | Your App',
  description: 'Read our latest articles and updates about workflow management and productivity.',
};

export default async function BlogPage() {
  const { posts, totalPages, currentPage } = await getPosts();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Blog</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
} 