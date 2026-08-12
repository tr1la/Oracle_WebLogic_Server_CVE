package org.example.serviceImpl;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.example.constant.BookingOrderStatus;
import org.example.constant.PromotionDiscountType;
import org.example.constant.SeatType;
import org.example.constant.TransactionStatusEnum;
import org.example.entity.BookingOrder;
import org.example.entity.BookingOrderPromotion;
import org.example.entity.Flight;
import org.example.entity.Promotion;
import org.example.entity.Transaction;
import org.example.entity.User;
import org.example.payload.BookingRequest;
import org.example.payload.BookingResponse;
import org.example.repository.BookingOrderPromotionRepository;
import org.example.repository.BookingOrderRepository;
import org.example.repository.PromotionRepository;
import org.example.repository.TransactionRepository;
import org.example.repository.UserRepository;
import org.example.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.ObjectUtils;

@Service
public class BookingServiceImpl implements BookingService {
    private static final Duration HOLD_DURATION = Duration.ofMinutes(10);

    @Autowired
    TransactionRepository transactionRepository;

    @Autowired
    PromotionRepository promotionRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    BookingOrderRepository bookingOrderRepository;

    @Autowired
    BookingOrderPromotionRepository bookingOrderPromotionRepository;

    @Override
    public BookingResponse quote(BookingRequest request) {
        return quote(request, null);
    }

    @Override
    public BookingResponse quote(BookingRequest request, Integer userId) {
        List<Transaction> transactions = resolveBookingTransactions(request, userId, SeatResolutionMode.QUOTE);
        Promotion promotion = resolvePromotion(request);
        validatePromotion(promotion, transactions, calculateSubtotal(transactions));

        return buildResponse(request, transactions, promotion, "QUOTED", resolveOwnedHoldExpiry(transactions, userId));
    }

    @Override
    @Transactional
    public BookingResponse hold(BookingRequest request, Integer userId) {
        User user = userRepository.findByIdAndIsDeletedFalse(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        if (request != null && request.getOrderId() != null) {
            BookingOrder order = resolveOwnedOrder(request.getOrderId(), userId);
            List<Transaction> orderTransactions = resolveOrderTransactions(order);
            validateActiveOrder(order);
            return buildOrderResponse(order, orderTransactions, order.getStatus().name());
        }

        List<Transaction> transactions = resolveBookingTransactions(request, userId, SeatResolutionMode.HOLD);
        Date holdExpiresAt = Date.from(Instant.now().plus(HOLD_DURATION));
        BigDecimal subtotal = calculateSubtotal(transactions);
        BookingOrder order = BookingOrder.builder()
                .user(user)
                .transactionIds(joinTransactionIds(transactions))
                .status(BookingOrderStatus.HOLD)
                .subtotal(subtotal)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(subtotal)
                .holdExpiresAt(holdExpiresAt)
                .qrCode(request.getQrCode())
                .build();
        order = bookingOrderRepository.save(order);

        for (Transaction transaction : transactions) {
            transaction.setUser(user);
            transaction.setStatus(TransactionStatusEnum.HOLD);
            transaction.setHoldExpiresAt(holdExpiresAt);
            transactionRepository.save(transaction);
        }

        return buildOrderResponse(order, transactions, "HOLD");
    }

    @Override
    @Transactional
    public BookingResponse applyPromotion(BookingRequest request, Integer userId) {
        if (request == null || request.getOrderId() == null) {
            throw new IllegalArgumentException("orderId is required");
        }

        BookingOrder order = resolveOwnedOrder(request.getOrderId(), userId);
        validateActiveOrder(order);

        List<Transaction> transactions = resolveOrderTransactions(order);
        Promotion promotion = resolvePromotion(request);
        if (promotion == null) {
            throw new IllegalArgumentException("promotionCode is required");
        }
        validatePromotion(promotion, transactions, order.getSubtotal());

        String promotionCode = promotion.getCode().trim();
        if (hasAppliedPromotion(order, promotionCode)) {
            return buildOrderResponse(order, transactions, "PROMOTION_APPLIED");
        }

        BigDecimal discountAmount = calculateDiscountAmount(promotion, order.getTotalAmount());
        bookingOrderRepository.applyPromotionDiscount(order.getId(), discountAmount);
        /*
         * VULNERABLE RACE CONDITION SINK: this check-then-update flow intentionally
         * mutates the persisted order total without locking the order or enforcing a
         * unique (order, promotion) record. Parallel requests can all observe that
         * the code has not been applied yet, then each subtract a discount from
         * BOOKING_ORDER.TOTAL_AMOUNT before any request records the code.
         *
         * FIXED CODE:
         *
         * // Replace this vulnerable method with the implementation below. The
         * // required BookingOrderPromotion entity, BookingOrderPromotionRepository,
         * // and BookingOrderRepository.findByIdAndIsDeletedFalseForUpdate(...) are
         * // compile-ready in their own files.
         *
         * @Transactional
         * public BookingResponse applyPromotion(BookingRequest request, Integer userId) {
         *     if (request == null || request.getOrderId() == null) {
         *         throw new IllegalArgumentException("orderId is required");
         *     }
         *
         *     BookingOrder order = bookingOrderRepository
         *             .findByIdAndIsDeletedFalseForUpdate(request.getOrderId());
         *     if (order == null) {
         *         throw new IllegalArgumentException("Booking order not found: " + request.getOrderId());
         *     }
         *     if (order.getUser() == null || order.getUser().getId() == null
         *             || !order.getUser().getId().equals(userId)) {
         *         throw new IllegalStateException("Booking order does not belong to current user");
         *     }
         *     validateActiveOrder(order);
         *
         *     List<Transaction> transactions = resolveOrderTransactions(order);
         *     Promotion promotion = resolvePromotion(request);
         *     if (promotion == null) {
         *         throw new IllegalArgumentException("promotionCode is required");
         *     }
         *     validatePromotion(promotion, transactions, order.getSubtotal());
         *
         *     if (!bookingOrderPromotionRepository.existsByOrderIdAndPromotionId(
         *             order.getId(), promotion.getId())) {
         *         BookingOrderPromotion appliedPromotion = new BookingOrderPromotion();
         *         appliedPromotion.setOrder(order);
         *         appliedPromotion.setPromotion(promotion);
         *         bookingOrderPromotionRepository.saveAndFlush(appliedPromotion);
         *     }
         *
         *     List<Promotion> appliedPromotions = bookingOrderPromotionRepository
         *             .findByOrderIdAndIsDeletedFalse(order.getId())
         *             .stream()
         *             .map(BookingOrderPromotion::getPromotion)
         *             .collect(java.util.stream.Collectors.toList());
         *
         *     BigDecimal discountAmount = appliedPromotions.stream()
         *             .map(applied -> calculateDiscountAmount(applied, order.getSubtotal()))
         *             .reduce(BigDecimal.ZERO, BigDecimal::add)
         *             .min(order.getSubtotal());
         *
         *     order.setDiscountAmount(discountAmount);
         *     order.setTotalAmount(order.getSubtotal().subtract(discountAmount).max(BigDecimal.ZERO));
         *     order.setAppliedPromotionCodes(appliedPromotions.stream()
         *             .map(Promotion::getCode)
         *             .collect(Collectors.joining(",")));
         *
         *     BookingOrder savedOrder = bookingOrderRepository.save(order);
         *     return buildOrderResponse(savedOrder, transactions, "PROMOTION_APPLIED");
         * }
         */

        BookingOrder updatedOrder = bookingOrderRepository.findByIdAndIsDeletedFalse(order.getId());
        updatedOrder
                .setAppliedPromotionCodes(appendPromotionCode(updatedOrder.getAppliedPromotionCodes(), promotionCode));
        updatedOrder = bookingOrderRepository.save(updatedOrder);

        return buildOrderResponse(updatedOrder, transactions, "PROMOTION_APPLIED");
    }

    @Override
    @Transactional
    public BookingResponse confirm(BookingRequest request, Integer userId) {
        User user = userRepository.findByIdAndIsDeletedFalse(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        if (request != null && request.getOrderId() != null) {
            return confirmOrder(request.getOrderId(), user);
        }

        List<Transaction> transactions = resolveBookingTransactions(request, userId, SeatResolutionMode.CONFIRM);
        Promotion promotion = resolvePromotion(request);
        validatePromotion(promotion, transactions, calculateSubtotal(transactions));

        BookingResponse response = buildResponse(request, transactions, promotion, "BOOKED", null);
        String pricePerTicket = response.getPricePerTicket().setScale(0, RoundingMode.HALF_UP).toPlainString();
        String qrCode = response.getQrCode();

        for (Transaction transaction : transactions) {
            transaction.setUser(user);
            transaction.setStatus(TransactionStatusEnum.BOOKED);
            transaction.setHoldExpiresAt(null);
            transaction.setPrice(pricePerTicket);
            transaction.setQrCode(qrCode);
            transactionRepository.save(transaction);
        }

        if (promotion != null) {
            promotion.setUsedCount((promotion.getUsedCount() == null ? 0 : promotion.getUsedCount()) + 1);
            promotionRepository.save(promotion);
        }

        response.setTransactions(transactions);
        return response;
    }

    private BookingResponse confirmOrder(Integer orderId, User user) {
        BookingOrder order = resolveOwnedOrder(orderId, user.getId());
        validateActiveOrder(order);

        BookingRequest orderRequest = new BookingRequest();
        orderRequest.setOrderId(order.getId());
        orderRequest.setTransactionIds(parseOrderTransactionIds(order));

        List<Transaction> transactions = resolveBookingTransactions(orderRequest, user.getId(),
                SeatResolutionMode.CONFIRM);
        BigDecimal pricePerTicket = order.getTotalAmount().divide(
                BigDecimal.valueOf(transactions.size()),
                0,
                RoundingMode.HALF_UP);
        String qrCode = order.getQrCode() == null ? orderRequest.getQrCode() : order.getQrCode();

        for (Transaction transaction : transactions) {
            transaction.setUser(user);
            transaction.setStatus(TransactionStatusEnum.BOOKED);
            transaction.setHoldExpiresAt(null);
            transaction.setPrice(pricePerTicket.toPlainString());
            transaction.setQrCode(qrCode);
            transactionRepository.save(transaction);
        }

        for (String promotionCode : parsePromotionCodes(order.getAppliedPromotionCodes())) {
            Promotion promotion = promotionRepository.findByCodeAndIsDeletedFalse(promotionCode);
            if (promotion != null) {
                promotion.setUsedCount((promotion.getUsedCount() == null ? 0 : promotion.getUsedCount()) + 1);
                promotionRepository.save(promotion);
            }
        }

        order.setStatus(BookingOrderStatus.BOOKED);
        order.setHoldExpiresAt(null);
        order.setQrCode(qrCode);
        order = bookingOrderRepository.save(order);

        return buildOrderResponse(order, transactions, "BOOKED");
    }

    @Override
    public byte[] saveDraft(BookingRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Booking draft is required");
        }

        try (ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                ObjectOutputStream output = new ObjectOutputStream(bytes)) {
            output.writeObject(request);
            output.flush();
            return bytes.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Booking draft could not be saved", e);
        }
    }
    /*
     * FIXED CODE:
     *
     * Replace the ObjectOutputStream-based saveDraft method above with this DTO
     * method.
     *
     * @Override
     * public BookingRequest saveDraft(BookingRequest request) {
     *     if (request == null) {
     *         throw new IllegalArgumentException("Booking draft is required");
     *     }
     *
     *     return request;
     * }
     */

    @Override
    public Map<String, Object> importDraft(byte[] draftBytes) {
        return importDraft(draftBytes, null);
    }

    @Override
    public Map<String, Object> importDraft(byte[] draftBytes, Integer userId) {
        if (draftBytes == null || draftBytes.length == 0) {
            throw new IllegalArgumentException("Booking draft file is required");
        }

        Object importedDraft;
        try (ObjectInputStream input = new ObjectInputStream(new ByteArrayInputStream(draftBytes))) {
            /*
             * INSECURE DESERIALIZATION SINK: this trusts attacker-controlled Java
             * serialization data.
             *
             * FIXED CODE:
             *
             * java.io.ObjectInputFilter filter =
             *         java.io.ObjectInputFilter.Config.createFilter(
             *                 "maxdepth=8;maxrefs=64;maxbytes=32768;"
             *                         + "org.example.payload.BookingRequest;"
             *                         + "java.util.ArrayList;"
             *                         + "java.lang.Object;"
             *                         + "java.lang.Integer;"
             *                         + "java.lang.Number;"
             *                         + "java.lang.String;!*");
             * input.setObjectInputFilter(filter);
             */
            importedDraft = input.readObject();
        } catch (ClassNotFoundException e) {
            throw new IllegalArgumentException("Booking draft contains an unsupported class");
        } catch (IOException e) {
            throw new IllegalArgumentException("Booking draft could not be imported");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "DRAFT_IMPORTED");
        result.put("draftType", importedDraft == null ? "null" : importedDraft.getClass().getName());

        if (importedDraft instanceof BookingRequest) {
            BookingRequest bookingRequest = (BookingRequest) importedDraft;
            result.put("quote", quote(bookingRequest, userId));
        }

        return result;
    }

    /*
     * FIXED CODE:
     *
     * @Override
     * public Map<String, Object> importDraft(BookingRequest draft, Integer userId) {
     *     if (draft == null) {
     *         throw new IllegalArgumentException("Booking draft is required");
     *     }
     *
     *     Map<String, Object> result = new LinkedHashMap<>();
     *     result.put("status", "DRAFT_IMPORTED");
     *     result.put("draftType", BookingRequest.class.getName());
     *     result.put("quote", quote(draft, userId));
     *     return result;
     * }
     */

    private List<Transaction> resolveBookingTransactions(BookingRequest request, Integer userId,
            SeatResolutionMode mode) {
        if (request == null || ObjectUtils.isEmpty(request.getTransactionIds())) {
            throw new IllegalArgumentException("transactionIds is required");
        }

        Set<Integer> uniqueTransactionIds = new LinkedHashSet<>(request.getTransactionIds());
        List<Transaction> transactions = new ArrayList<>();
        for (Integer transactionId : uniqueTransactionIds) {
            Transaction transaction = mode.requiresLock()
                    ? transactionRepository.findByIdAndIsDeletedFalseForUpdate(transactionId)
                    : transactionRepository.findByIdAndIsDeletedFalse(transactionId);
            if (transaction == null) {
                throw new IllegalArgumentException("Transaction not found: " + transactionId);
            }

            boolean expiredHold = isExpiredHold(transaction);
            if (expiredHold) {
                releaseHold(transaction);
                if (mode == SeatResolutionMode.CONFIRM) {
                    throw new IllegalStateException("Seat hold expired: " + transactionId);
                }
            }

            if (!canUseTransaction(transaction, userId, mode)) {
                throw new IllegalStateException(buildSeatUnavailableMessage(transaction, userId, mode));
            }
            transactions.add(transaction);
        }

        validateSameFlightAndSeatType(transactions);
        return transactions;
    }

    private boolean canUseTransaction(Transaction transaction, Integer userId, SeatResolutionMode mode) {
        if (transaction == null) {
            return false;
        }
        if (isAvailableTransaction(transaction)) {
            return mode != SeatResolutionMode.CONFIRM;
        }
        if (mode.allowsOwnedHold()) {
            return isOwnedActiveHold(transaction, userId);
        }
        return false;
    }

    private boolean isAvailableTransaction(Transaction transaction) {
        return transaction.getStatus() == TransactionStatusEnum.FREE
                || transaction.getStatus() == TransactionStatusEnum.CANCEL;
    }

    private boolean isOwnedActiveHold(Transaction transaction, Integer userId) {
        return userId != null
                && transaction.getStatus() == TransactionStatusEnum.HOLD
                && !isExpiredHold(transaction)
                && transaction.getUser() != null
                && transaction.getUser().getId() != null
                && transaction.getUser().getId().equals(userId);
    }

    private boolean isExpiredHold(Transaction transaction) {
        return transaction != null
                && transaction.getStatus() == TransactionStatusEnum.HOLD
                && (transaction.getHoldExpiresAt() == null
                        || !transaction.getHoldExpiresAt().after(new Date()));
    }

    private void releaseHold(Transaction transaction) {
        transaction.setStatus(TransactionStatusEnum.FREE);
        transaction.setUser(null);
        transaction.setHoldExpiresAt(null);
        transaction.setQrCode(null);
        transactionRepository.save(transaction);
    }

    private String buildSeatUnavailableMessage(Transaction transaction, Integer userId, SeatResolutionMode mode) {
        Integer transactionId = transaction == null ? null : transaction.getId();
        if (mode == SeatResolutionMode.CONFIRM && !isOwnedActiveHold(transaction, userId)) {
            return "Seat must be held before confirming: " + transactionId;
        }
        if (transaction != null && transaction.getStatus() == TransactionStatusEnum.HOLD) {
            return "Seat is currently held by another customer: " + transactionId;
        }
        return "Seat is no longer available: " + transactionId;
    }

    private void validateSameFlightAndSeatType(List<Transaction> transactions) {
        Integer flightId = null;
        SeatType seatType = null;

        for (Transaction transaction : transactions) {
            if (transaction.getFlight() == null || transaction.getSeat() == null) {
                throw new IllegalStateException("Transaction is missing flight or seat information");
            }

            Integer currentFlightId = transaction.getFlight().getId();
            SeatType currentSeatType = transaction.getSeat().getType();
            if (flightId == null) {
                flightId = currentFlightId;
            } else if (!flightId.equals(currentFlightId)) {
                throw new IllegalArgumentException("All selected seats must belong to the same flight");
            }

            if (seatType == null) {
                seatType = currentSeatType;
            } else if (seatType != currentSeatType) {
                throw new IllegalArgumentException("All selected seats must have the same seat type");
            }
        }
    }

    private Promotion resolvePromotion(BookingRequest request) {
        if (request == null || request.getPromotionCode() == null || request.getPromotionCode().trim().isEmpty()) {
            return null;
        }

        Promotion promotion = promotionRepository.findByCodeAndIsDeletedFalse(request.getPromotionCode().trim());
        if (promotion == null) {
            throw new IllegalArgumentException("Promotion not found");
        }
        return promotion;
    }

    private void validatePromotion(Promotion promotion, List<Transaction> transactions, BigDecimal subtotal) {
        if (promotion == null) {
            return;
        }

        if (promotion.getActive() == null || !promotion.getActive()) {
            throw new IllegalArgumentException("Promotion is inactive");
        }
        if (promotion.getUsageLimit() != null
                && promotion.getUsedCount() != null
                && promotion.getUsedCount() >= promotion.getUsageLimit()) {
            throw new IllegalArgumentException("Promotion usage limit reached");
        }

        Transaction firstTransaction = transactions.get(0);
        Flight flight = firstTransaction.getFlight();
        SeatType seatType = firstTransaction.getSeat().getType();
        LocalDate flightDate = flight.getStartTime().toLocalDate();

        if (promotion.getStartDate() != null && flightDate.isBefore(promotion.getStartDate().toLocalDate())) {
            throw new IllegalArgumentException("Promotion is not active for this flight date");
        }
        if (promotion.getEndDate() != null && flightDate.isAfter(promotion.getEndDate().toLocalDate())) {
            throw new IllegalArgumentException("Promotion is expired for this flight date");
        }
        if (promotion.getSeatType() != null && promotion.getSeatType() != seatType) {
            throw new IllegalArgumentException("Promotion does not apply to this seat type");
        }
        if (!matchesOptionalValue(promotion.getDepartureCode(), flight.getDepartureCode())
                || !matchesOptionalValue(promotion.getDeparture(), flight.getDeparture())
                || !matchesOptionalValue(promotion.getArrivalCode(), flight.getArrivalCode())
                || !matchesOptionalValue(promotion.getArrival(), flight.getArrival())) {
            throw new IllegalArgumentException("Promotion does not apply to this route");
        }
        if (promotion.getMinimumOrderAmount() != null
                && subtotal.compareTo(promotion.getMinimumOrderAmount()) < 0) {
            throw new IllegalArgumentException("Booking subtotal does not meet promotion minimum order amount");
        }
    }

    private BookingResponse buildResponse(BookingRequest request, List<Transaction> transactions, Promotion promotion,
            String status, Date holdExpiresAt) {
        BigDecimal subtotal = calculateSubtotal(transactions);
        BigDecimal discountAmount = calculateDiscountAmount(promotion, subtotal);
        BigDecimal totalAmount = subtotal.subtract(discountAmount).max(BigDecimal.ZERO);
        BigDecimal pricePerTicket = totalAmount.divide(
                BigDecimal.valueOf(transactions.size()),
                0,
                RoundingMode.HALF_UP);

        return BookingResponse.builder()
                .transactionIds(transactions.stream().map(Transaction::getId).collect(java.util.stream.Collectors.toList()))
                .orderId(null)
                .transactions(transactions)
                .passengerCount(transactions.size())
                .seatType(transactions.get(0).getSeat().getType().name())
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .totalAmount(totalAmount)
                .pricePerTicket(pricePerTicket)
                .promotionCode(promotion == null ? null : promotion.getCode())
                .promotionTitle(promotion == null ? null : promotion.getTitle())
                .appliedPromotionCodes(null)
                .qrCode(request.getQrCode())
                .holdExpiresAt(formatDate(holdExpiresAt))
                .status(status)
                .build();
    }

    private BookingResponse buildOrderResponse(BookingOrder order, List<Transaction> transactions, String status) {
        BigDecimal totalAmount = safeMoney(order.getTotalAmount());
        BigDecimal pricePerTicket = totalAmount.divide(
                BigDecimal.valueOf(transactions.size()),
                0,
                RoundingMode.HALF_UP);
        String lastPromotionCode = getLastPromotionCode(order.getAppliedPromotionCodes());

        return BookingResponse.builder()
                .transactionIds(transactions.stream().map(Transaction::getId).collect(java.util.stream.Collectors.toList()))
                .orderId(order.getId())
                .transactions(transactions)
                .passengerCount(transactions.size())
                .seatType(transactions.get(0).getSeat().getType().name())
                .subtotal(safeMoney(order.getSubtotal()))
                .discountAmount(safeMoney(order.getDiscountAmount()))
                .totalAmount(totalAmount)
                .pricePerTicket(pricePerTicket)
                .promotionCode(lastPromotionCode)
                .promotionTitle(null)
                .appliedPromotionCodes(order.getAppliedPromotionCodes())
                .qrCode(order.getQrCode())
                .holdExpiresAt(formatDate(order.getHoldExpiresAt()))
                .status(status)
                .build();
    }

    private BigDecimal safeMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BookingOrder resolveOwnedOrder(Integer orderId, Integer userId) {
        BookingOrder order = bookingOrderRepository.findByIdAndIsDeletedFalse(orderId);
        if (order == null) {
            throw new IllegalArgumentException("Booking order not found: " + orderId);
        }
        if (order.getUser() == null || order.getUser().getId() == null
                || !order.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Booking order does not belong to current user");
        }
        return order;
    }

    private void validateActiveOrder(BookingOrder order) {
        if (order.getStatus() != BookingOrderStatus.HOLD) {
            throw new IllegalStateException("Booking order is no longer active");
        }
        if (order.getHoldExpiresAt() == null || !order.getHoldExpiresAt().after(new Date())) {
            throw new IllegalStateException("Booking order hold expired");
        }
    }

    private List<Transaction> resolveOrderTransactions(BookingOrder order) {
        List<Transaction> transactions = new ArrayList<>();
        for (Integer transactionId : parseOrderTransactionIds(order)) {
            Transaction transaction = transactionRepository.findByIdAndIsDeletedFalse(transactionId);
            if (transaction == null) {
                throw new IllegalArgumentException("Transaction not found: " + transactionId);
            }
            transactions.add(transaction);
        }
        validateSameFlightAndSeatType(transactions);
        return transactions;
    }

    private List<Integer> parseOrderTransactionIds(BookingOrder order) {
        if (order == null || order.getTransactionIds() == null || order.getTransactionIds().trim().isEmpty()) {
            throw new IllegalArgumentException("Booking order has no seats");
        }

        return Arrays.asList(order.getTransactionIds().split(",")).stream()
                .map(String::trim)
                .filter(value -> !value.trim().isEmpty())
                .map(Integer::valueOf)
                .collect(java.util.stream.Collectors.toList());
    }

    private String joinTransactionIds(List<Transaction> transactions) {
        return transactions.stream()
                .map(Transaction::getId)
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }

    private boolean hasAppliedPromotion(BookingOrder order, String promotionCode) {
        return parsePromotionCodes(order.getAppliedPromotionCodes()).contains(promotionCode);
    }

    private Set<String> parsePromotionCodes(String promotionCodes) {
        if (promotionCodes == null || promotionCodes.trim().isEmpty()) {
            return new LinkedHashSet<>();
        }

        return Arrays.asList(promotionCodes.split(",")).stream()
                .map(String::trim)
                .filter(value -> !value.trim().isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String appendPromotionCode(String promotionCodes, String promotionCode) {
        if (promotionCodes == null || promotionCodes.trim().isEmpty()) {
            return promotionCode;
        }
        return promotionCodes + "," + promotionCode;
    }

    private String getLastPromotionCode(String promotionCodes) {
        String lastPromotionCode = null;
        for (String promotionCode : parsePromotionCodes(promotionCodes)) {
            lastPromotionCode = promotionCode;
        }
        return lastPromotionCode;
    }

    private Date resolveOwnedHoldExpiry(List<Transaction> transactions, Integer userId) {
        if (userId == null || transactions.stream().anyMatch(transaction -> !isOwnedActiveHold(transaction, userId))) {
            return null;
        }

        return transactions.stream()
                .map(Transaction::getHoldExpiresAt)
                .min(Date::compareTo)
                .orElse(null);
    }

    private String formatDate(Date date) {
        return date == null ? null : date.toInstant().toString();
    }

    private BigDecimal calculateSubtotal(List<Transaction> transactions) {
        return transactions.stream()
                .map(transaction -> parsePrice(transaction.getPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateDiscountAmount(Promotion promotion, BigDecimal subtotal) {
        if (promotion == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal discountValue = promotion.getDiscountValue() == null ? BigDecimal.ZERO
                : promotion.getDiscountValue();
        BigDecimal discountAmount;
        if (promotion.getDiscountType() == PromotionDiscountType.FIXED_AMOUNT) {
            discountAmount = discountValue;
        } else {
            discountAmount = subtotal.multiply(discountValue)
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        }

        if (promotion.getMaximumDiscountAmount() != null) {
            discountAmount = discountAmount.min(promotion.getMaximumDiscountAmount());
        }

        return discountAmount.min(subtotal).max(BigDecimal.ZERO);
    }

    private BigDecimal parsePrice(String price) {
        if (price == null || price.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }

        String normalizedPrice = price.replaceAll("[^0-9.-]", "");
        if (normalizedPrice.trim().isEmpty()) {
            return BigDecimal.ZERO;
        }

        return new BigDecimal(normalizedPrice);
    }

    private boolean matchesOptionalValue(String promotionValue, String flightValue) {
        if (promotionValue == null || promotionValue.trim().isEmpty()) {
            return true;
        }

        return normalizeText(promotionValue).equals(normalizeText(flightValue));
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }

        return Normalizer.normalize(value.trim().toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
    }

    private enum SeatResolutionMode {
        QUOTE(false, true),
        HOLD(true, true),
        CONFIRM(true, true);

        private final boolean requiresLock;
        private final boolean allowsOwnedHold;

        SeatResolutionMode(boolean requiresLock, boolean allowsOwnedHold) {
            this.requiresLock = requiresLock;
            this.allowsOwnedHold = allowsOwnedHold;
        }

        private boolean requiresLock() {
            return requiresLock;
        }

        private boolean allowsOwnedHold() {
            return allowsOwnedHold;
        }
    }
}
