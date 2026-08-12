package org.example.repository;

import org.example.constant.SeatType;
import org.example.entity.Promotion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromotionRepository extends JpaRepository<Promotion, Integer> {
    public Page<Promotion> findByIsDeletedFalse(Pageable pageable);

    public Page<Promotion> findByCodeContainsAndIsDeletedFalse(String code, Pageable pageable);

    public Page<Promotion> findByTitleContainsAndIsDeletedFalse(String title, Pageable pageable);

    public Page<Promotion> findByActiveAndIsDeletedFalse(Boolean active, Pageable pageable);

    public Page<Promotion> findBySeatTypeAndIsDeletedFalse(SeatType seatType, Pageable pageable);

    public Promotion findByIdAndIsDeletedFalse(Integer id);

    public Promotion findByCodeAndIsDeletedFalse(String code);
}
