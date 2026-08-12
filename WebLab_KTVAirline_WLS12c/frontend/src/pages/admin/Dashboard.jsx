import { Link } from 'react-router-dom';
import { FaNewspaper, FaPlane, FaCalendarAlt, FaTicketAlt, FaTags } from 'react-icons/fa';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const DashboardCard = ({ title, icon: Icon, to, description }) => {
  return (
    <Link
      to={to}
      className="p-6 bg-white rounded-lg shadow-md border border-[#E8ECEF] hover:border-[#605DEC] hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-[#F6F6FE] text-[#605DEC] flex items-center justify-center text-2xl">
          <Icon />
        </div>
      </div>
      <h3 className="text-xl font-bold text-[#1A1D1F] mb-2">{title}</h3>
      <p className="text-[#6E7491] leading-6">{description}</p>
    </Link>
  );
};

const Dashboard = () => {
  const dashboardItems = [
    {
      title: 'Quản lý tin tức & thông báo',
      icon: FaNewspaper,
      to: '/admin/news',
      description: 'Biên tập tin tức, điểm đến và các nội dung hiển thị trên trang khách hàng'
    },
    {
      title: 'Quản lý khuyến mãi',
      icon: FaTags,
      to: '/admin/promotions',
      description: 'Tạo mã ưu đãi, điều kiện áp dụng và import chiến dịch khuyến mãi bằng XML'
    },
    {
      title: 'Quản lý tàu bay',
      icon: FaPlane,
      to: '/admin/planes',
      description: 'Cập nhật đội tàu bay, sơ đồ ghế và thông tin vận hành'
    },
    {
      title: 'Quản lý chuyến bay',
      icon: FaCalendarAlt,
      to: '/admin/flights',
      description: 'Điều phối lịch bay, hành trình, cổng ra máy bay và trạng thái khai thác'
    },
    {
      title: 'Thống kê đặt vé',
      icon: FaTicketAlt,
      to: '/admin/bookings',
      description: 'Theo dõi vé, doanh thu và tình trạng đặt chỗ'
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-container">
        <AdminPageHeader
          title="Bảng điều khiển"
          description="Quản lý nội dung, vận hành chuyến bay và đặt vé trong một không gian đồng bộ với trải nghiệm khách hàng."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map((item, index) => (
            <DashboardCard key={index} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
