package org.example.repository;

import org.example.entity.Plane;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaneRepository extends JpaRepository<Plane, Integer> {
    Page<Plane> findByNameContainsAndIsDeletedFalse(String name, Pageable pageable);
    Page<Plane> findByIsDeletedFalse(Pageable pageable);
    Boolean existsByIdAndIsDeletedFalse(Integer id);
    Plane findByIdAndIsDeletedFalse(Integer id);
}
