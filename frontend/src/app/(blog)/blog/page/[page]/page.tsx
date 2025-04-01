import { Metadata } from 'next';
import { getPosts } from '@/utils/blog/getPosts';
import { BlogCard } from '@/components/blog/BlogCard';
import { Pagination } from '@/components/blog/Pagination';

interface BlogPageProps {
  params: Promise<{
    page: string;
  }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `Blog - Page ${page} | Your App`,
    description: `Read our latest articles and updates about workflow management and productivity. Page ${page}.`,
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { page } = await params;
  const pageNumber = parseInt(page, 10);
  const { posts, totalPages, currentPage } = await getPosts(pageNumber);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}

export async function generateStaticParams() {
  // TODO: Replace with actual CMS fetch logic to get total pages
  const { totalPages } = await getPosts();
  
  return Array.from({ length: totalPages }, (_, i) => ({
    page: (i + 1).toString(),
  }));
}

export const revalidate = 60; // Revalidate every 60 seconds 