import { Metadata } from 'next';
import Image from 'next/image';
import { getPostBySlug } from '@/utils/blog/getPostBySlug';
import { getPosts } from '@/utils/blog/getPosts';
import { notFound } from 'next/navigation';

interface BlogPostProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found | Your App',
      description: 'The requested blog post could not be found.',
    };
  }

  return {
    title: `${post.title} | Your App Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.cover_image],
    },
  };
}

export default async function BlogPost({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="relative h-[400px] w-full mb-8">
        <Image
          src={post.cover_image}
          alt={post.title}
          fill
          className="object-cover rounded-lg"
        />
      </div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">{post.title}</h1>
        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
          <time>{new Date(post.published_at).toLocaleDateString()}</time>
          <span className="text-gray-400 dark:text-gray-500">•</span>
          <span>By {post.author}</span>
        </div>
      </header>
      <div className="dark:text-white">
        <div className="prose prose-lg max-w-none">
          {post.content}
        </div>
      </div>
    </article>
  );
}

export async function generateStaticParams() {
  // TODO: Replace with actual CMS fetch logic to get all slugs
  const { posts } = await getPosts(1, 100);
  
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export const revalidate = 60; // Revalidate every 60 seconds 