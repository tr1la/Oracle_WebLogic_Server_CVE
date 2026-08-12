import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import { getFlights, createFlight, updateFlight, deleteFlight, getPlanes, getTransactionsByConditions, getTransactionsByFlight, updateTransaction } from '../../services/api';
import { toast } from 'react-toastify';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const FlightForm = ({ onSubmit, initialData = null, planes = [], onCancel }) => {
  console.log('Initial planes:', planes);
  console.log('Initial data:', initialData);

  const [formData, setFormData] = useState({
    name: '',
    planeId: '',
    startTime: '',
    endTime: '',
    status: 'OPEN',
    departure: '',
    departureCode: '',
    arrival: '',
    arrivalCode: '',
    gate: '',
    ...initialData
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        planeId: initialData.plane?.id || '',
        plane: initialData.plane || null,
        startTime: initialData.startTime,
        endTime: initialData.endTime,
        status: initialData.status || 'OPEN',
        departure: initialData.departure || '',
        departureCode: initialData.departureCode || '',
        arrival: initialData.arrival || '',
        arrivalCode: initialData.arrivalCode || '',
        gate: initialData.gate || ''
      });
    }
  }, [initialData]);

  useEffect(() => {
    console.log('Current formData:', formData);
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.name || !formData.planeId || !formData.startTime || !formData.endTime || 
        !formData.departure || !formData.departureCode || !formData.arrival || !formData.arrivalCode) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Find the selected plane object
    const selectedPlane = planes.find(p => p.id === Number(formData.planeId));
    if (!selectedPlane) {
      toast.error('Không tìm thấy thông tin tàu bay');
      return;
    }

    // Prepare data according to backend structure
    const submitData = {
      name: formData.name,
      plane: selectedPlane,
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: formData.status,
      departure: formData.departure,
      departureCode: formData.departureCode,
      arrival: formData.arrival,
      arrivalCode: formData.arrivalCode,
      gate: formData.gate || '',
      createBy: 'admin',
      updateBy: 'admin'
    };

    console.log('Submitting flight data:', submitData);
    onSubmit(submitData);
  };

  const handlePlaneChange = (e) => {
    const selectedPlaneId = e.target.value;
    const selectedPlane = planes.find(p => p.id === Number(selectedPlaneId));
    console.log('Selected plane:', selectedPlane);
    setFormData(prev => ({
      ...prev,
      planeId: selectedPlaneId,
      plane: selectedPlane
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">
          {initialData ? 'Chỉnh sửa chuyến bay' : 'Thêm chuyến bay mới'}
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
          <label className="block text-sm font-medium text-gray-700">Số hiệu chuyến bay</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tàu bay</label>
          <select
            value={formData.planeId || ''}
            onChange={handlePlaneChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Chọn tàu bay</option>
            {planes && planes.length > 0 ? (
              planes.map(plane => {
                console.log('Rendering plane option:', plane);
                return (
              <option key={plane.id} value={plane.id}>
                    {plane.name} - {plane.producer}
              </option>
                );
              })
            ) : (
              <option value="" disabled>Không có tàu bay</option>
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Giờ khởi hành</label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Giờ đến</label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="OPEN">Mở bán</option>
            <option value="CLOSED">Đóng bán</option>
            <option value="CANCEL">Đã hủy</option>
            <option value="DELAY">Trì hoãn</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Điểm đi</label>
            <input
              type="text"
              value={formData.departure}
              onChange={(e) => setFormData({ ...formData, departure: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mã sân bay đi</label>
            <input
              type="text"
              value={formData.departureCode}
              onChange={(e) => setFormData({ ...formData, departureCode: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Điểm đến</label>
            <input
              type="text"
              value={formData.arrival}
              onChange={(e) => setFormData({ ...formData, arrival: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mã sân bay đến</label>
            <input
              type="text"
              value={formData.arrivalCode}
              onChange={(e) => setFormData({ ...formData, arrivalCode: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cổng</label>
            <input
            type="text"
            value={formData.gate || ''}
            onChange={(e) => setFormData({ ...formData, gate: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          {initialData ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );
};

const Flights = () => {
  const [flights, setFlights] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [flightsResponse, planesResponse] = await Promise.all([
        getFlights(page).catch(error => {
          console.error('Error fetching flights:', error);
          if (error.response && error.response.status === 400) {
            return { data: [] };
          }
          throw error;
        }),
        getPlanes()
      ]);
      
      console.log('Flights response:', flightsResponse); // Debug log
      
      // Kiểm tra và xử lý dữ liệu planes
      if (!planesResponse.data || planesResponse.data.length === 0) {
        setPlanes([]);
        toast.warning('Chưa có dữ liệu tàu bay');
      } else {
      setPlanes(planesResponse.data);
      }

      // Kiểm tra và xử lý dữ liệu flights
      if (!flightsResponse?.data) {
        console.log('No flights data found - invalid response structure'); // Debug log
        setFlights([]);
        setTotalPages(0);
        toast.warning('Chưa có dữ liệu chuyến bay');
      } else {
        console.log('Setting flights data:', flightsResponse.data); // Debug log
        setFlights(Array.isArray(flightsResponse.data) ? flightsResponse.data : [flightsResponse.data]);
        setTotalPages(Math.ceil((Array.isArray(flightsResponse.data) ? flightsResponse.data.length : 1) / 10));
      }
    } catch (error) {
      console.error('Error details:', error);
      setPlanes([]);
      setFlights([]);
      setTotalPages(0);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  // Debug planes state
  useEffect(() => {
    console.log('Planes state in parent:', planes);
    console.log('Planes state length:', planes?.length);
  }, [planes]);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      console.log('Parent component received form data:', formData);

      if (editingFlight) {
        // Kiểm tra xem giờ khởi hành có thay đổi không
        const isTimeChanged = formData.startTime !== editingFlight.startTime;

        // Cập nhật chuyến bay
        const updateData = {
          id: editingFlight.id,
          createBy: editingFlight.createBy,
          createDate: editingFlight.createDate,
          updateBy: 'admin',
          updateDate: new Date().toISOString(),
          name: formData.name,
          plane: formData.plane,
          startTime: formData.startTime,
          endTime: formData.endTime,
          status: formData.status,
          departure: formData.departure,
          departureCode: formData.departureCode,
          arrival: formData.arrival,
          arrivalCode: formData.arrivalCode,
          gate: formData.gate,
          deleted: editingFlight.deleted
        };
        console.log('Update data being sent to server:', JSON.stringify(updateData, null, 2));
        await updateFlight(updateData);
        const updatedFlight = updateData;
        console.log('Response from server:', JSON.stringify(updatedFlight, null, 2));
        toast.success('Cập nhật chuyến bay thành công');

        let transactions;
        if (isTimeChanged) {
          try {
            // Nếu thời gian thay đổi, lấy danh sách transaction với status BOOKED
            const transactionsResponse = await getTransactionsByConditions(
              formData.name,
              '2000-01-01', // dateFrom - từ năm 2000
              '3000-12-31', // dateTo - đến năm 3000
              'BOOKED',
              0, // pageNum
              10 // pageSize - lấy tất cả
            );
            transactions = transactionsResponse.data;
            console.log('Transactions found by conditions (BOOKED):', JSON.stringify(transactions, null, 2));
          } catch (error) {
            console.log('No BOOKED transactions found, searching for DELAY transactions...');
            try {
              // Nếu không tìm thấy transaction BOOKED, tìm với status DELAY
              const delayTransactionsResponse = await getTransactionsByConditions(
                formData.name,
                '2000-01-01',
                '3000-12-31',
                'DELAY',
                0,
                10
              );
              transactions = delayTransactionsResponse.data;
              console.log('Transactions found by conditions (DELAY):', JSON.stringify(transactions, null, 2));
            } catch (delayError) {
              console.log('No DELAY transactions found either');
              transactions = [];
            }
          }
        } else {
          // Nếu thời gian không thay đổi, lấy tất cả transaction của chuyến bay
          const transactionsResponse = await getTransactionsByFlight(editingFlight.id);
          transactions = transactionsResponse.data;
          console.log('Transactions found by flight ID:', JSON.stringify(transactions, null, 2));
        }

        // Cập nhật từng transaction
        for (const transaction of transactions) {
          const updateTransactionData = {
            id: transaction.id,
            createBy: transaction.createBy,
            createDate: transaction.createDate,
            updateBy: 'admin',
            updateDate: new Date().toISOString(),
            user: transaction.user,
            flight: updatedFlight,
            seat: transaction.seat,
            status: isTimeChanged ? 'DELAY' : transaction.status,
            price: transaction.price,
            deleted: transaction.deleted
          };
          console.log('Transaction update data:', JSON.stringify(updateTransactionData, null, 2));
          await updateTransaction(updateTransactionData);
        }
        if (isTimeChanged) {
          if (transactions && transactions.length > 0) {
            toast.success('Cập nhật vé thành công và đã đánh dấu là bị trễ');
          } else {
            toast.success('Cập nhật chuyến bay thành công (không có vé cần cập nhật)');
          }
        } else {
          toast.success('Cập nhật vé thành công');
        }
      } else {
        await createFlight(formData);
        toast.success('Thêm chuyến bay thành công');
      }
      fetchData();
      setShowForm(false);
      setEditingFlight(null);
    } catch (error) {
      console.error('Error submitting flight:', error);
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setShowForm(false);
    setEditingFlight(null);
    setTimeout(() => {
    setEditingFlight(item);
    setShowForm(true);
    }, 100);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chuyến bay này?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteFlight(id);
      toast.success('Xóa chuyến bay thành công');
      fetchData();
    } catch (error) {
      toast.error('Không thể xóa chuyến bay');
      console.error('Error deleting flight:', error);
    } finally {
      setLoading(false);
    }
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleAddNew = () => {
    setEditingFlight(null);
    setShowForm(false);
    setTimeout(() => {
      setShowForm(true);
    }, 100);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-container">
        <AdminPageHeader
          title="Quản lý chuyến bay"
          description="Điều phối lịch bay, hành trình, tàu bay khai thác, cổng ra máy bay và trạng thái mở bán."
          actions={(
            <button
              onClick={handleAddNew}
              className="flex items-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              <FaPlus className="mr-2" />
              Thêm chuyến bay
            </button>
          )}
        />

        <div className="admin-stack-layout">
          {showForm && (
            <div className="admin-stack-block">
              <FlightForm
                onSubmit={handleSubmit}
                initialData={editingFlight}
                planes={planes}
                onCancel={() => {
                  setShowForm(false);
                  setEditingFlight(null);
                }}
              />
            </div>
          )}

          <div className="admin-main-column">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 className="text-xl font-bold">Lịch bay</h2>
                <p className="text-sm text-[#6E7491] mt-1">{flights.length} chuyến bay đang hiển thị</p>
              </div>
              <div className="admin-table-wrap">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left py-3 px-4 border-b">Số hiệu</th>
                          <th className="text-left py-3 px-4 border-b">Tàu bay</th>
                          <th className="text-left py-3 px-4 border-b">Điểm đi</th>
                          <th className="text-left py-3 px-4 border-b">Điểm đến</th>
                          <th className="text-left py-3 px-4 border-b">Khởi hành</th>
                          <th className="text-left py-3 px-4 border-b">Trạng thái</th>
                          <th className="text-right py-3 px-4 border-b">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flights.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 border-b">{item.name}</td>
                            <td className="py-3 px-4 border-b">
                              {item.plane?.name || 'N/A'}
                            </td>
                            <td className="py-3 px-4 border-b">{item.departure}</td>
                            <td className="py-3 px-4 border-b">{item.arrival}</td>
                            <td className="py-3 px-4 border-b">{formatDateTime(item.startTime)}</td>
                            <td className="py-3 px-4 border-b">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                                item.status === 'CLOSED' ? 'bg-red-100 text-red-800' :
                                item.status === 'CANCEL' ? 'bg-gray-100 text-gray-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {item.status === 'OPEN' ? 'Mở bán' :
                                 item.status === 'CLOSED' ? 'Đóng bán' :
                                 item.status === 'CANCEL' ? 'Đã hủy' :
                                 'Trì hoãn'}
                              </span>
                            </td>
                            <td className="py-3 px-4 border-b text-right">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-blue-600 hover:text-blue-800 mr-3"
                                disabled={loading}
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-800"
                                disabled={loading}
                              >
                                <FaTrash />
                              </button>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flights; 
