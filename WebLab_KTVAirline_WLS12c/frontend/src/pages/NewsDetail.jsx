import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const NewsDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const newsInfo = location.state?.newsInfo;

  useEffect(() => {
    if (!newsInfo) {
      navigate('/all-news');
    }
    window.scrollTo(0, 0);
  }, [newsInfo, navigate]);

  if (!newsInfo) {
    return null;
  }

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'NEWS':
        return 'Tin tức';
      case 'PROMOTION':
        return 'Khuyến mãi';
      case 'HELP':
        return 'Trợ giúp';
      case 'FLIGHT_DEAL':
        return 'Ưu đãi chuyến bay';
      case 'PLACE':
        return 'Địa điểm du lịch';
      default:
        return category;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-[70px]">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <img
          src={newsInfo.pictureLink}
          alt={newsInfo.title}
          className="w-full h-[400px] object-cover"
        />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              {new Date(newsInfo.createDate).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {getCategoryLabel(newsInfo.category)}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[#6E7491] mb-4">{newsInfo.title}</h1>
          <div className="flex items-center mb-6">
            <span className="text-gray-600">Tác giả: {newsInfo.author}</span>
          </div>
          <div className="prose max-w-none">
            <div className="text-gray-700 text-lg mb-6">{newsInfo.summary}</div>
            <div 
              className="text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: newsInfo.content }}
            />
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto mt-8">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-500 hover:text-blue-700 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Quay lại
        </button>
      </div>
    </div>
  );
};

export default NewsDetail; 