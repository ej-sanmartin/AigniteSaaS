import { Post } from '@/types/blog';

// TODO: Replace with actual CMS fetch logic
const dummyPosts: Post[] = Array.from({ length: 25 }, (_, i) => ({
  slug: `post-${i + 1}`,
  title: `Sample Blog Post ${i + 1}`,
  excerpt: `This is a sample excerpt for blog post ${i + 1}. It provides a brief overview of the content.`,
  content: `This is the full content of blog post ${i + 1}. In a real implementation, this would be fetched from your CMS.`,
  published_at: new Date(Date.now() - i * 86400000).toISOString(),
  cover_image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QbGFjZWhvbGRlciBJbWFnZTwvdGV4dD48L3N2Zz4=',
  author: 'John Doe',
}));

export async function getPostBySlug(slug: string): Promise<Post | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const post = dummyPosts.find(post => post.slug === slug);
  return post || null;
} 