import { Link } from 'react-router-dom';
import { Empty, Button } from '../components/ui';

export default function NotFoundPage() {
  return (
    <Empty
      title="页面不存在"
      description="您访问的页面不存在或已被移除"
      action={
        <Link to="/">
          <Button variant="default" size="sm">
            返回首页
          </Button>
        </Link>
      }
    />
  );
}
