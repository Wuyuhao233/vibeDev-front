import client from './client';

export type SearchScope = 'all' | 'board' | 'title_only' | 'title_content';

export interface SearchParams {
  q: string;
  scope?: SearchScope;
  boardId?: number;
  page?: number;
  pageSize?: number;
}

export interface SearchResultItem {
  id: number;
  title: string;
  titleHighlighted?: string;
  contentExcerpt?: string;
  contentExcerptHighlighted?: string;
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

export interface SearchResponse {
  items: SearchResultItem[];
  total: number;
  page: number;
  pageSize: number;
  searchTime?: string;
}

export async function search(params: SearchParams): Promise<SearchResponse> {
  const res = await client.get<{ data: SearchResponse }>('/v1/search', { params });
  return res.data.data;
}

export interface SearchSuggestItem {
  keyword: string;
  count?: number;
}

export async function getSearchSuggestions(q: string): Promise<SearchSuggestItem[]> {
  const res = await client.get<{ data: SearchSuggestItem[] }>('/v1/search/suggest', { params: { q } });
  return res.data.data;
}

export async function getTrendingSearches(): Promise<SearchSuggestItem[]> {
  const res = await client.get<{ data: SearchSuggestItem[] }>('/v1/search/suggestions');
  return res.data.data;
}
