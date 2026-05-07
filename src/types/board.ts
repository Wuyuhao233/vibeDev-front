export interface PostCardData {
  id: number;
  title: string;
  content: string;
  contentSummary?: string;
  coverImageUrl?: string | null;
  author: {
    id: number;
    username: string;
    avatar: string | null;
    level: number;
  };
  board?: { id: number; name: string; slug?: string };
  tags: { id: number; name: string; slug: string }[];
  likeCount: number;
  replyCount: number;
  collectCount: number;
  createdAt: string;
  isPinned: boolean;
  isEssence: boolean;
}

export interface BoardData {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  postCount: number;
  sortOrder: number;
}

export interface TagData {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}
