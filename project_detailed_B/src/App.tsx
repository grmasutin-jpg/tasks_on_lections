import { Layout } from '@/components/Layout';
import { useMathPath } from '@/hooks/useMathPath';
import { useRoute } from '@/hooks/useRoute';
import Home from '@/pages/Home';
import Learn from '@/pages/Learn';
import Compare from '@/pages/Compare';
import Results from '@/pages/Results';

export default function App() {
  const store = useMathPath();
  const { route, navigate } = useRoute();

  let page;
  switch (route) {
    case '/learn':
      page = <Learn store={store} navigate={navigate} />;
      break;
    case '/compare':
      page = <Compare store={store} navigate={navigate} />;
      break;
    case '/results':
      page = <Results store={store} navigate={navigate} />;
      break;
    default:
      page = <Home navigate={navigate} />;
  }

  return (
    <Layout route={route} navigate={navigate}>
      {!store.storageOk && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <b>LocalStorage недоступен.</b> Тренажёр работает, но прогресс и статистика не сохранятся после перезагрузки
          страницы (например, в режиме приватного просмотра или при запрете хранилища в браузере).
        </div>
      )}
      {page}
    </Layout>
  );
}
