package org.example.entity;

import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Table(
        name = "booking_order_promotion",
        uniqueConstraints = @UniqueConstraint(
                name = "UK_ORDER_PROMOTION",
                columnNames = {"ORDER_ID", "PROMOTION_ID"}))
@Entity
@Getter
@Setter
public class BookingOrderPromotion extends BaseObject {
    @ManyToOne
    @JoinColumn(name = "ORDER_ID", nullable = false)
    private BookingOrder order;

    @ManyToOne
    @JoinColumn(name = "PROMOTION_ID", nullable = false)
    private Promotion promotion;
}

/*
 * FIXED CODE:
 *
 * @Table(
 *     name = "booking_order_promotion",
 *     uniqueConstraints = @UniqueConstraint(
 *         name = "UK_ORDER_PROMOTION",
 *         columnNames = {"ORDER_ID", "PROMOTION_ID"}
 *     )
 * )
 * @Entity
 * @Getter
 * @Setter
 * public class BookingOrderPromotion extends BaseObject {
 *     @ManyToOne
 *     @JoinColumn(name = "ORDER_ID", nullable = false)
 *     private BookingOrder order;
 *
 *     @ManyToOne
 *     @JoinColumn(name = "PROMOTION_ID", nullable = false)
 *     private Promotion promotion;
 * }
 */
