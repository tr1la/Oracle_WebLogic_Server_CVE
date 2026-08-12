import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const PlaceDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const placeInfo = location.state?.placeInfo;

  useEffect(() => {
    if (!placeInfo) {
      navigate('/all-places');
    }
    window.scrollTo(0, 0);
  }, [placeInfo, navigate]);

  if (!placeInfo) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-[70px]">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <img
          src={placeInfo.pictureLink}
          alt={placeInfo.title}
          className="w-full h-[400px] object-cover"
        />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              {new Date(placeInfo.createDate).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Địa điểm du lịch
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[#6E7491] mb-4">{placeInfo.title}</h1>
          <div className="flex items-center mb-6">
            <span className="text-gray-600">Tác giả: {placeInfo.author}</span>
          </div>
          <div className="prose max-w-none">
            <div className="text-gray-700 text-lg mb-6">{placeInfo.summary}</div>
            <div 
              className="text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: placeInfo.content }}
            />
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto mt-8 flex justify-between">
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
        <button
          onClick={() => navigate('/explore')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center"
        >
          Đặt vé ngay
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 ml-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PlaceDetail; 