import { redirect } from 'next/navigation';

// 重定向首页到分类页面
const HomePage = () => {
  redirect('/categories');
};

export default HomePage;
