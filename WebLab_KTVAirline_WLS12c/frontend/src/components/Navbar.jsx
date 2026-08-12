import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdOutlineClose } from 'react-icons/md';
import { BiMenuAltLeft } from 'react-icons/bi';
import { FaUserCircle, FaHistory, FaSignOutAlt, FaPlane } from 'react-icons/fa';
import { useState, useEffect, useRef } from "react";
import Signin from "../container/Signin";
import Signup from "../container/Signup";
import "../styles/navbar.css";

const UserDropdown = ({ userEmail, handleLogout, navigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        {
            icon: <FaUserCircle className="w-5 h-5" />,
            text: 'Thông tin cá nhân',
            onClick: () => navigate('/profile')
        },
        {
            icon: <FaHistory className="w-5 h-5" />,
            text: 'Lịch sử đặt vé',
            onClick: () => navigate('/booking-history')
        },
        {
            icon: <FaSignOutAlt className="w-5 h-5" />,
            text: 'Đăng xuất',
            onClick: handleLogout,
            className: 'text-red-500 hover:bg-red-50'
        }
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
            >
                <FaUserCircle className="w-5 h-5 text-[#605DEC]" />
                <span className="text-gray-700 font-medium">{userEmail}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-50 transform scale-in-center border border-gray-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm text-gray-500">Đăng nhập với</p>
                        <p className="text-sm font-medium text-gray-900">{userEmail}</p>
                    </div>
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setIsOpen(false);
                                item.onClick();
                            }}
                            className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${item.className || 'text-gray-700'}`}
                        >
                            {item.icon}
                            <span className="font-medium">{item.text}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [toggle, setToggle] = useState(false);
    const [signin, setSignin] = useState(false);
    const [signup, setSignup] = useState(false);
    const [userEmail, setUserEmail] = useState(localStorage.getItem("email"));

    const isActive = (route) => route === location.pathname;

    useEffect(() => {
        const email = localStorage.getItem("email");
        if (email) setUserEmail(email);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setUserEmail(null);
        navigate("/");
        window.location.reload();
    };

    return (
        <>
            <nav className="bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo + menu mobile */}
                        <div className="flex items-center">
                            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group transition-all duration-300 hover:scale-105">
                                <FaPlane className="w-10 h-10 text-[#605DEC] transform group-hover:rotate-[-15deg] transition-transform duration-300" />
                                <span className="text-2xl font-bold text-[#605DEC] tracking-tight group-hover:text-[#4B48BF]">KTVAirline</span>
                            </Link>
                            <div className="hidden md:block ml-12">
                                <div className="flex items-center space-x-8">
                                    <Link to="/" 
                                        className={`relative px-3 py-2 text-base font-medium transition-colors duration-200
                                        ${isActive("/") 
                                            ? "text-[#605DEC]" 
                                            : "text-gray-600 hover:text-[#605DEC]"}`}
                                    >
                                        <span>Chuyến bay</span>
                                        {isActive("/") && (
                                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#605DEC] transform scale-x-100 transition-transform duration-200"></span>
                                        )}
                                    </Link>
                                    <Link to="/all-places" 
                                        className={`relative px-3 py-2 text-base font-medium transition-colors duration-200
                                        ${isActive("/all-places") 
                                            ? "text-[#605DEC]" 
                                            : "text-gray-600 hover:text-[#605DEC]"}`}
                                    >
                                        <span>Địa điểm</span>
                                        {isActive("/all-places") && (
                                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#605DEC] transform scale-x-100 transition-transform duration-200"></span>
                                        )}
                                    </Link>
                                    <Link to="/promotions"
                                        className={`relative px-3 py-2 text-base font-medium transition-colors duration-200
                                        ${isActive("/promotions")
                                            ? "text-[#605DEC]"
                                            : "text-gray-600 hover:text-[#605DEC]"}`}
                                    >
                                        <span>Khuyến mãi</span>
                                        {isActive("/promotions") && (
                                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#605DEC] transform scale-x-100 transition-transform duration-200"></span>
                                        )}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setToggle(!toggle)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-[#605DEC] hover:bg-gray-100 transition-colors duration-200"
                            >
                                {toggle ? (
                                    <MdOutlineClose className="w-6 h-6" />
                                ) : (
                                    <BiMenuAltLeft className="w-6 h-6" />
                                )}
                            </button>
                        </div>

                        {/* Desktop nav items */}
                        <div className="hidden md:block">
                            {userEmail ? (
                                <UserDropdown userEmail={userEmail} handleLogout={handleLogout} navigate={navigate} />
                            ) : (
                                <button
                                    onClick={() => setSignin(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-lg text-white bg-[#605DEC] hover:bg-[#4B48BF] transition-colors duration-200 shadow-sm hover:shadow-md"
                                >
                                    Đăng nhập
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                <div className={`md:hidden transition-all duration-300 ease-in-out ${toggle ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
                    <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
                        <Link to="/"
                            className={`block px-3 py-2 rounded-md text-base font-medium ${
                                isActive("/") 
                                    ? "text-[#605DEC] bg-[#F6F6FE]" 
                                    : "text-gray-600 hover:text-[#605DEC] hover:bg-gray-50"
                            }`}
                        >
                            Chuyến bay
                        </Link>
                        <Link to="/all-places"
                            className={`block px-3 py-2 rounded-md text-base font-medium ${
                                isActive("/all-places") 
                                    ? "text-[#605DEC] bg-[#F6F6FE]" 
                                    : "text-gray-600 hover:text-[#605DEC] hover:bg-gray-50"
                            }`}
                        >
                            Địa điểm
                        </Link>
                        <Link to="/promotions"
                            className={`block px-3 py-2 rounded-md text-base font-medium ${
                                isActive("/promotions")
                                    ? "text-[#605DEC] bg-[#F6F6FE]"
                                    : "text-gray-600 hover:text-[#605DEC] hover:bg-gray-50"
                            }`}
                        >
                            Khuyến mãi
                        </Link>
                        {userEmail ? (
                            <div className="pt-4 pb-3 border-t border-gray-200">
                                <div className="flex items-center px-3">
                                    <div className="flex-shrink-0">
                                        <FaUserCircle className="h-10 w-10 text-[#605DEC]" />
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-base font-medium text-gray-800">{userEmail}</div>
                                    </div>
                                </div>
                                <div className="mt-3 space-y-1">
                                    <Link to="/profile"
                                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#605DEC] hover:bg-gray-50"
                                    >
                                        Thông tin cá nhân
                                    </Link>
                                    <Link to="/booking-history"
                                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#605DEC] hover:bg-gray-50"
                                    >
                                        Lịch sử đặt vé
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setSignin(true)}
                                className="w-full mt-4 px-4 py-2 text-base font-medium text-white bg-[#605DEC] hover:bg-[#4B48BF] rounded-lg transition-colors duration-200"
                            >
                                Đăng nhập
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {signin && <Signin setSignin={setSignin} setSignup={setSignup} />}
            {signup && <Signup setSignup={setSignup} setSignin={setSignin} />}
        </>
    );
};

export default Navbar;
