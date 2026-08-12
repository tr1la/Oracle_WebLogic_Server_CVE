import { useEffect, useMemo, useState } from 'react';
import { FaEdit, FaFileImport, FaPlus, FaSyncAlt, FaTimes, FaTrash, FaUpload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  createPromotion,
  deletePromotion,
  getPromotions,
  importPromotionXml,
  updatePromotion,
} from '../../services/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const discountTypeLabels = {
  PERCENTAGE: 'Theo phần trăm',
  FIXED_AMOUNT: 'Số tiền cố định',
};

const seatTypeLabels = {
  ECONOMY: 'Phổ thông',
  COMFORT: 'Phổ thông đặc biệt',
  BUSINESS: 'Thương gia',
  FIRST: 'Hạng nhất',
};

const emptyPromotion = {
  code: '',
  title: '',
  description: '',
  departure: '',
  departureCode: '',
  arrival: '',
  arrivalCode: '',
  seatType: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minimumOrderAmount: '',
  maximumDiscountAmount: '',
  startDate: '',
  endDate: '',
  usageLimit: '',
  usedCount: 0,
  active: true,
  pictureLink: '',
  terms: '',
};

const toDateInputValue = (value) => {
  if (!value) {
    return '';
  }
  return String(value).slice(0, 10);
};

const toOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  return Number(value);
};

const toTextValue = (value) => value ?? '';

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  return Number(value).toLocaleString('vi-VN');
};

const formatDiscount = (promotion) => {
  if (promotion.discountType === 'FIXED_AMOUNT') {
    return `${formatCurrency(promotion.discountValue)} VND`;
  }
  return `${Number(promotion.discountValue || 0).toLocaleString('vi-VN')}%`;
};

const normalizePromotionForForm = (promotion) => ({
  ...emptyPromotion,
  ...promotion,
  code: toTextValue(promotion?.code),
  title: toTextValue(promotion?.title),
  description: toTextValue(promotion?.description),
  departure: toTextValue(promotion?.departure),
  departureCode: toTextValue(promotion?.departureCode),
  arrival: toTextValue(promotion?.arrival),
  arrivalCode: toTextValue(promotion?.arrivalCode),
  seatType: promotion?.seatType || '',
  discountType: promotion?.discountType || 'PERCENTAGE',
  discountValue: promotion?.discountValue ?? '',
  minimumOrderAmount: promotion?.minimumOrderAmount ?? '',
  maximumDiscountAmount: promotion?.maximumDiscountAmount ?? '',
  startDate: toDateInputValue(promotion?.startDate),
  endDate: toDateInputValue(promotion?.endDate),
  usageLimit: promotion?.usageLimit ?? '',
  usedCount: promotion?.usedCount ?? 0,
  active: promotion?.active ?? true,
  pictureLink: toTextValue(promotion?.pictureLink),
  terms: toTextValue(promotion?.terms),
});

const buildPromotionPayload = (formData, editingPromotion) => ({
  ...editingPromotion,
  code: formData.code.trim().toUpperCase(),
  title: formData.title.trim(),
  description: formData.description.trim() || null,
  departure: formData.departure.trim() || null,
  departureCode: formData.departureCode.trim().toUpperCase() || null,
  arrival: formData.arrival.trim() || null,
  arrivalCode: formData.arrivalCode.trim().toUpperCase() || null,
  seatType: formData.seatType || null,
  discountType: formData.discountType,
  discountValue: Number(formData.discountValue),
  minimumOrderAmount: toOptionalNumber(formData.minimumOrderAmount),
  maximumDiscountAmount: toOptionalNumber(formData.maximumDiscountAmount),
  startDate: formData.startDate,
  endDate: formData.endDate,
  usageLimit: toOptionalNumber(formData.usageLimit),
  usedCount: Number(formData.usedCount || 0),
  active: Boolean(formData.active),
  pictureLink: formData.pictureLink.trim() || null,
  terms: formData.terms.trim() || null,
  createBy: editingPromotion?.createBy || 'admin',
  updateBy: 'admin',
});

const PromotionForm = ({ initialData, loading, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState(normalizePromotionForForm(initialData));

  useEffect(() => {
    setFormData(normalizePromotionForForm(initialData));
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.code.trim() || !formData.title.trim() || !formData.discountType
        || formData.discountValue === '' || !formData.startDate || !formData.endDate) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }

    onSubmit(buildPromotionPayload(formData, initialData));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">
          {initialData ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mã khuyến mãi</label>
            <input
              type="text"
              value={formData.code}
              onChange={(event) => handleChange('code', event.target.value.toUpperCase())}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
            <select
              value={String(formData.active)}
              onChange={(event) => handleChange('active', event.target.value === 'true')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="true">Đang bật</option>
              <option value="false">Tạm tắt</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
          <input
            type="text"
            value={formData.title}
            onChange={(event) => handleChange('title', event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mô tả</label>
          <textarea
            value={formData.description || ''}
            onChange={(event) => handleChange('description', event.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Loại giảm giá</label>
            <select
              value={formData.discountType}
              onChange={(event) => handleChange('discountType', event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="PERCENTAGE">Theo phần trăm</option>
              <option value="FIXED_AMOUNT">Số tiền cố định</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Giá trị giảm</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.discountValue}
              onChange={(event) => handleChange('discountValue', event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Đơn tối thiểu</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.minimumOrderAmount}
              onChange={(event) => handleChange('minimumOrderAmount', event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Giảm tối đa</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.maximumDiscountAmount}
              onChange={(event) => handleChange('maximumDiscountAmount', event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(event) => handleChange('startDate', event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Ngày kết thúc</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(event) => handleChange('endDate', event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Hạng ghế</label>
            <select
              value={formData.seatType}
              onChange={(event) => handleChange('seatType', event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              {Object.entries(seatTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Giới hạn lượt dùng</label>
            <input
              type="number"
              min="0"
              value={formData.usageLimit}
              onChange={(event) => handleChange('usageLimit', event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Điểm đi</label>
            <input
              type="text"
              value={formData.departure || ''}
              onChange={(event) => handleChange('departure', event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mã sân bay đi</label>
            <input
              type="text"
              value={formData.departureCode || ''}
              onChange={(event) => handleChange('departureCode', event.target.value.toUpperCase())}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Điểm đến</label>
            <input
              type="text"
              value={formData.arrival || ''}
              onChange={(event) => handleChange('arrival', event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mã sân bay đến</label>
            <input
              type="text"
              value={formData.arrivalCode || ''}
              onChange={(event) => handleChange('arrivalCode', event.target.value.toUpperCase())}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Link hình ảnh</label>
          <input
            type="url"
            value={formData.pictureLink || ''}
            onChange={(event) => handleChange('pictureLink', event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Điều khoản</label>
          <textarea
            value={formData.terms || ''}
            onChange={(event) => handleChange('terms', event.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {initialData && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Đã dùng</label>
            <input
              type="number"
              min="0"
              value={formData.usedCount}
              onChange={(event) => handleChange('usedCount', event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60"
          disabled={loading}
        >
          {initialData ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );
};

const PromotionImport = ({ loading, onImport }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [inputKey, setInputKey] = useState(0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error('Vui lòng chọn file XML');
      return;
    }

    await onImport(selectedFile);
    setSelectedFile(null);
    setInputKey((current) => current + 1);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <FaFileImport className="mr-2 text-blue-600" />
        Import XML
      </h3>

      <div className="space-y-4">
        <input
          key={inputKey}
          type="file"
          accept=".xml,text/xml,application/xml"
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 hover:file:bg-blue-100"
        />

        <button
          type="submit"
          className="w-full flex items-center justify-center bg-[#605DEC] text-white py-2 px-4 rounded-md hover:bg-[#4B48BF] transition-colors disabled:opacity-60"
          disabled={loading}
        >
          <FaUpload className="mr-2" />
          Import
        </button>
      </div>
    </form>
  );
};

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    active: 'ALL',
    seatType: 'ALL',
  });

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await getPromotions(0, 1000);
      setPromotions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      if (error.response?.status === 400) {
        setPromotions([]);
        return;
      }
      toast.error('Không thể tải danh sách khuyến mãi');
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const filteredPromotions = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return promotions.filter((promotion) => {
      const matchesKeyword = !keyword
        || promotion.code?.toLowerCase().includes(keyword)
        || promotion.title?.toLowerCase().includes(keyword)
        || promotion.description?.toLowerCase().includes(keyword);
      const matchesActive = filters.active === 'ALL'
        || String(promotion.active) === filters.active;
      const matchesSeatType = filters.seatType === 'ALL'
        || promotion.seatType === filters.seatType;

      return matchesKeyword && matchesActive && matchesSeatType;
    });
  }, [filters, promotions]);

  const handleAddNew = () => {
    setEditingPromotion(null);
    setShowForm(false);
    setTimeout(() => setShowForm(true), 100);
  };

  const handleEdit = (promotion) => {
    setShowForm(false);
    setEditingPromotion(null);
    setTimeout(() => {
      setEditingPromotion(promotion);
      setShowForm(true);
    }, 100);
  };

  const handleSubmit = async (payload) => {
    try {
      setLoading(true);
      if (editingPromotion) {
        await updatePromotion({
          ...payload,
          id: editingPromotion.id,
        });
        toast.success('Cập nhật khuyến mãi thành công');
      } else {
        await createPromotion(payload);
        toast.success('Thêm khuyến mãi thành công');
      }

      await fetchPromotions();
      setShowForm(false);
      setEditingPromotion(null);
    } catch (error) {
      toast.error('Có lỗi xảy ra: ' + (error.response?.data || error.message));
      console.error('Error submitting promotion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
      return;
    }

    try {
      setLoading(true);
      await deletePromotion(id);
      toast.success('Xóa khuyến mãi thành công');
      await fetchPromotions();
    } catch (error) {
      toast.error('Không thể xóa khuyến mãi');
      console.error('Error deleting promotion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (file) => {
    try {
      setLoading(true);
      const response = await importPromotionXml(file);
      toast.success(response.data || 'Import XML thành công');
      await fetchPromotions();
    } catch (error) {
      toast.error('Không thể import XML: ' + (error.response?.data || error.message));
      console.error('Error importing promotion XML:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      keyword: '',
      active: 'ALL',
      seatType: 'ALL',
    });
  };

  return (
    <div className="admin-page">
      <div className="admin-page-container">
        <AdminPageHeader
          title="Quản lý khuyến mãi"
          description="Tạo mã ưu đãi, điều kiện áp dụng, thời gian hiệu lực và import chiến dịch bằng XML."
          actions={(
            <>
            <button
              onClick={fetchPromotions}
              className="flex items-center bg-white text-gray-700 py-2 px-4 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-60"
              disabled={loading}
            >
              <FaSyncAlt className="mr-2" />
              Tải lại
            </button>
            <button
              onClick={handleAddNew}
              className="flex items-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60"
              disabled={loading}
            >
              <FaPlus className="mr-2" />
              Thêm khuyến mãi
            </button>
            </>
          )}
        />

        <div className="admin-stack-layout">
          <PromotionImport loading={loading} onImport={handleImport} />

          {showForm && (
            <div className="admin-stack-block">
              <PromotionForm
                initialData={editingPromotion}
                loading={loading}
                onCancel={() => {
                  setShowForm(false);
                  setEditingPromotion(null);
                }}
                onSubmit={handleSubmit}
              />
            </div>
          )}

          <div className="admin-main-column space-y-6">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 className="text-xl font-bold">Bộ lọc khuyến mãi</h2>
                <p className="text-sm text-[#6E7491] mt-1">Tìm mã theo nội dung, trạng thái hoặc hạng ghế áp dụng.</p>
              </div>
              <div className="admin-panel-body">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Tìm kiếm</label>
                  <input
                    type="text"
                    value={filters.keyword}
                    onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
                    placeholder="Mã, tiêu đề, mô tả"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <select
                    value={filters.active}
                    onChange={(event) => setFilters({ ...filters, active: event.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="true">Đang bật</option>
                    <option value="false">Tạm tắt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Hạng ghế</label>
                  <select
                    value={filters.seatType}
                    onChange={(event) => setFilters({ ...filters, seatType: event.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="ALL">Tất cả</option>
                    {Object.entries(seatTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

                <div className="mt-4 flex justify-between text-sm text-gray-500">
                  <span>{filteredPromotions.length} khuyến mãi</span>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Xóa lọc
                  </button>
                </div>
              </div>
            </div>

            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 className="text-xl font-bold">Danh sách khuyến mãi</h2>
                <p className="text-sm text-[#6E7491] mt-1">{filteredPromotions.length} mã đang hiển thị</p>
              </div>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="text-left py-3 px-4 border-b">Mã</th>
                        <th className="text-left py-3 px-4 border-b">Tiêu đề</th>
                        <th className="text-left py-3 px-4 border-b">Giảm</th>
                        <th className="text-left py-3 px-4 border-b">Hiệu lực</th>
                        <th className="text-left py-3 px-4 border-b">Đã dùng</th>
                        <th className="text-left py-3 px-4 border-b">Trạng thái</th>
                        <th className="text-right py-3 px-4 border-b">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPromotions.map((promotion) => (
                        <tr key={promotion.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 border-b">
                            <span className="font-semibold text-blue-700">{promotion.code}</span>
                            {promotion.seatType && (
                              <div className="text-xs text-gray-500">{seatTypeLabels[promotion.seatType] || promotion.seatType}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div className="font-medium text-gray-900 max-w-xs truncate">{promotion.title}</div>
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {promotion.departureCode || promotion.departure || 'Tất cả'} - {promotion.arrivalCode || promotion.arrival || 'Tất cả'}
                            </div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            <div>{formatDiscount(promotion)}</div>
                            <div className="text-xs text-gray-500">{discountTypeLabels[promotion.discountType]}</div>
                          </td>
                          <td className="py-3 px-4 border-b text-sm">
                            <div>{toDateInputValue(promotion.startDate)}</div>
                            <div className="text-gray-500">{toDateInputValue(promotion.endDate)}</div>
                          </td>
                          <td className="py-3 px-4 border-b">
                            {Number(promotion.usedCount || 0).toLocaleString('vi-VN')}
                            {promotion.usageLimit !== null && promotion.usageLimit !== undefined && (
                              <span className="text-gray-500">/{Number(promotion.usageLimit).toLocaleString('vi-VN')}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 border-b">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              promotion.active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {promotion.active ? 'Đang bật' : 'Tạm tắt'}
                            </span>
                          </td>
                          <td className="py-3 px-4 border-b text-right whitespace-nowrap">
                            <button
                              onClick={() => handleEdit(promotion)}
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 mr-3"
                              disabled={loading}
                              title="Chỉnh sửa"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(promotion.id)}
                              className="inline-flex items-center text-red-600 hover:text-red-800"
                              disabled={loading}
                              title="Xóa"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredPromotions.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-gray-500">
                            Chưa có dữ liệu khuyến mãi
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Promotions;
