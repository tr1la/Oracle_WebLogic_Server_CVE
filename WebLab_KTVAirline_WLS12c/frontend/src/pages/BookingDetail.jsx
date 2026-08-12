import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FaPlane, FaUser, FaEnvelope, FaPhone, FaCalendar, FaVenusMars, FaMapMarkerAlt } from 'react-icons/fa';
import { getTransactionById, updateTransaction } from '../services/api';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/format';
import useProtectedUploadUrl from '../hooks/useProtectedUploadUrl';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchBookingDetail = async () => {
      try {
        const response = await getTransactionById(id);
        setBooking(response.data);
      } catch (error) {
        console.error('Error fetching booking details:', error);
        toast.error('Không thể tải thông tin vé. Vui lòng thử lại sau.');
        navigate('/booking-history');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetail();
  }, [id, navigate]);

  const protectedQrCode = useProtectedUploadUrl(booking?.qrCode || '');

  const handleCancelBooking = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy vé này?')) {
      return;
    }

    try {
      setCancelling(true);
      
      const cancelData = {
        ...booking,
        user: null,
        status: 'CANCEL',
        updateBy: 'user',
        updateDate: new Date().toISOString()
      };

      await updateTransaction(cancelData);
      toast.success('Hủy vé thành công!');
      navigate('/booking-history');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Có lỗi xảy ra khi hủy vé. Vui lòng thử lại sau.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#605DEC]"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Không tìm thấy thông tin vé</h2>
          <button
            onClick={() => navigate('/booking-history')}
            className="mt-4 px-4 py-2 bg-[#605DEC] text-white rounded-lg hover:bg-[#4B48BF] transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const { flight, user, status } = booking;

  const getStatusColor = (status) => {
    switch (status) {
      case 'BOOKED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCEL':
        return 'bg-red-100 text-red-800';
      case 'ONTIME':
        return 'bg-green-100 text-green-800';
      case 'DELAY':
        return 'bg-yellow-100 text-yellow-800';
      case 'HOLD':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'BOOKED':
        return 'Đã đặt';
      case 'CANCEL':
        return 'Đã hủy';
      case 'ONTIME':
        return 'Đã hoàn thành';
      case 'DELAY':
        return 'Bị trễ';
      case 'HOLD':
        return 'Đang giữ chỗ';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#605DEC] text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Chi tiết vé máy bay</h1>
                <p className="mt-2 text-white/80">Mã đặt vé: {booking.id}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                {getStatusText(status)}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Flight Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin chuyến bay</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#F6F6FE] rounded-full flex items-center justify-center">
                    <FaPlane className="w-6 h-6 text-[#605DEC]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {flight.departure} ({flight.departureCode}) → {flight.arrival} ({flight.arrivalCode})
                    </h3>
                    <p className="text-gray-500">Mã chuyến bay: {flight.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Khởi hành</p>
                    <p className="font-medium text-gray-900">
                      {format(parseISO(flight.startTime), "HH:mm - EEEE, dd/MM/yyyy", { locale: vi })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Đến nơi</p>
                    <p className="font-medium text-gray-900">
                      {format(parseISO(flight.endTime), "HH:mm - EEEE, dd/MM/yyyy", { locale: vi })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Máy bay</p>
                    <p className="font-medium text-gray-900">{flight.plane?.name || "Chưa có thông tin"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cổng</p>
                    <p className="font-medium text-gray-900">{flight.gate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin hành khách</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <FaUser className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Họ và tên</p>
                      <p className="font-medium text-gray-900">{user?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaEnvelope className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaPhone className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Số điện thoại</p>
                      <p className="font-medium text-gray-900">{user?.phoneNum}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaCalendar className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Ngày sinh</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(user?.birthday), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaVenusMars className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Giới tính</p>
                      <p className="font-medium text-gray-900">
                        {user?.gender === 'MALE' ? 'Nam' : 
                         user?.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Địa chỉ</p>
                      <p className="font-medium text-gray-900">{user?.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin vé</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Ghế</p>
                    <p className="font-medium text-gray-900">
                      {booking.seat?.name} ({booking.seat?.type})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Giá vé</p>
                    <p className="text-xl font-semibold text-[#605DEC]">{formatCurrency(booking.price)} VND</p>
                  </div>
                </div>
                {booking.qrCode && protectedQrCode && (
                  <div className="border-t border-gray-200 pt-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="h-36 w-36 shrink-0 rounded-lg border border-gray-200 bg-white p-2">
                        <img
                          src={protectedQrCode}
                          alt="Mã QR đặt vé"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mã QR đặt vé</p>
                        <p className="font-medium text-gray-900">Mã đặt vé: {booking.id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                onClick={() => navigate('/booking-history')}
                className="px-6 py-2 border border-[#605DEC] text-[#605DEC] rounded-lg hover:bg-[#F6F6FE] transition-colors"
              >
                Quay lại
              </button>
              {status === 'BOOKED' && (
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Đang hủy...' : 'Hủy vé'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
