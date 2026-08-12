package org.example.payload;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;
import org.example.util.QRCodeHelper;

import java.io.Serializable;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class BookingRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    private List<Integer> transactionIds;

    private Integer orderId;

    private String promotionCode;

    @JsonIgnore
    public String getQrCode() {
        return new QRCodeHelper().renderQrCode(buildQrCodeContent());
    }

    private String buildQrCodeContent() {
        String promotionPart = promotionCode == null || promotionCode.trim().isEmpty()
                ? "NO_PROMOTION"
                : promotionCode.trim();
        String transactionPart = transactionIds == null || transactionIds.isEmpty()
                ? "NO_TRANSACTION"
                : transactionIds.stream()
                        .map(String::valueOf)
                        .collect(Collectors.joining(","));

        String orderPart = orderId == null ? "NO_ORDER" : "ORDER_" + orderId;
        return orderPart + "+" + transactionPart + "+" + promotionPart;
    }
}
