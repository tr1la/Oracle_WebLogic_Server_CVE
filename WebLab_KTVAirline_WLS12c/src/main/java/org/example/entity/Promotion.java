package org.example.entity;

import javax.persistence.*;
import lombok.*;
import org.example.constant.PromotionDiscountType;
import org.example.constant.SeatType;

import java.math.BigDecimal;
import java.sql.Date;

@Table(name = "PROMOTION")
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class Promotion extends BaseObject {
    @Column(name = "CODE", nullable = false, unique = true)
    private String code;

    @Column(name = "TITLE", nullable = false)
    private String title;

    @Column(name = "DESCRIPTION", length = 2000)
    private String description;

    @Column(name = "DEPARTURE")
    private String departure;

    @Column(name = "DEPARTURE_CODE")
    private String departureCode;

    @Column(name = "ARRIVAL")
    private String arrival;

    @Column(name = "ARRIVAL_CODE")
    private String arrivalCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "SEAT_TYPE")
    private SeatType seatType;

    @Enumerated(EnumType.STRING)
    @Column(name = "DISCOUNT_TYPE", nullable = false)
    private PromotionDiscountType discountType;

    @Column(name = "DISCOUNT_VALUE", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "MINIMUM_ORDER_AMOUNT", precision = 12, scale = 2)
    private BigDecimal minimumOrderAmount;

    @Column(name = "MAXIMUM_DISCOUNT_AMOUNT", precision = 12, scale = 2)
    private BigDecimal maximumDiscountAmount;

    @Column(name = "START_DATE", nullable = false)
    private Date startDate;

    @Column(name = "END_DATE", nullable = false)
    private Date endDate;

    @Column(name = "USAGE_LIMIT")
    private Integer usageLimit;

    @Column(name = "USED_COUNT", nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "IS_ACTIVE", nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "PICTURE_LINK")
    private String pictureLink;

    @Column(name = "TERMS", length = 2000)
    private String terms;
}
