import { useEffect, useState } from 'react';
import PromotionCard from '../container/PromotionCard';
import { getPromotionsByActive } from '../services/api';

const AllPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await getPromotionsByActive(true, 0, 1000);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
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
    <div className="container mx-auto px-4 py-8 mt-[70px]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#6E7491] mb-2">Khuyến mãi</h1>
        <p className="text-gray-600">Tổng hợp các mã ưu đãi đang hoạt động</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {promotions.map((promotion) => (
          <PromotionCard key={promotion.id} promotion={promotion} />
        ))}
      </div>
    </div>
  );
};

export default AllPromotions;
