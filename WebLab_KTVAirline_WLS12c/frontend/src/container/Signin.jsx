import { useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { forgotPassword, login } from "../services/api";
import { FaSpinner, FaCheckCircle, FaEnvelope, FaKey } from "react-icons/fa";

// eslint-disable-next-line react/prop-types
const Signin = ({ signin, setSignin, setSignup }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            toast.warning("Vui lòng điền đầy đủ thông tin.");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await login({
                email,
                password
            });

            if (response.data.token) {
                toast.success("Đăng nhập thành công!");
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("email", response.data.email);
                localStorage.setItem("username", response.data.username);
                localStorage.setItem("userId", response.data.id);
                navigate('/');
                window.location.reload();
                setSignin(false);
            } else {
                toast.error("Đăng nhập thất bại. Vui lòng kiểm tra lại.");
            }
        } catch (err) {
            toast.error("Lỗi máy chủ hoặc sai thông tin đăng nhập.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        
        if (!email.trim()) {
            toast.warning("Vui lòng nhập email của bạn.");
            return;
        }

        try {
            setIsSubmitting(true);
            await forgotPassword(email);
            setResetEmailSent(email);
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Forgot password error:', error);
            const errorMessage = error.response?.data || "Không thể gửi mật khẩu mới. Vui lòng thử lại sau.";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const SuccessModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 transform transition-all">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <FaCheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Yêu cầu đã được gửi!</h3>
                    <div className="mt-2 px-2">
                        <p className="text-sm text-gray-500 mb-4">
                            Chúng tôi đã gửi mật khẩu mới đến email:
                        </p>
                        <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-lg p-3 mb-4">
                            <FaEnvelope className="text-gray-400" />
                            <span className="text-gray-600 font-medium">{resetEmailSent}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Vui lòng kiểm tra hộp thư của bạn (bao gồm cả thư mục spam) để lấy mật khẩu mới.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setShowSuccessModal(false);
                            setIsForgotPassword(false);
                            setIsSubmitting(false);
                            setEmail('');
                        }}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#605DEC] rounded-lg hover:bg-[#4B48BF] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#605DEC] transition-colors"
                    >
                        Quay lại đăng nhập
                    </button>
                </div>
            </div>
        </div>
    );

    if (showSuccessModal) {
        return <SuccessModal />;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white w-[310px] sm:w-[468px] md:w-[568px] rounded-xl px-8 py-6 flex flex-col gap-6 transform transition-all scaleUp">
                <div className="flex items-center justify-between">
                    <h1 className="text-[#6E7491] text-xl sm:text-2xl font-bold">
                        {isForgotPassword ? 'Quên mật khẩu' : 'Đăng nhập tài khoản KTVAirline'}
                    </h1>
                    <MdOutlineClose
                        className="text-[#6E7491] cursor-pointer hover:text-[#4B48BF] transition-colors"
                        onClick={() => !isSubmitting && setSignin(false)}
                    />
                </div>

                {isForgotPassword ? (
                    <>
                        <p className="text-[#7C8DB0] text-sm">
                            Nhập email của bạn để nhận mật khẩu mới.
                        </p>
                        <form className="flex flex-col gap-4" onSubmit={handleForgotPassword}>
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
                            <div className="flex flex-col gap-2">
                                <button
                                    type="submit"
                                    className="bg-[#605DEC] text-white rounded-lg py-3 hover:bg-[#4B48BF] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FaSpinner className="animate-spin h-5 w-5" />
                                            <span>Đang gửi yêu cầu...</span>
                                        </>
                                    ) : (
                                        'Gửi mật khẩu mới'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => !isSubmitting && setIsForgotPassword(false)}
                                    className="text-[#605DEC] font-semibold py-2 hover:text-[#4B48BF] transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    Quay lại đăng nhập
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
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
                            <div className="relative">
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
                            <button
                                type="submit"
                                className="bg-[#605DEC] text-white rounded-lg py-3 hover:bg-[#4B48BF] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <FaSpinner className="animate-spin h-5 w-5" />
                                        <span>Đang đăng nhập...</span>
                                    </>
                                ) : (
                                    'Đăng nhập'
                                )}
                            </button>
                        </form>

                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={() => !isSubmitting && setIsForgotPassword(true)}
                                className="text-[#605DEC] text-sm font-semibold hover:text-[#4B48BF] transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            >
                                Quên mật khẩu?
                            </button>

                            <div className="flex justify-center gap-2">
                                <p className="text-[#7C8DB0]">Chưa có tài khoản?</p>
                                <button
                                    onClick={() => {
                                        if (!isSubmitting) {
                                            setSignin(false);
                                            setSignup(true);
                                        }
                                    }}
                                    className="text-[#605DEC] font-semibold hover:text-[#4B48BF] transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    Đăng ký
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Signin;
