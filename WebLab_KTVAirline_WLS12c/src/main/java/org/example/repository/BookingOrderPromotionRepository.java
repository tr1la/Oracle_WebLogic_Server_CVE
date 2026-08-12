package org.example.repository;

import org.example.entity.BookingOrderPromotion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingOrderPromotionRepository extends JpaRepository<BookingOrderPromotion, Integer> {
    boolean existsByOrderIdAndPromotionId(Integer orderId, Integer promotionId);

    List<BookingOrderPromotion> findByOrderIdAndIsDeletedFalse(Integer orderId);
}

/*
 * FIXED CODE:
 *
 * public interface BookingOrderPromotionRepository
 *         extends JpaRepository<BookingOrderPromotion, Integer> {
 *     boolean existsByOrderIdAndPromotionId(Integer orderId, Integer promotionId);
 *     List<BookingOrderPromotion> findByOrderIdAndIsDeletedFalse(Integer orderId);
 * }
 */
