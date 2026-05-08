export interface PostCardData {
  id: string;
  title: string;
  content?: string;
  contentSummary?: string;
  coverImageUrl?: string | null;
  author: {
    username: string;
    nickname?: string;
    avatarUrl: string | null;
    level: number;
  };
  boardId?: string;
  boardName?: string;
  tags: { id: string; name: string }[];
  likeCount: number;
  replyCount: number;
  collectCount: number;
  createdAt: string;
  isPinned: boolean;
  isEssence: boolean;
}

export interface BoardData {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  postCount: number;
  sortOrder: number;
}

export interface TagData {
  id: string;
  name: string;
  sortOrder: number;
}
