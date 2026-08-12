package org.example.payload;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.example.entity.Transaction;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
public class BookingResponse {
    private List<Integer> transactionIds;

    private Integer orderId;

    private List<Transaction> transactions;

    private Integer passengerCount;

    private String seatType;

    private BigDecimal subtotal;

    private BigDecimal discountAmount;

    private BigDecimal totalAmount;

    private BigDecimal pricePerTicket;

    private String promotionCode;

    private String promotionTitle;

    private String appliedPromotionCodes;

    private String qrCode;

    private String holdExpiresAt;

    private String status;
}
