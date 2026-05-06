import { useParams } from 'react-router-dom';

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">版块 #{id}</h1>
      <p className="text-gray-500">版块帖子列表将在此展示。</p>
    </div>
  );
}
