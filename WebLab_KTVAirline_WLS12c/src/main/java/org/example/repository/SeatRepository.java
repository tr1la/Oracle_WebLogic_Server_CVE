package org.example.repository;

import org.example.entity.Seat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeatRepository extends JpaRepository<Seat, Integer> {
    Seat findByIdAndIsDeletedFalse(Integer id);
    Boolean existsByIdAndIsDeletedFalse(Integer id);
    Page<Seat> findByIsDeletedFalse(Pageable pageable);
    Page<Seat> findByNameContainsAndHaveWindowAndDeletedFalse(String name, Boolean haveWindow, Pageable pageable);
}
