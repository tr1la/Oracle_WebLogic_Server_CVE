import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import PromotionCard from '../container/PromotionCard';
import { getPromotionsByActive } from '../services/api';

const Promotions = () => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await getPromotionsByActive(true, 0, 3);
        setPromotions(Array.isArray(response?.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching promotions:', err);
        setError('Không thể tải khuyến mãi');
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const handleSeeAllClick = (event) => {
    event.preventDefault();
    window.scrollTo(0, 0);
    navigate('/promotions');
  };

  const handlePromotionClick = () => {
    window.scrollTo(0, 0);
    navigate('/promotions');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#605DEC]"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (!promotions || promotions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Hiện không có khuyến mãi nào.</p>
      </div>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#6E7491] mb-2">Khuyến mãi</h2>
            <p className="text-gray-600">Mã ưu đãi đang hoạt động cho chuyến bay của bạn</p>
          </div>
          <button
            onClick={handleSeeAllClick}
            className="flex items-center gap-2 text-[#605DEC] hover:text-[#4B48BF] transition-colors group"
          >
            <span>Xem tất cả</span>
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {promotions.map((promotion) => (
            <PromotionCard
              key={promotion.id}
              promotion={promotion}
              onClick={handlePromotionClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Promotions;
