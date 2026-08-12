import { useNavigate } from "react-router-dom";
import PlacesCard from "../container/PlacesCard";
import { useState, useEffect } from 'react';
import { getNewsByCategory } from '../services/api';
import { FaArrowRight } from 'react-icons/fa';

const Places = () => {
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await getNewsByCategory('PLACE', 0, 3);
        if (response?.data) {
          setPlaces(Array.isArray(response.data) ? response.data : []);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching places:', err);
        setError('Không thể tải địa điểm du lịch');
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  const handleSeeAllClick = (e) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    navigate('/all-places');
  };

  const handlePlaceClick = (place) => {
    localStorage.setItem('selectedPlace', JSON.stringify(place));
    navigate('/place-detail', { state: { placeInfo: place } });
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#54cdb7]"></div>
    </div>
  );

  if (error) return (
    <div className="text-red-500 text-center py-4">{error}</div>
  );

  if (!places || places.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Hiện không có địa điểm du lịch nào.</p>
      </div>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#6E7491] mb-2">Địa điểm du lịch</h2>
            <p className="text-gray-600">Khám phá những điểm đến hấp dẫn</p>
          </div>
          <button
            onClick={handleSeeAllClick}
            className="flex items-center gap-2 text-[#54cdb7] hover:text-[#3da192] transition-colors group"
          >
            <span>Xem tất cả</span>
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {places.map((place) => (
            <div key={place.id} onClick={() => handlePlaceClick(place)} className="cursor-pointer">
              <PlacesCard
                image={place.pictureLink}
                title={place.title}
                name={place.summary}
                desc={place.content}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Places;
