import { useParams } from 'react-router-dom';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">帖子详情 #{id}</h1>
      <p className="text-gray-500">帖子内容将在此展示。</p>
    </div>
  );
}
