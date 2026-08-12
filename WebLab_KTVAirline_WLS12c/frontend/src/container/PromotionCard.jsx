/* eslint-disable react/prop-types */

import { FaCalendarAlt, FaPlaneDeparture, FaTag } from 'react-icons/fa';

const fallbackImage = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200&auto=format&fit=crop';

const seatTypeLabels = {
  ECONOMY: 'Phổ thông',
  COMFORT: 'Comfort',
  BUSINESS: 'Thương gia',
  FIRST: 'Hạng nhất',
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  return Number(value).toLocaleString('vi-VN') + '₫';
};

const formatDiscount = (promotion) => {
  if (promotion.discountType === 'FIXED_AMOUNT') {
    return formatCurrency(promotion.discountValue);
  }

  return `${Number(promotion.discountValue || 0).toLocaleString('vi-VN')}%`;
};

const formatDate = (value) => {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleDateString('vi-VN');
};

const getRouteText = (promotion) => {
  if (promotion.departure && promotion.arrival) {
    return `${promotion.departure} - ${promotion.arrival}`;
  }
  if (promotion.departure) {
    return `Khởi hành từ ${promotion.departure}`;
  }
  if (promotion.arrival) {
    return `Bay đến ${promotion.arrival}`;
  }

  return 'Áp dụng nhiều hành trình';
};

const PromotionCard = ({ promotion, onClick }) => {
  return (
    <button
      type="button"
      onClick={() => onClick?.(promotion)}
      className="w-full h-full text-left bg-white rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
    >
      <div className="relative">
        <img
          src={promotion.pictureLink || fallbackImage}
          alt={promotion.title}
          className="w-full h-64 object-cover"
          onError={(event) => {
            event.currentTarget.src = fallbackImage;
          }}
        />
        <div className="absolute top-4 left-4 bg-white/95 text-[#605DEC] px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
          {promotion.code}
        </div>
        <div className="absolute top-4 right-4 bg-[#605DEC] text-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
          Giảm {formatDiscount(promotion)}
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-semibold text-[#6E7491] line-clamp-2">
            {promotion.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">{promotion.description}</p>

          <div className="flex items-center gap-2 text-sm text-[#605DEC] font-medium">
            <FaPlaneDeparture className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">{getRouteText(promotion)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6F6FE] text-[#605DEC] text-sm font-medium">
              <FaTag className="w-3 h-3" />
              {promotion.seatType ? seatTypeLabels[promotion.seatType] || promotion.seatType : 'Mọi hạng ghế'}
            </span>
            {promotion.minimumOrderAmount && (
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                Từ {formatCurrency(promotion.minimumOrderAmount)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-between items-center gap-4">
          <span className="text-sm text-[#605DEC] font-medium">Xem ưu đãi</span>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FaCalendarAlt className="w-4 h-4" />
            <span>{formatDate(promotion.endDate)}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default PromotionCard;
