import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { formatCurrency } from "../utils/format";
import { FaPlane, FaUser, FaEnvelope, FaPhone, FaCalendar, FaVenusMars, FaMapMarkerAlt, FaTicketAlt, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from "react-icons/fa";
import { applyBookingPromotion, confirmBooking, getPromotionsByActive, holdBooking, saveBookingDraft } from "../services/api";
import { toast } from "react-toastify";
import useProtectedUploadUrl from "../hooks/useProtectedUploadUrl";

const normalizeValue = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const toMoneyNumber = (value) => {
  const directNumber = Number(value);
  if (!Number.isNaN(directNumber)) {
    return directNumber;
  }

  const cleanedValue = String(value || "").replace(/[^\d.-]/g, "");
  const parsedNumber = Number(cleanedValue);
  return Number.isNaN(parsedNumber) ? 0 : parsedNumber;
};

const toDateKey = (value) => {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
};

const matchesOptionalValue = (promotionValue, flightValue) => {
  if (!promotionValue) {
    return true;
  }

  return normalizeValue(promotionValue) === normalizeValue(flightValue);
};

const calculateSubtotal = (bookingData) => {
  if (!bookingData) {
    return 0;
  }

  const passengerCount = bookingData.passengers?.length || bookingData.selectedSeats?.length || 1;
  return toMoneyNumber(bookingData.price) * passengerCount;
};

const buildBookingPayload = (bookingData, promotionCode = "") => {
  return {
    transactionIds: (bookingData?.selectedSeats || []).map((seat) => seat.id),
    orderId: bookingData?.orderId || null,
    promotionCode: promotionCode || null,
  };
};

const calculatePromotionDiscount = (promotion, subtotal) => {
  if (!promotion || subtotal <= 0) {
    return 0;
  }

  let discountAmount = 0;
  const discountValue = toMoneyNumber(promotion.discountValue);

  if (promotion.discountType === "FIXED_AMOUNT") {
    discountAmount = discountValue;
  } else {
    discountAmount = subtotal * discountValue / 100;
  }

  if (promotion.maximumDiscountAmount) {
    discountAmount = Math.min(discountAmount, toMoneyNumber(promotion.maximumDiscountAmount));
  }

  return Math.min(Math.round(discountAmount), subtotal);
};

const validatePromotionForBooking = (promotion, bookingData) => {
  if (!promotion || !bookingData?.flight) {
    return { valid: false, message: "Mã khuyến mãi không hợp lệ" };
  }

  if (promotion.active === false) {
    return { valid: false, message: "Mã khuyến mãi đã ngừng hoạt động" };
  }

  if (promotion.usageLimit !== null && promotion.usageLimit !== undefined
      && Number(promotion.usedCount || 0) >= Number(promotion.usageLimit)) {
    return { valid: false, message: "Mã khuyến mãi đã hết lượt sử dụng" };
  }

  const flightDate = toDateKey(bookingData.flight.startTime);
  if (promotion.startDate && flightDate < toDateKey(promotion.startDate)) {
    return { valid: false, message: "Mã khuyến mãi chưa áp dụng cho ngày bay này" };
  }
  if (promotion.endDate && flightDate > toDateKey(promotion.endDate)) {
    return { valid: false, message: "Mã khuyến mãi đã hết hạn cho ngày bay này" };
  }

  if (promotion.seatType && promotion.seatType !== bookingData.seatClass) {
    return { valid: false, message: "Mã khuyến mãi không áp dụng cho hạng vé này" };
  }

  const flight = bookingData.flight;
  if (!matchesOptionalValue(promotion.departureCode, flight.departureCode)
      || !matchesOptionalValue(promotion.departure, flight.departure)
      || !matchesOptionalValue(promotion.arrivalCode, flight.arrivalCode)
      || !matchesOptionalValue(promotion.arrival, flight.arrival)) {
    return { valid: false, message: "Mã khuyến mãi không áp dụng cho hành trình này" };
  }

  const subtotal = calculateSubtotal(bookingData);
  if (promotion.minimumOrderAmount && subtotal < toMoneyNumber(promotion.minimumOrderAmount)) {
    return { valid: false, message: `Đơn hàng cần tối thiểu ${formatCurrency(promotion.minimumOrderAmount)} VND` };
  }

  return { valid: true, message: "Có thể áp dụng mã khuyến mãi" };
};

const FlightConfirm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [promotionCode, setPromotionCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [availablePromotions, setAvailablePromotions] = useState([]);
  const [promotionMessage, setPromotionMessage] = useState("");
  const [promotionError, setPromotionError] = useState("");
  const [isApplyingPromotion, setIsApplyingPromotion] = useState(false);
  const [bookingQuote, setBookingQuote] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [holdError, setHoldError] = useState("");
  const [isHoldingSeats, setIsHoldingSeats] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const protectedBookingQrCode = useProtectedUploadUrl(bookingQuote?.qrCode || "");

  const refreshSeatHold = async (booking, code = "") => {
    if (!booking) {
      return null;
    }

    try {
      setIsHoldingSeats(true);
      setHoldError("");
      const response = await holdBooking(buildBookingPayload(booking, code));
      const quote = response.data;
      setBookingQuote(quote);
      setHoldExpiresAt(quote?.holdExpiresAt || null);
      if (quote?.orderId) {
        setBookingData((currentBookingData) => {
          const updatedBookingData = {
            ...(currentBookingData || booking),
            orderId: quote.orderId,
          };
          localStorage.setItem('currentBooking', JSON.stringify(updatedBookingData));
          return updatedBookingData;
        });
      }
      return quote;
    } catch (error) {
      console.error("Error holding booking seats:", error);
      const message = error.response?.data || "Không thể giữ chỗ cho các ghế đã chọn";
      setHoldError(message);
      setBookingQuote(null);
      setHoldExpiresAt(null);
      toast.error(message);
      throw error;
    } finally {
      setIsHoldingSeats(false);
    }
  };

  useEffect(() => {
    // Get booking data from localStorage
    const data = localStorage.getItem('currentBooking');
    if (!data) {
      navigate('/');
      return;
    }
    const parsedBookingData = JSON.parse(data);
    setBookingData(parsedBookingData);
    if (parsedBookingData.appliedPromotion) {
      setAppliedPromotion(parsedBookingData.appliedPromotion);
      setPromotionCode(parsedBookingData.appliedPromotion.code || "");
      setPromotionMessage(`Đang áp dụng mã ${parsedBookingData.appliedPromotion.code}`);
    }

    const fetchAvailablePromotions = async () => {
      try {
        const response = await getPromotionsByActive(true, 0, 20);
        const promotions = Array.isArray(response?.data) ? response.data : [];
        const applicablePromotions = promotions
          .filter((promotion) => validatePromotionForBooking(promotion, parsedBookingData).valid)
          .slice(0, 3);
        setAvailablePromotions(applicablePromotions);
      } catch (error) {
        console.error("Error fetching available promotions:", error);
        setAvailablePromotions([]);
      }
    };

    refreshSeatHold(parsedBookingData, parsedBookingData.appliedPromotion?.code).catch(() => {});
    fetchAvailablePromotions();
  }, [navigate]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const persistPromotion = (promotion, quote) => {
    setAppliedPromotion(promotion);
    setBookingQuote(quote);
    setBookingData((currentBookingData) => {
      const updatedBookingData = {
        ...currentBookingData,
        orderId: quote?.orderId || currentBookingData?.orderId,
        appliedPromotion: promotion,
      };
      localStorage.setItem('currentBooking', JSON.stringify(updatedBookingData));
      return updatedBookingData;
    });
  };

  const removePromotion = async () => {
    setAppliedPromotion(null);
    setPromotionCode("");
    setPromotionMessage("");
    setPromotionError("");
    const updatedBookingData = {
      ...bookingData,
    };
    delete updatedBookingData.appliedPromotion;
    delete updatedBookingData.orderId;
    localStorage.setItem('currentBooking', JSON.stringify(updatedBookingData));
    setBookingData(updatedBookingData);

    try {
      await refreshSeatHold(updatedBookingData);
    } catch (error) {
      console.error("Error refreshing hold after removing promotion:", error);
    }
  };

  const applyPromotionCode = async (code) => {
    if (!bookingData) {
      return;
    }

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setPromotionError("Vui lòng nhập mã khuyến mãi");
      setPromotionMessage("");
      return;
    }

    try {
      setIsApplyingPromotion(true);
      setPromotionError("");
      setPromotionMessage("");

      let activeOrderId = bookingData.orderId || bookingQuote?.orderId;
      if (!activeOrderId) {
        const holdQuote = await refreshSeatHold(bookingData);
        activeOrderId = holdQuote?.orderId;
      }

      const response = await applyBookingPromotion({
        orderId: activeOrderId,
        promotionCode: normalizedCode,
      });
      const quote = response.data;
      const promotion = {
        code: quote.promotionCode || normalizedCode,
        title: quote.promotionTitle,
      };

      persistPromotion(promotion, quote);
      setPromotionCode(promotion.code);
      setPromotionMessage(`Đã áp dụng mã ${promotion.code}`);
      toast.success("Áp dụng khuyến mãi thành công!");
    } catch (error) {
      console.error("Error applying promotion:", error);
      setPromotionError(error.response?.data || "Không thể áp dụng mã khuyến mãi");
    } finally {
      setIsApplyingPromotion(false);
    }
  };

  const handleBooking = async () => {
    try {
      if (!holdExpiresAt || new Date(holdExpiresAt).getTime() <= Date.now()) {
        toast.info(holdExpiresAt
          ? "Thời gian giữ chỗ đã hết, đang giữ lại ghế cho bạn"
          : "Đang thử giữ chỗ cho các ghế đã chọn");
        await refreshSeatHold(bookingData, appliedPromotion?.code);
        return;
      }

      setIsBooking(true);
      const activeOrderId = bookingData.orderId || bookingQuote?.orderId;
      if (!activeOrderId) {
        toast.info("Đang tạo giữ chỗ trước khi đặt vé");
        await refreshSeatHold(bookingData, appliedPromotion?.code);
        return;
      }
      await confirmBooking({ orderId: activeOrderId });

      toast.success('Đặt vé thành công!');
      // Xóa dữ liệu booking khỏi localStorage
      localStorage.removeItem('currentBooking');
      // Chuyển hướng đến trang chọn ghế
      navigate(`/booking-history`);
    } catch (error) {
      console.error('Error booking tickets:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      toast.error(error.response?.data || 'Có lỗi xảy ra khi đặt vé. Vui lòng thử lại.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!bookingData) {
      toast.error("Không có bản nháp đặt vé để lưu");
      return;
    }

    try {
      setIsSavingDraft(true);
      const response = await saveBookingDraft(buildBookingPayload(bookingData, appliedPromotion?.code));
      const draftBlob = new Blob([response.data], { type: "application/octet-stream" });
      const draftUrl = window.URL.createObjectURL(draftBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = draftUrl;
      downloadLink.download = "ban-nhap-dat-ve.ser";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.URL.revokeObjectURL(draftUrl);
      toast.success("Đã lưu bản nháp đặt vé");
    } catch (error) {
      console.error("Error saving booking draft:", error);
      toast.error(error.response?.data || "Không thể lưu bản nháp đặt vé");
    } finally {
      setIsSavingDraft(false);
    }
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#605DEC]"></div>
      </div>
    );
  }

  const { flight, passengers, seatClass, price } = bookingData;
  const passengerCount = passengers.length || bookingData.selectedSeats?.length || 1;
  const fallbackSubtotal = calculateSubtotal(bookingData);
  const subtotal = bookingQuote ? toMoneyNumber(bookingQuote.subtotal) : fallbackSubtotal;
  const discountAmount = bookingQuote
    ? toMoneyNumber(bookingQuote.discountAmount)
    : calculatePromotionDiscount(appliedPromotion, subtotal);
  const totalPrice = bookingQuote
    ? toMoneyNumber(bookingQuote.totalAmount)
    : Math.max(subtotal - discountAmount, 0);
  const discountedSeatPrice = bookingQuote
    ? toMoneyNumber(bookingQuote.pricePerTicket)
    : Math.round(totalPrice / passengerCount);
  const selectedTransactionIds = bookingQuote?.transactionIds?.length
    ? bookingQuote.transactionIds
    : (bookingData.selectedSeats || []).map((seat) => seat.id);
  const bookingQrCode = bookingQuote?.qrCode;
  const bookingQrContent = `${
    selectedTransactionIds.length ? selectedTransactionIds.join(",") : "NO_TRANSACTION"
  }+${appliedPromotion?.code || "NO_PROMOTION"}`;
  const holdExpiresAtTime = holdExpiresAt ? new Date(holdExpiresAt).getTime() : null;
  const holdSecondsRemaining = holdExpiresAtTime
    ? Math.max(0, Math.ceil((holdExpiresAtTime - currentTime) / 1000))
    : 0;
  const holdExpired = Boolean(holdExpiresAtTime && holdSecondsRemaining <= 0);
  const holdMinutes = Math.floor(holdSecondsRemaining / 60);
  const holdSeconds = String(holdSecondsRemaining % 60).padStart(2, "0");
  const holdTimeLabel = `${holdMinutes}:${holdSeconds}`;
  const canUseBookingButton = !isBooking
    && !isSavingDraft
    && !isHoldingSeats
    && (Boolean(holdExpiresAtTime) || Boolean(holdError));

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#605DEC] text-white p-6">
            <h1 className="text-2xl font-semibold">Xác nhận thông tin chuyến bay</h1>
            <p className="mt-2 text-white/80">Vui lòng kiểm tra lại thông tin trước khi tiếp tục</p>
          </div>

          <div className="p-6 space-y-8">
            {/* Flight Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin chuyến bay</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#F6F6FE] rounded-full flex items-center justify-center">
                    <FaPlane className="w-6 h-6 text-[#605DEC]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {flight.departure} ({flight.departureCode}) → {flight.arrival} ({flight.arrivalCode})
                    </h3>
                    <p className="text-gray-500">Mã chuyến bay: {flight.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Khởi hành</p>
                    <p className="font-medium text-gray-900">
                      {format(parseISO(flight.startTime), "HH:mm - EEEE, dd/MM/yyyy", { locale: vi })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Đến nơi</p>
                    <p className="font-medium text-gray-900">
                      {format(parseISO(flight.endTime), "HH:mm - EEEE, dd/MM/yyyy", { locale: vi })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Máy bay</p>
                    <p className="font-medium text-gray-900">{flight.plane?.name || "Chưa có thông tin"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cổng</p>
                    <p className="font-medium text-gray-900">{flight.gate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin hành khách</h2>
              {passengers.map((passenger, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Hành khách {index + 1}</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <FaUser className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Họ và tên</p>
                        <p className="font-medium text-gray-900">{passenger.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaEnvelope className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{passenger.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaPhone className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Số điện thoại</p>
                        <p className="font-medium text-gray-900">{passenger.phoneNum}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaCalendar className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Ngày sinh</p>
                        <p className="font-medium text-gray-900">{format(new Date(passenger.birthday), "dd/MM/yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaVenusMars className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Giới tính</p>
                        <p className="font-medium text-gray-900">
                          {passenger.gender === 'MALE' ? 'Nam' : 
                           passenger.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaMapMarkerAlt className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Địa chỉ</p>
                        <p className="font-medium text-gray-900">{passenger.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ticket Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin vé</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-6">
                <div className={`rounded-lg border p-4 ${
                  holdError || holdExpired
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700"
                }`}>
                  <div className="flex items-center gap-3">
                    <FaHourglassHalf className="shrink-0" />
                    <div>
                      <p className="font-medium">
                        {isHoldingSeats
                          ? "Đang giữ chỗ..."
                          : holdError
                            ? "Không thể giữ chỗ"
                            : holdExpired
                              ? "Giữ chỗ đã hết hạn"
                              : `Đang giữ ${selectedTransactionIds.length} chỗ`}
                      </p>
                      <p className="text-sm opacity-90">
                        {isHoldingSeats
                          ? "Vui lòng chờ trong giây lát."
                          : holdError || (holdExpired
                            ? "Vui lòng quay lại chọn lại ghế hoặc thử giữ chỗ lại."
                            : `Thời gian còn lại: ${holdTimeLabel}`)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Hạng vé</p>
                    <p className="font-medium text-gray-900">{seatClass}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Giá mỗi vé</p>
                    <p className="text-xl font-semibold text-[#605DEC]">{formatCurrency(price)} VND</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số hành khách</p>
                    <p className="font-medium text-gray-900">{passengerCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tạm tính</p>
                    <p className="font-medium text-gray-900">{formatCurrency(subtotal)} VND</p>
                  </div>
                </div>

                {bookingQrCode && protectedBookingQrCode && (
                  <div className="border-t border-gray-200 pt-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-36 h-36 rounded-lg border border-gray-200 bg-white p-2 flex items-center justify-center shrink-0">
                        <img
                          src={protectedBookingQrCode}
                          alt="Mã QR đặt vé"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Mã QR đặt vé</p>
                        <p className="font-medium text-gray-900 break-all">{bookingQrContent}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FaTicketAlt className="text-[#605DEC]" />
                    <h3 className="font-semibold text-gray-900">Mã khuyến mãi</h3>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={promotionCode}
                      onChange={(event) => {
                        setPromotionCode(event.target.value.toUpperCase());
                        setPromotionError("");
                        setPromotionMessage("");
                      }}
                      placeholder="Nhập mã khuyến mãi"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#605DEC] focus:border-[#605DEC] outline-none uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => applyPromotionCode(promotionCode)}
                      disabled={isApplyingPromotion}
                      className="px-5 py-2 bg-[#605DEC] text-white rounded-lg hover:bg-[#4B48BF] transition-colors disabled:opacity-50"
                    >
                      {isApplyingPromotion ? "Đang áp dụng..." : "Áp dụng"}
                    </button>
                    {appliedPromotion && (
                      <button
                        type="button"
                        onClick={removePromotion}
                        className="px-5 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-white transition-colors"
                      >
                        Gỡ mã
                      </button>
                    )}
                  </div>

                  {promotionMessage && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                      <FaCheckCircle />
                      <span>{promotionMessage}</span>
                    </div>
                  )}

                  {promotionError && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                      <FaTimesCircle />
                      <span>{promotionError}</span>
                    </div>
                  )}

                  {!appliedPromotion && availablePromotions.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Mã có thể dùng cho chuyến này:</p>
                      <div className="flex flex-wrap gap-2">
                        {availablePromotions.map((promotion) => (
                          <button
                            key={promotion.id}
                            type="button"
                            onClick={() => applyPromotionCode(promotion.code)}
                            className="px-3 py-1 rounded-full bg-[#F6F6FE] text-[#605DEC] text-sm font-medium hover:bg-[#E9E8FC] transition-colors"
                          >
                            {promotion.code}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-5 space-y-3">
                  {appliedPromotion && (
                    <div className="flex justify-between text-green-700">
                      <span>Giảm giá ({appliedPromotion.code})</span>
                      <span>-{formatCurrency(discountAmount)} VND</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm text-gray-500">Giá sau giảm mỗi vé</p>
                      <p className="font-medium text-gray-900">{formatCurrency(discountedSeatPrice)} VND</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Tổng thanh toán</p>
                      <p className="text-2xl font-bold text-[#605DEC]">{formatCurrency(totalPrice)} VND</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-[#605DEC] text-[#605DEC] rounded-lg hover:bg-[#F6F6FE] transition-colors"
              >
                Quay lại
              </button>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isBooking}
                  className="px-6 py-2 border border-[#605DEC] text-[#605DEC] rounded-lg hover:bg-[#F6F6FE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingDraft ? "Đang lưu..." : "Lưu bản nháp"}
                </button>
                <button
                  onClick={handleBooking}
                  disabled={!canUseBookingButton}
                  className="px-6 py-2 bg-[#605DEC] text-white rounded-lg hover:bg-[#4B48BF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBooking
                    ? 'Đang xử lý...'
                    : isHoldingSeats
                      ? 'Đang giữ chỗ...'
                      : holdError
                        ? 'Thử giữ chỗ'
                      : holdExpired
                        ? 'Giữ lại chỗ'
                        : 'Đặt vé'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightConfirm;
