import { Link, Outlet, useLocation } from 'react-router-dom';
import { FaNewspaper, FaPlane, FaCalendarAlt, FaTicketAlt, FaTachometerAlt, FaTags } from 'react-icons/fa';
import '../../styles/admin.css';

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/admin', icon: FaTachometerAlt, label: 'Dashboard' },
    { path: '/admin/news', icon: FaNewspaper, label: 'Tin tức' },
    { path: '/admin/promotions', icon: FaTags, label: 'Khuyến mãi' },
    { path: '/admin/planes', icon: FaPlane, label: 'Tàu bay' },
    { path: '/admin/flights', icon: FaCalendarAlt, label: 'Chuyến bay' },
    { path: '/admin/bookings', icon: FaTicketAlt, label: 'Đặt vé' },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="admin-sidebar w-64 bg-white min-h-screen fixed left-0 top-0 border-r border-[#E8ECEF]">
      <div className="p-5">
        <Link to="/admin" className="flex items-center gap-3 mb-8 group">
          <div className="w-11 h-11 rounded-xl bg-[#F6F6FE] flex items-center justify-center">
            <FaPlane className="w-6 h-6 text-[#605DEC] transform group-hover:rotate-[-15deg] transition-transform duration-300" />
          </div>
          <div>
            <h2 className="text-[#605DEC] text-xl font-extrabold tracking-tight">KTVAirline</h2>
            <p className="text-[#6E7491] text-sm font-medium">Quản trị hệ thống</p>
          </div>
        </Link>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item flex items-center py-3 px-4 rounded-xl transition-colors ${
                isActive(item.path)
                  ? 'bg-[#F6F6FE] text-[#605DEC]'
                  : 'text-[#6E7491] hover:bg-[#F6F6FE] hover:text-[#605DEC]'
              }`}
            >
              <item.icon className="mr-3" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};

const AdminLayout = () => {
  return (
    <div className="admin-shell flex min-h-screen bg-[#F7F7FB]">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen bg-[#F7F7FB]">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout; 
