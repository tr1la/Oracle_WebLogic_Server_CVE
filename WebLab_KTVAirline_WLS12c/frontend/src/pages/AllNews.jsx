import { useState, useEffect } from 'react';
import { getNews } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AllNews = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await getNews(0, 1000);
        if (response?.data) {
          setNews(Array.isArray(response.data) ? response.data : []);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Không thể tải tin tức');
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleNewsClick = (newsItem) => {
    navigate('/news-detail', { state: { newsInfo: newsItem } });
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-red-500 text-center py-4">{error}</div>
  );

  if (!news || news.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Hiện không có tin tức nào.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-[70px]">
      <h1 className="text-3xl font-bold text-[#6E7491] mb-8">Tin tức</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {news.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
            onClick={() => handleNewsClick(item)}
          >
            <img
              src={item.pictureLink}
              alt={item.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold text-[#6E7491] mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm mb-2">Tác giả: {item.author}</p>
              <p className="text-gray-700 line-clamp-3">{item.summary}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-blue-500">Xem chi tiết</span>
                <span className="text-sm text-gray-500">
                  {new Date(item.createDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllNews; 