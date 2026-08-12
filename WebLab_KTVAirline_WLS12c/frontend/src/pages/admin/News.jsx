import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import { getNews, createNews, updateNews, deleteNews, getNewsByCategory, getNewsByTitle } from '../../services/api';
import { toast } from 'react-toastify';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const NewsForm = ({ onSubmit, initialData = null, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'NEWS',
    summary: '',
    content: '',
    pictureLink: '',
    ...initialData
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author || !formData.category || 
        !formData.summary || !formData.content || !formData.pictureLink) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">
          {initialData ? 'Chỉnh sửa tin tức' : 'Thêm tin tức mới'}
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
          <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tác giả</label>
          <input
            type="text"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Loại</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="NEWS">Tin tức</option>
            <option value="PROMOTION">Khuyến mãi</option>
            <option value="HELP">Trợ giúp</option>
            <option value="FLIGHT_DEAL">Ưu đãi chuyến bay</option>
            <option value="PLACE">Địa điểm du lịch</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tóm tắt</label>
          <textarea
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nội dung</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Link hình ảnh</label>
          <input
            type="url"
            value={formData.pictureLink}
            onChange={(e) => setFormData({ ...formData, pictureLink: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
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

const News = () => {
  const [news, setNews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTitle, setSearchTitle] = useState('');
  const pageSize = 1000;

  const categories = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'NEWS', label: 'Tin tức' },
    { value: 'PROMOTION', label: 'Khuyến mãi' },
    { value: 'HELP', label: 'Trợ giúp' },
    { value: 'FLIGHT_DEAL', label: 'Ưu đãi chuyến bay' },
    { value: 'PLACE', label: 'Địa điểm du lịch' }
  ];

  const fetchNews = async () => {
    try {
      setLoading(true);
      let response;
      if (selectedCategory === 'ALL') {
        if (searchTitle) {
          response = await getNewsByTitle(searchTitle, page, pageSize);
        } else {
          response = await getNews(0, 1000); // Get all news when no filter
        }
      } else {
        response = await getNewsByCategory(selectedCategory, page, pageSize);
      }
      
      if (response.data) {
        setNews(response.data);
        setTotalPages(Math.ceil(response.data.length / pageSize));
      }
    } catch (error) {
      toast.error('Không thể tải danh sách tin tức');
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [page, selectedCategory, searchTitle]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setSearchTitle(e.target.value);
    setPage(0);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNews();
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      if (editingNews) {
        await updateNews({
          ...formData,
          id: editingNews.id
        });
        toast.success('Cập nhật tin tức thành công');
      } else {
        await createNews({
          ...formData,
          createBy: 'admin'
        });
        toast.success('Thêm tin tức thành công');
      }
      fetchNews();
      setShowForm(false);
      setEditingNews(null);
    } catch (error) {
      toast.error('Có lỗi xảy ra: ' + (error.response?.data || error.message));
      console.error('Error submitting news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setShowForm(false);
    setEditingNews(null);
    setTimeout(() => {
    setEditingNews(item);
    setShowForm(true);
    }, 100);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin tức này?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteNews(id);
      toast.success('Xóa tin tức thành công');
      fetchNews();
    } catch (error) {
      toast.error('Không thể xóa tin tức');
      console.error('Error deleting news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingNews(null);
    setShowForm(false);
    setTimeout(() => {
      setShowForm(true);
    }, 100);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-container">
        <AdminPageHeader
          title="Quản lý tin tức"
          description="Biên tập tin tức, ưu đãi chuyến bay, địa điểm và nội dung hiển thị cho khách hàng."
          actions={(
            <button
              onClick={handleAddNew}
              className="flex items-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              <FaPlus className="mr-2" />
              Thêm tin tức
            </button>
          )}
        />

        <div className="admin-stack-layout">
          {showForm && (
            <div className="admin-stack-block">
              <NewsForm
                onSubmit={handleSubmit}
                initialData={editingNews}
                onCancel={() => {
                  setShowForm(false);
                  setEditingNews(null);
                }}
              />
            </div>
          )}

          <div className="admin-main-column">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 className="text-xl font-bold">Danh sách nội dung</h2>
                <p className="text-sm text-[#6E7491] mt-1">{news.length} mục đang hiển thị</p>
              </div>
              <div className="admin-panel-body">
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại tin
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tìm kiếm theo tiêu đề
                    </label>
                    <form onSubmit={handleSearchSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={searchTitle}
                        onChange={handleSearchChange}
                        placeholder="Nhập tiêu đề tin tức..."
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Tìm kiếm
                      </button>
                    </form>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : news.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Không tìm thấy tin tức nào
                  </div>
                ) : (
                  <>
                    <div className="admin-table-wrap">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="py-3 px-4 text-left">Tiêu đề</th>
                            <th className="py-3 px-4 text-left">Loại</th>
                            <th className="py-3 px-4 text-left">Ngày tạo</th>
                            <th className="py-3 px-4 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {news.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 border-b">{item.title}</td>
                              <td className="py-3 px-4 border-b">
                                {categories.find(cat => cat.value === item.category)?.label || item.category}
                              </td>
                              <td className="py-3 px-4 border-b">
                                {new Date(item.createDate).toLocaleString('vi-VN')}
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
                    </div>

                    {totalPages > 1 && (
                      <div className="flex justify-center mt-4 gap-2">
                        <button
                          onClick={() => setPage(Math.max(0, page - 1))}
                          disabled={page === 0 || loading}
                          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                        >
                          Trước
                        </button>
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
                        <button
                          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                          disabled={page === totalPages - 1 || loading}
                          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                        >
                          Sau
                        </button>
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

export default News; 
