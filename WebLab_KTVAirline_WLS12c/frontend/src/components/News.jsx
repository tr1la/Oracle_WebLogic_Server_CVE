import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNews } from '../services/api';

const News = () => {
    const navigate = useNavigate();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await getNews(0, 6); // Lấy 6 tin tức mới nhất
                const newsData = response?.data || [];
                setNews(Array.isArray(newsData) ? newsData : []);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching news:', err);
                setError('Không thể tải tin tức');
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    const handleReadMore = (id) => {
        window.scrollTo(0, 0);
        navigate(`/news/${id}`);
    };

    const handleSeeAllClick = (e) => {
        e.preventDefault();
        window.scrollTo(0, 0);
        navigate('/all-news');
    };

    const handleNewsClick = (newsItem) => {
        navigate('/news-detail', { state: { newsInfo: newsItem } });
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'NEWS':
                return 'bg-blue-100 text-blue-800';
            case 'PROMOTION':
                return 'bg-green-100 text-green-800';
            case 'HELP':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[200px]">
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
        <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-[#6E7491]">Tin tức mới nhất</h2>
                    <button
                        onClick={handleSeeAllClick}
                        className="text-blue-500 hover:text-blue-700"
                    >
                        Xem tất cả
                    </button>
                </div>
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
        </section>
    );
};

export default News; 