package org.example.service;

import org.example.entity.Plane;
import org.example.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlaneService {
    List<Plane> findByName(String name,Pageable pageable);
    Plane findById(Integer id);
    List<Plane> findAll(Pageable pageable);

    boolean existsById(Integer id);

    void deletesById(Integer id);

    Plane save(Plane plane);
}
