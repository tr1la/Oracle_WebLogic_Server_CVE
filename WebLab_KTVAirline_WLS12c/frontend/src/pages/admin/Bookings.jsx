import { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaTrash, FaEdit, FaTimes } from 'react-icons/fa';
import { getTransactions, getTransactionsByConditions, getTransactionsByStatus, createTransaction, getFlights, createSeat, updateTransaction, updateSeat, deleteTransaction } from '../../services/api';
import { toast } from 'react-toastify';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const BookingFilters = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    flightName: '',
    dateFrom: '',
    dateTo: '',
    status: 'BOOKED'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((filters.dateFrom && !filters.dateTo) || (!filters.dateFrom && filters.dateTo)) {
      toast.error('Vui lòng chọn đầy đủ khoảng thời gian');
      return;
    }
    onFilter(filters);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-panel mb-6">
      <div className="admin-panel-header">
        <h2 className="text-xl font-bold">Bộ lọc đặt chỗ</h2>
        <p className="text-sm text-[#6E7491] mt-1">Lọc theo chuyến bay, ngày mua và trạng thái vé.</p>
      </div>
      <div className="admin-panel-body">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Chuyến bay</label>
          <input
            type="text"
            value={filters.flightName}
            onChange={(e) => setFilters({ ...filters, flightName: e.target.value })}
            placeholder="VN123"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Từ ngày</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Đến ngày</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="BOOKED">Đã đặt</option>
            <option value="ONGOING">Đang thực hiện</option>
            <option value="FREE">Tự do</option>
            <option value="HOLD">Đang giữ chỗ</option>
            <option value="ONTIME">Đúng giờ</option>
            <option value="DELAY">Delay</option>
            <option value="CANCEL">Đã hủy</option>
          </select>
        </div>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <FaSearch className="mr-2" />
            Tìm kiếm
          </button>
        </div>
      </div>
    </form>
  );
};

const BookingStats = ({ data }) => {
  const isRevenueBooking = (booking) => !['FREE', 'CANCEL', 'HOLD'].includes(booking.status);
  const stats = {
    totalBookings: data.length,
    totalRevenue: data.reduce((sum, booking) => {
      if (!isRevenueBooking(booking)) {
        return sum;
      }
      const price = parseFloat(booking.price || 0);
      return sum + (isNaN(price) ? 0 : price);
    }, 0),
    averageBookingValue: data.reduce((sum, booking) => {
      if (!isRevenueBooking(booking)) {
        return sum;
      }
      const price = parseFloat(booking.price || 0);
      return sum + (isNaN(price) ? 0 : price);
    }, 0) / data.filter(isRevenueBooking).length || 0
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="admin-stat-grid">
      <div className="admin-stat-card">
        <h3 className="text-lg font-medium text-gray-900">Tổng đơn đặt</h3>
        <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalBookings}</p>
      </div>
      <div className="admin-stat-card">
        <h3 className="text-lg font-medium text-gray-900">Doanh thu</h3>
        <p className="mt-2 text-3xl font-bold text-green-600">
          {formatCurrency(stats.totalRevenue)}
        </p>
      </div>
      <div className="admin-stat-card">
        <h3 className="text-lg font-medium text-gray-900">Trung bình/đơn</h3>
        <p className="mt-2 text-3xl font-bold text-purple-600">
          {formatCurrency(stats.averageBookingValue)}
        </p>
      </div>
    </div>
  );
};

const BookingForm = ({ onSubmit, initialData = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    flightId: '',
    seatName: '',
    seatType: 'ECONOMY',
    haveWindow: false,
    pictureLink: '',
    summary: '',
    status: 'BOOKED',
    price: '',
    flight: null,
    seat: null
  });

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const flightsResponse = await getFlights();

        if (flightsResponse.data) {
          setFlights(Array.isArray(flightsResponse.data) ? flightsResponse.data : [flightsResponse.data]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Cập nhật formData khi initialData thay đổi
  useEffect(() => {
    if (initialData) {
      setFormData({
        flightId: initialData.flight?.id || '',
        seatName: initialData.seat?.name || '',
        seatType: initialData.seat?.type || 'ECONOMY',
        haveWindow: initialData.seat?.haveWindow || false,
        pictureLink: initialData.seat?.pictureLink || '',
        summary: initialData.seat?.summary || '',
        status: initialData.status || 'BOOKED',
        price: initialData.price || '',
        flight: initialData.flight,
        seat: initialData.seat
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.flightId || !formData.seatName || !formData.price) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setLoading(true);
      
      if (initialData) {
        // 1. Cập nhật thông tin ghế trước
        const seatData = {
          id: initialData.seat.id,
          name: formData.seatName,
          type: formData.seatType,
          haveWindow: formData.haveWindow,
          pictureLink: formData.pictureLink,
          summary: formData.summary,
          createBy: initialData.seat.createBy,
          createDate: initialData.seat.createDate,
          isDeleted: initialData.seat.isDeleted,
          updateBy: 'admin'
        };

        await updateSeat(seatData);

        // 2. Sau đó cập nhật vé
        const updateData = {
          id: initialData.id,
          createBy: initialData.createBy,
          createDate: initialData.createDate,
          updateBy: 'admin',
          updateDate: new Date().toISOString(),
          user: initialData.user,
          flight: initialData.flight,
          seat: initialData.seat,
          status: formData.status,
          price: formData.price,
          deleted: initialData.deleted
        };
        await updateTransaction(updateData);
        toast.success('Cập nhật vé thành công');
        onSuccess();
      } else {
        // Tạo vé mới
        // 1. Tạo ghế mới trước
        const seatData = {
          name: formData.seatName,
          type: formData.seatType,
          haveWindow: formData.haveWindow,
          pictureLink: formData.pictureLink,
          summary: formData.summary,
          createBy: 'admin',
          updateBy: 'admin'
        };

        const seatResponse = await createSeat(seatData);
        if (!seatResponse.data) {
          throw new Error('Không thể tạo ghế');
        }

        // 2. Sau khi tạo ghế thành công, tạo đặt chỗ
        const selectedFlight = flights.find(f => f.id === Number(formData.flightId));
        const submitData = {
          flight: selectedFlight,
          seat: seatResponse.data,
          status: formData.status,
          price: formData.price,
          createBy: 'admin',
          updateBy: 'admin'
        };

        await onSubmit(submitData);
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating/updating booking:', error);
      toast.error('Có lỗi xảy ra khi tạo/cập nhật đặt chỗ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">
          {initialData ? 'Chỉnh sửa đặt chỗ' : 'Thêm đặt chỗ mới'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-700"
          title="Đóng"
        >
          <FaTimes />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Chuyến bay</label>
          <select
            value={formData.flightId || ''}
            onChange={(e) => setFormData({ ...formData, flightId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Chọn chuyến bay</option>
            {flights.map(flight => (
              <option key={flight.id} value={flight.id}>
                {flight.name} - {flight.departure} → {flight.arrival}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Thông tin ghế</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên ghế</label>
              <input
                type="text"
                value={formData.seatName}
                onChange={(e) => setFormData({ ...formData, seatName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="Ví dụ: A1, B2, C3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Loại ghế</label>
              <select
                value={formData.seatType}
                onChange={(e) => setFormData({ ...formData, seatType: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="ECONOMY">Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First Class</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="haveWindow"
                checked={formData.haveWindow}
                onChange={(e) => setFormData({ ...formData, haveWindow: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="haveWindow" className="ml-2 block text-sm text-gray-900">
                Có cửa sổ
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Link hình ảnh</label>
              <input
                type="text"
                value={formData.pictureLink}
                onChange={(e) => setFormData({ ...formData, pictureLink: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://example.com/seat-image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mô tả</label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows="3"
                placeholder="Mô tả về ghế..."
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Thông tin đặt chỗ</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="BOOKED">Đã đặt</option>
                <option value="ONGOING">Đang thực hiện</option>
                <option value="FREE">Tự do</option>
                <option value="HOLD">Đang giữ chỗ</option>
                <option value="ONTIME">Đúng giờ</option>
                <option value="DELAY">Delay</option>
                <option value="CANCEL">Đã hủy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Giá vé</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="Nhập giá vé"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {initialData ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      let response;
      
      if (filters) {
        if (filters.status === 'ALL') {
          response = await getTransactions(page);
        } else if (filters.flightName || filters.dateFrom || filters.dateTo) {
          response = await getTransactionsByConditions(
            filters.flightName || '',
            filters.dateFrom || '',
            filters.dateTo || '',
            filters.status,
            page,
            10
          );
        } else {
          response = await getTransactionsByStatus(filters.status);
        }
      } else {
        response = await getTransactions(page);
      }

      if (response.data) {
        setBookings(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 404) {
        setBookings([]);
        setTotalPages(0);
      } else {
        toast.error('Không thể tải dữ liệu: ' + (error.response?.data || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filters]);

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      if (editingBooking) {
        // Cập nhật vé
        await updateTransaction(editingBooking.id, formData);
        toast.success('Cập nhật vé thành công');
      } else {
        // Thêm vé mới
        await createTransaction(formData);
        toast.success('Thêm đặt chỗ thành công');
      }
      fetchData();
      setShowForm(false);
      setEditingBooking(null);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
      console.error('Error submitting booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    fetchData();
    setShowForm(false);
    setEditingBooking(null);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleAddNew = () => {
    setEditingBooking(null);
    setShowForm(false);
    setTimeout(() => {
      setShowForm(true);
    }, 100);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vé này?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteTransaction(id);
      toast.success('Xóa vé thành công');
      fetchData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Không thể xóa vé');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-container">
        <AdminPageHeader
          title="Quản lý đặt chỗ"
          description="Theo dõi giao dịch vé, trạng thái ghế, doanh thu và các thay đổi trong vòng đời đặt chỗ."
          actions={(
            <button
              onClick={handleAddNew}
              className="flex items-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              <FaPlus className="mr-2" />
              Thêm đặt chỗ
            </button>
          )}
        />

        <BookingFilters onFilter={handleFilter} />
        <BookingStats data={bookings} />

        <div className="admin-stack-layout">
          {showForm && (
            <div className="admin-stack-block">
              <BookingForm
                onSubmit={handleSubmit}
                initialData={editingBooking}
                onSuccess={handleSuccess}
                onCancel={() => {
                  setShowForm(false);
                  setEditingBooking(null);
                }}
              />
            </div>
          )}

          <div className="admin-main-column">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 className="text-xl font-bold">Danh sách đặt chỗ</h2>
                <p className="text-sm text-[#6E7491] mt-1">{bookings.length} vé đang hiển thị</p>
              </div>
              <div className="admin-table-wrap">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    {bookings.length === 0 ? (
                      <div className="flex justify-center items-center h-32 text-gray-500">
                        Không tìm thấy vé
                      </div>
                    ) : (
                      <>
                        <table className="min-w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-left py-3 px-4 border-b">Mã đặt chỗ</th>
                              <th className="text-left py-3 px-4 border-b">Khách hàng</th>
                              <th className="text-left py-3 px-4 border-b">Chuyến bay</th>
                              <th className="text-left py-3 px-4 border-b">Ngày đặt</th>
                              <th className="text-left py-3 px-4 border-b">Trạng thái</th>
                              <th className="text-left py-3 px-4 border-b">Hạng ghế</th>
                              <th className="text-right py-3 px-4 border-b">Tổng tiền</th>
                              <th className="text-right py-3 px-4 border-b">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.map((booking) => (
                              <tr key={booking.id} className="hover:bg-gray-50">
                                <td className="py-3 px-4 border-b font-medium">
                                  {booking.id}
                                </td>
                                <td className="py-3 px-4 border-b">
                                  <div>{booking.user?.name}</div>
                                  <div className="text-sm text-gray-500">{booking.user?.email}</div>
                                </td>
                                <td className="py-3 px-4 border-b">
                                  <div>{booking.flight?.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {booking.flight?.departure} → {booking.flight?.arrival}
                                  </div>
                                </td>
                                <td className="py-3 px-4 border-b">
                                  {formatDateTime(booking.createDate)}
                                </td>
                                <td className="py-3 px-4 border-b">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      booking.status === 'BOOKED'
                                        ? 'bg-blue-100 text-blue-800'
                                        : booking.status === 'ONGOING'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : booking.status === 'FREE'
                                        ? 'bg-green-100 text-green-800'
                                        : booking.status === 'HOLD'
                                        ? 'bg-purple-100 text-purple-800'
                                        : booking.status === 'ONTIME'
                                        ? 'bg-green-100 text-green-800'
                                        : booking.status === 'DELAY'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {booking.status === 'BOOKED'
                                      ? 'Đã đặt'
                                      : booking.status === 'ONGOING'
                                      ? 'Đang thực hiện'
                                      : booking.status === 'FREE'
                                      ? 'Tự do'
                                      : booking.status === 'HOLD'
                                      ? 'Đang giữ chỗ'
                                      : booking.status === 'ONTIME'
                                      ? 'Đúng giờ'
                                      : booking.status === 'DELAY'
                                      ? 'Delay'
                                      : 'Đã hủy'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 border-b">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    booking.seat?.type === 'ECONOMY'
                                      ? 'bg-gray-100 text-gray-800'
                                      : booking.seat?.type === 'BUSINESS'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {booking.seat?.type === 'ECONOMY'
                                      ? 'Economy'
                                      : booking.seat?.type === 'BUSINESS'
                                      ? 'Business'
                                      : 'First Class'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 border-b text-right">
                                  {formatCurrency(booking.price)}
                                </td>
                                <td className="py-3 px-4 border-b text-right">
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => {
                                        setEditingBooking(booking);
                                        setShowForm(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-800"
                                      disabled={loading}
                                    >
                                      <FaEdit />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(booking.id)}
                                      className="text-red-600 hover:text-red-800"
                                      disabled={loading}
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {totalPages > 1 && (
                          <div className="flex justify-center py-4 gap-2">
                            {Array.from({ length: totalPages }).map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setPage(index)}
                                className={`px-3 py-1 rounded ${
                                  page === index
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                                disabled={loading}
                              >
                                {index + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
