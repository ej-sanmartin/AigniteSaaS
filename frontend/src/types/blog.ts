export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  published_at: string;
  cover_image: string;
  author: string;
};

export type PaginatedPosts = {
  posts: Post[];
  totalPages: number;
  currentPage: number;
}; 