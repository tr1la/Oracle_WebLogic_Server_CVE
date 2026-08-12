import { useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { toast } from "react-toastify";
import { FaSpinner, FaEnvelope, FaKey, FaPhone, FaCalendar, FaVenusMars, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { signup } from "../services/api";

// eslint-disable-next-line react/prop-types
const Signup = ({ signup: isSignupOpen, setSignup, setSignin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [address, setAddress] = useState('');
    const [check1, setCheck1] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();

        if (!email || !password || !confirmPassword || !name || !phoneNumber || !dateOfBirth || !gender || !address) {
            toast.warning("Vui lòng điền đầy đủ thông tin.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp.");
            return;
        }

        if (!check1) {
            toast.warning("Vui lòng đồng ý điều khoản.");
            return;
        }

        try {
            setIsSubmitting(true);
            const userData = {
                email,
                password,
                name,
                phoneNum: phoneNumber,
                birthday: dateOfBirth,
                gender,
                address,
                IdNumber: Math.random().toString(36).substring(7) // Temporary ID number
            };

            await signup(userData);
            toast.success("Đăng ký thành công!");
            setSignup(false);
            setSignin(true);
        } catch (error) {
            const errorMessage = error.response?.data || "Đăng ký thất bại. Vui lòng thử lại.";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white w-[310px] sm:w-[468px] md:w-[568px] rounded-xl px-8 py-6 flex flex-col gap-6 transform transition-all scaleUp max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h1 className="text-[#6E7491] text-xl sm:text-2xl font-bold">Đăng ký tài khoản KTVAirline</h1>
                    <MdOutlineClose
                        className="text-[#6E7491] cursor-pointer hover:text-[#4B48BF] transition-colors"
                        onClick={() => !isSubmitting && setSignup(false)}
                    />
                </div>
                <form className="flex flex-col gap-4" onSubmit={handleSignup}>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Họ và tên"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border p-2 pl-10 rounded-lg text-[#7C8DB0] focus:outline-none focus:ring-2 focus:ring-[#605DEC] focus:border-transparent transition-all"
                            disabled={isSubmitting}
                        />
                        <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="relative">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border p-2 pl-10 rounded-lg text-[#7C8DB0] focus:outline-none focus:ring-2 focus:ring-[#605DEC] focus:border-transparent transition-all"
                            disabled={isSubmitting}
                        />
                        <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <input
                                type="password"
                                placeholder="Mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border p-2 pl-10 rounded-lg text-[#7C8DB0] focus:outline-none focus:ring-2 focus:ring-[#605DEC] focus:border-transparent transition-all"
                                disabled={isSubmitting}
                            />
                            <FaKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                        <div className="relative flex-1">
                            <input
                                type="password"
                                placeholder="Xác nhận mật khẩu"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border p-2 pl-10 rounded-lg text-[#7C8DB0] focus:outline-none focus:ring-2 focus:ring-[#605DEC] focus:border-transparent transition-all"
                                disabled={isSubmitting}
                            />
                            <FaKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <input
                                type="tel"
                                placeholder="Số điện thoại"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full border p-2 pl-10 rounded-lg text-[#7C8DB0] focus:outline-none focus:ring-2 focus:ring-[#605DEC] focus:border-transparent transition-all"
                                disabled={isSubmitting}
                            />
                            <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                        <div className="relative flex-1">
                            <input
                                type="date"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                className="w-full border p-2 pl-10 rounded-lg text-[#7C8DB0] focus:outline-none focus:ring-2 focus:ring-[#605DEC] focus:border-transparent transition-all"
                                disabled={isSubmitting}
                            />
                            <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                    <div className="relative">
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full border p-2 pl-10 rounded-lg text-[#7C8DB0] focus:outline-none focus:ring-2 focus:ring-[#605DEC] focus:border-transparent transition-all appearance-none bg-white"
                            disabled={isSubmitting}
                        >
                            <option value="">Chọn giới tính</option>
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                            <option value="OTHER">Khác</option>
                        </select>
                        <FaVenusMars className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="relative">
                        <textarea
                            placeholder="Địa chỉ"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full border p-2 pl-10 rounded-lg text-[#7C8DB0] focus:outline-none focus:ring-2 focus:ring-[#605DEC] focus:border-transparent transition-all resize-none h-20"
                            disabled={isSubmitting}
                        />
                        <FaMapMarkerAlt className="absolute left-3 top-4 text-gray-400" />
                    </div>
                    <label className="flex items-center gap-2 text-[#7C8DB0] select-none">
                        <input
                            type="checkbox"
                            checked={check1}
                            onChange={(e) => setCheck1(e.target.checked)}
                            disabled={isSubmitting}
                            className="rounded border-gray-300 text-[#605DEC] focus:ring-[#605DEC] transition-colors"
                        />
                        Tôi đồng ý với <span className="text-[#605DEC] cursor-pointer hover:text-[#4B48BF] transition-colors">điều khoản sử dụng</span>
                    </label>
                    <button
                        type="submit"
                        className="bg-[#605DEC] text-white rounded-lg py-3 mt-2 hover:bg-[#4B48BF] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <FaSpinner className="animate-spin h-5 w-5" />
                                <span>Đang xử lý...</span>
                            </>
                        ) : (
                            'Tạo tài khoản'
                        )}
                    </button>
                </form>

                <div className="flex justify-center gap-2">
                    <p className="text-[#7C8DB0]">Đã có tài khoản?</p>
                    <button
                        onClick={() => {
                            if (!isSubmitting) {
                                setSignup(false);
                                setSignin(true);
                            }
                        }}
                        className="text-[#605DEC] font-semibold hover:text-[#4B48BF] transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        Đăng nhập
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Signup;
