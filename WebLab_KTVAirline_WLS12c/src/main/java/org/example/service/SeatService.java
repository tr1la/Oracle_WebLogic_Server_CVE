package org.example.service;

import org.example.entity.Seat;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeatService {
    List<Seat> findByConditions(String name, Boolean haveWindow, Pageable pageable);

    Seat findById(Integer id);

    List<Seat> findAll(Pageable pageable);

    boolean existsById(Integer id);

    void deletesById(Integer id);

    Seat save(Seat seat);
}
