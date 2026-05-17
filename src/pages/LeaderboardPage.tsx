import LeaderboardPanel from '../components/LeaderboardPanel';

export default function LeaderboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">积分排行榜</h1>
      <LeaderboardPanel />
    </div>
  );
}
