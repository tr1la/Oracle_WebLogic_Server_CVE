import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { searchFlights, getTransactionsByFlight, getUserByEmail, getFlightAvailability } from "../services/api";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { toast } from "react-toastify";
import { vi } from "date-fns/locale";
import { formatCurrency } from "../utils/format";
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaVenusMars, FaMapMarkerAlt } from "react-icons/fa";
import { MdOutlineClose } from "react-icons/md";
import { useAuth } from "../contexts/AuthContext";
import Signin from "../container/Signin";

const SEAT_CLASS_OPTIONS = [
  {
    type: "ECONOMY",
    label: "Economy",
    bgClass: "bg-green-50",
    hoverClass: "hover:bg-green-100",
    badgeClass: "bg-green-700",
  },
  {
    type: "COMFORT",
    label: "Comfort",
    bgClass: "bg-cyan-50",
    hoverClass: "hover:bg-cyan-100",
    badgeClass: "bg-cyan-700",
  },
  {
    type: "BUSINESS",
    label: "Business",
    bgClass: "bg-blue-50",
    hoverClass: "hover:bg-blue-100",
    badgeClass: "bg-blue-700",
  },
  {
    type: "FIRST",
    label: "First Class",
    bgClass: "bg-purple-50",
    hoverClass: "hover:bg-purple-100",
    badgeClass: "bg-purple-700",
  },
];

const getSeatClassField = (seatType, suffix) => {
  return `${seatType.toLowerCase()}${suffix}`;
};

const PassengerModal = ({ isOpen, onClose, flightInfo, selectedClass, onSubmit, searchData }) => {
  const { user } = useAuth();
  const totalPassengers = searchData.adult + searchData.minor;
  const [passengers, setPassengers] = useState(
    Array(totalPassengers).fill().map(() => ({
      name: "",
      email: "",
      phoneNum: "",
      birthday: "",
      gender: "",
      address: "",
    }))
  );

  // Add gender conversion function
  const convertGenderValue = (gender) => {
    if (!gender) return "";
    const upperGender = gender.toUpperCase();
    switch (upperGender) {
      case "MALE":
      case "NAM":
      case "M":
        return "MALE";
      case "FEMALE":
      case "NỮ":
      case "F":
        return "FEMALE";
      case "OTHER":
      case "KHÁC":
      case "O":
        return "OTHER";
      default:
        return upperGender;
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user?.email) {
          const response = await getUserByEmail(user.email);
          const userData = response.data;
          
          // Cập nhật thông tin cho hành khách đầu tiên
          setPassengers(prevPassengers => {
            const newPassengers = [...prevPassengers];
            newPassengers[0] = {
              name: userData.name || "",
              email: userData.email || "",
              phoneNum: userData.phoneNum || "",
              birthday: userData.birthday ? new Date(userData.birthday).toISOString().split('T')[0] : "",
              gender: convertGenderValue(userData.gender),
              address: userData.address || "",
            };
            return newPassengers;
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Không thể tải thông tin người dùng');
      }
    };

    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen, user]);

  const handleChange = (index, e) => {
    const newPassengers = [...passengers];
    newPassengers[index] = {
      ...newPassengers[index],
      [e.target.name]: e.target.value
    };
    setPassengers(newPassengers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate all forms
    const isValid = passengers.every(passenger => 
      passenger.name && 
      passenger.email && 
      passenger.phoneNum && 
      passenger.birthday && 
      passenger.gender && 
      passenger.address
    );

    if (!isValid) {
      toast.warning("Vui lòng điền đầy đủ thông tin cho tất cả hành khách.");
      return;
    }

    onSubmit(passengers);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-[800px] rounded-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#1A1D1F]">Thông tin hành khách</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <MdOutlineClose size={24} />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-[#1A1D1F] mb-2">Chi tiết chuyến bay</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Chuyến bay</p>
                <p className="font-medium">{flightInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hạng vé</p>
                <p className="font-medium">{selectedClass}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Điểm khởi hành</p>
                <p className="font-medium">{flightInfo.departure}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Điểm đến</p>
                <p className="font-medium">{flightInfo.arrival}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {passengers.map((passenger, index) => (
            <div key={index} className="border-t pt-6">
              <h3 className="text-lg font-medium text-[#1A1D1F] mb-4">
                Hành khách {index + 1}
              </h3>
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={passenger.name}
                    onChange={(e) => handleChange(index, e)}
                    placeholder="Họ và tên"
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#605DEC] focus:border-[#605DEC]"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={passenger.email}
                    onChange={(e) => handleChange(index, e)}
                    placeholder="Email"
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#605DEC] focus:border-[#605DEC]"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phoneNum"
                    value={passenger.phoneNum}
                    onChange={(e) => handleChange(index, e)}
                    placeholder="Số điện thoại"
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#605DEC] focus:border-[#605DEC]"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendar className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="birthday"
                    value={passenger.birthday}
                    onChange={(e) => handleChange(index, e)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#605DEC] focus:border-[#605DEC]"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaVenusMars className="text-gray-400" />
                  </div>
                  <select
                    name="gender"
                    value={passenger.gender}
                    onChange={(e) => handleChange(index, e)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#605DEC] focus:border-[#605DEC]"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="address"
                    value={passenger.address}
                    onChange={(e) => handleChange(index, e)}
                    placeholder="Địa chỉ"
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#605DEC] focus:border-[#605DEC]"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="submit"
            className="w-full py-3 bg-[#605DEC] text-white rounded-lg hover:bg-[#4B48BF] transition-colors"
          >
            Tiếp tục
          </button>
        </form>
      </div>
    </div>
  );
};

const FlightChoose = ({ searchData }) => {
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("time_asc");
  const [seatPrice, setSeatPrice] = useState({});
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showSignin, setShowSignin] = useState(false);
  const { user } = useAuth();

  const calculateAvailableSeats = async (flightId) => {
    try {
      const availabilityResponse = await getFlightAvailability(flightId);
      const availability = availabilityResponse.data || {};

      const result = SEAT_CLASS_OPTIONS.reduce((seatInfo, seatClass) => {
        const classAvailability = availability[seatClass.type] || {};
        return {
          ...seatInfo,
          [getSeatClassField(seatClass.type, "SeatsAvailable")]: Number(classAvailability.availableSeats || 0),
          [getSeatClassField(seatClass.type, "Price")]: classAvailability.price || 0,
        };
      }, {});

      return result;
    } catch (error) {
      console.error('Error calculating available seats:', error);
      return SEAT_CLASS_OPTIONS.reduce((seatInfo, seatClass) => ({
        ...seatInfo,
        [getSeatClassField(seatClass.type, "SeatsAvailable")]: 0,
        [getSeatClassField(seatClass.type, "Price")]: 0,
      }), {});
    }
  };

  useEffect(() => {
    const fetchFlights = async () => {
      if (!searchData.from || !searchData.to || !searchData.startDate || !searchData.endDate) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const formattedStartDate = format(new Date(searchData.startDate), 'yyyy-MM-dd');
        const formattedEndDate = format(new Date(searchData.endDate), 'yyyy-MM-dd');

        const response = await searchFlights(
          "",
          formattedStartDate,
          formattedEndDate,
          searchData.from,
          searchData.to
        );

        if (response.data.status === "SUCCESS") {
          // Tính số ghế trống cho tất cả chuyến bay
          const seatsInfo = {};
          const totalPassengers = searchData.adult + searchData.minor;
          
          // Lọc các chuyến bay có đủ ghế
          const availableFlights = [];
          for (const flight of response.data.data) {
            const seats = await calculateAvailableSeats(flight.id);
            seatsInfo[flight.id] = seats;
            
            // Kiểm tra nếu ít nhất một hạng ghế có đủ chỗ
            const hasEnoughSeats = SEAT_CLASS_OPTIONS.some((seatClass) =>
              seats[getSeatClassField(seatClass.type, "SeatsAvailable")] >= totalPassengers
            );
                                     
            // Chỉ thêm chuyến bay nếu có ít nhất một hạng ghế đủ chỗ
            if (hasEnoughSeats) {
              availableFlights.push(flight);
            }
          }
          
          setFlights(availableFlights);
          setSeatPrice(seatsInfo);
          
          if (availableFlights.length === 0) {
            setError("Không tìm thấy chuyến bay nào có đủ ghế cho số lượng hành khách");
            toast.error("Không tìm thấy chuyến bay nào có đủ ghế cho số lượng hành khách");
          }
        } else {
          setError(response.data.message || "Không thể tìm thấy chuyến bay phù hợp");
          toast.error(response.data.message || "Không thể tìm thấy chuyến bay phù hợp");
        }
      } catch (err) {
        console.error("Error fetching flights:", err);
        setError("Đã có lỗi xảy ra khi tìm kiếm chuyến bay");
        toast.error("Đã có lỗi xảy ra khi tìm kiếm chuyến bay");
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [searchData]);

  const calculateDuration = (startTime, endTime) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    const diffInMinutes = differenceInMinutes(end, start);
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  const sortFlights = (flights) => {
    const sortedFlights = [...flights];
    switch (sortBy) {
      case "time_asc":
        return sortedFlights.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      case "time_desc":
        return sortedFlights.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      case "duration_asc":
        return sortedFlights.sort((a, b) => 
          differenceInMinutes(parseISO(a.endTime), parseISO(a.startTime)) -
          differenceInMinutes(parseISO(b.endTime), parseISO(b.startTime))
        );
      default:
        return sortedFlights;
    }
  };

  const handleClassSelection = async (flight, seatClass) => {
    if (!user) {
      setShowSignin(true);
      return;
    }
    try {
      // Lấy tất cả transactions của chuyến bay
      const transactionsResponse = await getTransactionsByFlight(flight.id);
      
      if (!transactionsResponse.data) {
        toast.error("Không thể lấy thông tin ghế");
        return;
      }

      // Lọc các ghế còn có thể đặt theo hạng ghế
      const availableSeats = transactionsResponse.data.filter(
        transaction => transaction.seat?.type === seatClass
                      && (['FREE', 'CANCEL'].includes(transaction.status)
                        || (transaction.status === 'HOLD'
                          && String(transaction.user?.id) === String(user?.id)))
      );

      // Lấy đủ số ghế cần thiết
      const seats = availableSeats.slice(0, searchData.adult + searchData.minor);
      setSelectedSeats(seats);
      setSelectedFlight(flight);
      setSelectedClass(seatClass);
      setShowPassengerModal(true);
    } catch (error) {
      console.error("Error selecting seats:", error);
      toast.error("Không thể chọn ghế");
    }
  };

  const handlePassengerSubmit = (passengers) => {
    // Combine flight and passenger data
    const bookingData = {
      flight: selectedFlight,
      passengers: passengers,
      seatClass: selectedClass,
      selectedSeats: selectedSeats,
      price: seatPrice[selectedFlight.id][getSeatClassField(selectedClass, "Price")]
    };

    // Store booking data in localStorage for next steps
    localStorage.setItem('currentBooking', JSON.stringify(bookingData));
    
    // Close modal and navigate to next step
    setShowPassengerModal(false);
    navigate(`/flight/${selectedFlight.id}/confirm`);
  };

  const renderFlightInfo = (flight) => {
    const startDate = parseISO(flight.startTime);
    const endDate = parseISO(flight.endTime);
    const duration = calculateDuration(flight.startTime, flight.endTime);
    const statusColors = {
      OPEN: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
      DELAY: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
      CANCELLED: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" }
    };
    const status = statusColors[flight.status] || statusColors.OPEN;
    const flightSeats = seatPrice[flight.id] || {};
    const totalPassengers = searchData.adult + searchData.minor;

    return (
      <div key={flight.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:border-[#605DEC] transition-all duration-300 overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-[#1A1D1F]">{flight.name}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text} ${status.border} border`}>
                {flight.status === 'OPEN' ? 'Sẵn sàng' : flight.status === 'DELAY' ? 'Trễ chuyến' : 'Đã hủy'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {format(startDate, "EEEE, dd/MM/yyyy", { locale: vi })}
              </div>
            </div>
          </div>

          {/* Flight Route */}
          <div className="flex items-center gap-4">
            {/* Departure */}
            <div className="flex-1">
              <div className="text-2xl font-bold text-[#1A1D1F]">
                {format(startDate, "HH:mm")}
              </div>
              <div className="mt-1">
                <div className="font-medium text-[#1A1D1F]">{flight.departureCode}</div>
                <div className="text-sm text-gray-500">{flight.departure}</div>
              </div>
            </div>

            {/* Flight Path */}
            <div className="flex-1 flex flex-col items-center px-4">
              <div className="text-sm font-medium text-gray-500 mb-2">{duration}</div>
              <div className="w-full flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#605DEC]"></div>
                <div className="flex-1 h-0.5 bg-[#605DEC]"></div>
                <div className="w-3 h-3 rounded-full bg-[#605DEC]"></div>
              </div>
              <div className="text-sm text-gray-500 mt-2">Bay thẳng</div>
            </div>

            {/* Arrival */}
            <div className="flex-1 text-right">
              <div className="text-2xl font-bold text-[#1A1D1F]">
                {format(endDate, "HH:mm")}
              </div>
              <div className="mt-1">
                <div className="font-medium text-[#1A1D1F]">{flight.arrivalCode}</div>
                <div className="text-sm text-gray-500">{flight.arrival}</div>
              </div>
            </div>
          </div>

          {/* Flight Details and Ticket Classes */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2 xl:grid-cols-4">
              {SEAT_CLASS_OPTIONS.map((seatClass) => {
                const availableSeats = flightSeats[getSeatClassField(seatClass.type, "SeatsAvailable")] || 0;
                const price = flightSeats[getSeatClassField(seatClass.type, "Price")] || 0;
                const canSelectSeatClass = availableSeats >= totalPassengers && flight.status === 'OPEN';

                return (
                  <button
                    key={seatClass.type}
                    onClick={() => handleClassSelection(flight, seatClass.type)}
                    disabled={!canSelectSeatClass}
                    className={`relative rounded-lg p-4 text-left transition-all ${seatClass.bgClass}
                      ${canSelectSeatClass
                        ? `${seatClass.hoverClass} cursor-pointer`
                        : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <div className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded ${seatClass.badgeClass}`}>
                      {availableSeats} chỗ còn lại
                    </div>
                    <h3 className="pr-20 text-lg font-semibold text-gray-800 mb-1">{seatClass.label}</h3>
                    <p className="text-xl font-bold text-[#1A1D1F]">
                      {formatCurrency(price)} <span className="text-sm text-gray-500">VND</span>
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-sm text-gray-500">Máy bay</div>
                  <div className="font-medium text-[#1A1D1F]">{flight.plane?.name || "Chưa có thông tin"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Cổng</div>
                  <div className="font-medium text-[#1A1D1F]">{flight.gate}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#605DEC]"></div>
        <div className="mt-4 text-gray-500">Đang tìm kiếm chuyến bay phù hợp...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-200">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-red-700 font-medium">{error}</div>
        </div>
      </div>
    );
  }

  if (!flights.length) {
    return (
      <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-yellow-700 font-medium">
            Không tìm thấy chuyến bay nào phù hợp với tiêu chí tìm kiếm
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1D1F]">
            Đã tìm thấy {flights.length} chuyến bay
          </h2>
          <p className="text-gray-500 mt-1">
            {searchData.from} → {searchData.to}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500">Sắp xếp theo:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#605DEC]/20 focus:border-[#605DEC]"
          >
            <option value="time_asc">Giờ khởi hành sớm nhất</option>
            <option value="time_desc">Giờ khởi hành muộn nhất</option>
            <option value="duration_asc">Thời gian bay ngắn nhất</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {sortFlights(flights).map(renderFlightInfo)}
      </div>

      {showPassengerModal && selectedFlight && (
        <PassengerModal
          isOpen={showPassengerModal}
          onClose={() => setShowPassengerModal(false)}
          flightInfo={selectedFlight}
          selectedClass={selectedClass}
          onSubmit={handlePassengerSubmit}
          searchData={searchData}
        />
      )}

      {showSignin && (
        <Signin
          setSignin={setShowSignin}
          setSignup={() => {}}
        />
      )}
    </div>
  );
};

export default FlightChoose;
