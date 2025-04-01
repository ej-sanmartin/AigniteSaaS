import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types/blog';

interface BlogCardProps {
  post: Post;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg shadow-lg">
      <div className="relative h-48 w-full">
        <Image
          src={post.cover_image}
          alt={post.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-col p-4">
        <time className="text-sm text-gray-500 mb-2">
          {new Date(post.published_at).toLocaleDateString()}
        </time>
        <Link 
          href={`/blog/${post.slug}`}
          className="text-xl font-semibold mb-2 hover:text-blue-600 transition-colors"
        >
          {post.title}
        </Link>
        <p className="text-gray-600 line-clamp-3">
          {post.excerpt}
        </p>
      </div>
    </article>
  );
} 