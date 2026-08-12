import { useState, useEffect } from 'react';
import { getNewsByCategory } from '../services/api';
import PlacesCard from '../container/PlacesCard';
import { useNavigate } from 'react-router-dom';

const AllPlaces = () => {
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await getNewsByCategory('PLACE', 0, 1000);
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

  const handlePlaceClick = (place) => {
    // Lưu thông tin địa điểm vào localStorage hoặc state management
    localStorage.setItem('selectedPlace', JSON.stringify(place));
    // Chuyển đến trang chi tiết địa điểm
    navigate('/place-detail', { state: { placeInfo: place } });
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
    <div className="container mx-auto px-4 py-8 mt-[70px]">
      <h1 className="text-3xl font-bold text-[#6E7491] mb-8">Địa điểm du lịch</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {places.map((place) => (
          <div key={place.id} onClick={() => handlePlaceClick(place)} className="cursor-pointer">
            <PlacesCard
              image={place.pictureLink}
              title={place.title}
              name={place.summary}
              des={place.content}
              author={place.author}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllPlaces; 