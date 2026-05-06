import { useParams } from 'react-router-dom';

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">@{username}</h1>
      <p className="text-gray-500">用户资料将在此展示。</p>
    </div>
  );
}
