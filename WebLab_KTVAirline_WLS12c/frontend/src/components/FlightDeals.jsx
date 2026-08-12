import { useNavigate } from "react-router-dom";
import FlightDealsCard from "../container/FlightDealsCard";
import { useState, useEffect } from 'react';
import { getNewsByCategory } from '../services/api';
import { FaArrowRight } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const FlightDeals = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await getNewsByCategory('FLIGHT_DEAL', 0, 3);
        console.log('API Response:', response); // Debug log
        if (response?.data) {
          const dealsData = Array.isArray(response.data) ? response.data : [];
          console.log('Deals data:', dealsData); // Debug log
          setDeals(dealsData);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching flight deals:', err);
        setError('Không thể tải ưu đãi chuyến bay');
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const handleSeeAllClick = (e) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    navigate('/all-flight-deals');
  };

  const handleDealClick = (deal) => {
    // Debug log
    console.log('Deal clicked:', deal);
    
    // Try to extract cities from summary or title
    let departure, arrival;
    
    if (deal.summary && deal.summary.includes(' - ')) {
      [departure, arrival] = deal.summary.split(' - ');
    } else if (deal.title && deal.title.includes(' - ')) {
      [departure, arrival] = deal.title.split(' - ');
    } else {
      console.error('Could not parse cities from deal:', deal);
      toast.error('Không thể xử lý thông tin chuyến bay');
      return;
    }
    
    // Debug log
    console.log('Parsed cities:', { departure, arrival });
    
    // Trim any whitespace
    departure = departure.trim();
    arrival = arrival.trim();
    
    // Remove any "From" prefix if exists
    departure = departure.replace(/^From\s+/i, '');
    
    // Create search URL with default parameters
    const today = new Date();
    const startDate = today;
    
    // Tính ngày kết thúc là 3 tháng sau ngày hôm nay
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 3);
    
    // Format dates
    const formattedStartDate = format(startDate, "yyyy-MM-dd");
    const formattedEndDate = format(endDate, "yyyy-MM-dd");
    
    // Debug logs
    console.log('Today:', today);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
    console.log('Formatted dates:', { formattedStartDate, formattedEndDate });

    const searchUrl = `/explore?from=${encodeURIComponent(departure)}&to=${encodeURIComponent(arrival)}&startDate=${formattedStartDate}&endDate=${formattedEndDate}&adult=1&minor=0`;
    
    // Debug log
    console.log('Search URL:', searchUrl);

    // Navigate to explore with search parameters
    navigate(searchUrl);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#605DEC]"></div>
    </div>
  );

  if (error) return (
    <div className="text-red-500 text-center py-4">{error}</div>
  );

  if (!deals || deals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Hiện không có ưu đãi chuyến bay nào.</p>
      </div>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#6E7491] mb-2">Ưu đãi chuyến bay</h2>
            <p className="text-gray-600">Khám phá những chuyến bay giá tốt nhất</p>
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
          {deals.map((deal) => (
            <div key={deal.id} onClick={() => handleDealClick(deal)} className="cursor-pointer">
              <FlightDealsCard
                image={deal.pictureLink}
                title={deal.title}
                name={deal.summary}
                price={deal.content}
                des={deal.author}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlightDeals;
