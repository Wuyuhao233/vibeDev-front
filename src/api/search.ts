import client from './client';

export type SearchScope = 'all' | 'board' | 'title_only' | 'title_content';

export interface SearchParams {
  q: string;
  scope?: SearchScope;
  boardId?: string;
  page?: number;
  limit?: number;
}

export interface SearchResultItem {
  id: string;
  title: string;
  titleHighlighted?: string;
  contentExcerpt?: string;
  contentExcerptHighlighted?: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
    nickname?: string;
    level: number;
  };
  boardName?: string;
  boardId?: string;
  tags: { id: string; name: string }[];
  likeCount: number;
  replyCount: number;
  bookmarkCount: number;
  createdAt: string;
  isPinned?: boolean;
  isEssenced: boolean;
}

export interface SearchResponse {
  items: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
  searchTime?: string;
}

export async function search(params: SearchParams): Promise<SearchResponse> {
  const res = await client.get<{ data: SearchResponse }>('/search', { params });
  return res.data.data;
}

export async function getSearchSuggestions(q: string): Promise<string[]> {
  const res = await client.get<{ data: { suggestions: string[] } }>('/search/suggest', { params: { q } });
  return res.data.data.suggestions;
}

export async function getTrendingSearches(): Promise<string[]> {
  const res = await client.get<{ data: { hotSearches: string[] } }>('/search/suggestions');
  return res.data.data.hotSearches;
}
