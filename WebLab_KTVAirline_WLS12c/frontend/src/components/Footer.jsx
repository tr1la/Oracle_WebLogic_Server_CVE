import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { FaPlane } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const FooterSection = ({ title, links }) => (
  <div className="flex flex-col space-y-4">
    <h2 className="text-[#1A1D1F] font-semibold text-lg">{title}</h2>
    <ul className="space-y-3">
      {links.map((link, index) => (
        <li key={index}>
          <Link 
            to={link.url} 
            className="text-gray-500 hover:text-[#605DEC] transition-colors duration-200 text-sm"
          >
            {link.text}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const SocialButton = ({ icon, href, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-[#605DEC] hover:text-white transition-all duration-200"
  >
    {icon}
  </a>
);

const Footer = () => {
  const sections = [
    {
      title: "Giới thiệu",
      links: [
        { text: "Về KTVAirline", url: "/about" },
        { text: "Cách hoạt động", url: "/how-it-works" },
        { text: "Cơ hội nghề nghiệp", url: "/careers" },
        { text: "Blog", url: "/blog" },
        { text: "Báo chí", url: "/press" },
        { text: "Diễn đàn", url: "/forum" }
      ]
    },
    {
      title: "Đối tác",
      links: [
        { text: "Chương trình đối tác", url: "/partners" },
        { text: "Chương trình liên kết", url: "/affiliates" },
        { text: "Đối tác kỹ thuật", url: "/tech-partners" },
        { text: "Khuyến mãi & sự kiện", url: "/promotions" },
        { text: "Tích hợp hệ thống", url: "/integration" },
        { text: "Cộng đồng", url: "/community" },
        { text: "Chương trình khách hàng thân thiết", url: "/loyalty" }
      ]
    },
    {
      title: "Hỗ trợ",
      links: [
        { text: "Trung tâm trợ giúp", url: "/help" },
        { text: "Liên hệ", url: "/contact" },
        { text: "Chính sách bảo mật", url: "/privacy" },
        { text: "Điều khoản dịch vụ", url: "/terms" },
        { text: "An toàn & tin cậy", url: "/trust" },
        { text: "Khả năng tiếp cận", url: "/accessibility" }
      ]
    }
  ];

  return (
    <footer className="bg-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            {/* Logo and description */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <FaPlane className="w-8 h-8 text-[#605DEC]" />
                <span className="text-2xl font-bold text-[#605DEC] tracking-tight">KTVAirline</span>
              </div>
              <p className="mt-4 text-gray-500 text-sm leading-6">
                KTVAirline là nền tảng đặt vé máy bay trực tuyến hàng đầu, cung cấp trải nghiệm đặt vé thuận tiện và an toàn với nhiều lựa chọn chuyến bay từ các hãng hàng không uy tín.
              </p>
              <div className="mt-6 flex space-x-4">
                <SocialButton
                  icon={<FaFacebookF size={18} />}
                  href="https://facebook.com"
                  label="Facebook"
                />
                <SocialButton
                  icon={<FaTwitter size={18} />}
                  href="https://twitter.com"
                  label="Twitter"
                />
                <SocialButton
                  icon={<FaInstagram size={18} />}
                  href="https://instagram.com"
                  label="Instagram"
                />
                <SocialButton
                  icon={<FaLinkedinIn size={18} />}
                  href="https://linkedin.com"
                  label="LinkedIn"
                />
              </div>
            </div>

            {/* Footer sections */}
            {sections.map((section, index) => (
              <FooterSection
                key={index}
                title={section.title}
                links={section.links}
              />
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} KTVAirline. Bản quyền đã được bảo hộ.
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-[#605DEC] transition-colors duration-200">
              Chính sách bảo mật
            </Link>
            <Link to="/terms" className="text-sm text-gray-500 hover:text-[#605DEC] transition-colors duration-200">
              Điều khoản sử dụng
            </Link>
            <Link to="/sitemap" className="text-sm text-gray-500 hover:text-[#605DEC] transition-colors duration-200">
              Sơ đồ trang
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
