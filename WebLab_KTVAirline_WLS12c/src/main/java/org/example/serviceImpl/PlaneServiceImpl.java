package org.example.serviceImpl;

import org.example.entity.Plane;
import org.example.repository.PlaneRepository;
import org.example.service.PlaneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlaneServiceImpl implements PlaneService {
    @Autowired
    PlaneRepository planeRepository;

    @Override
    public List<Plane> findByName(String name, Pageable pageable) {
        return planeRepository.findByNameContainsAndIsDeletedFalse(name, pageable).getContent();
    }

    @Override
    public Plane findById(Integer id) {
        return planeRepository.findByIdAndIsDeletedFalse(id);
    }

    @Override
    public List<Plane> findAll(Pageable pageable) {
        return planeRepository.findByIsDeletedFalse(pageable).getContent();
    }

    @Override
    public boolean existsById(Integer id) {
        return planeRepository.existsByIdAndIsDeletedFalse(id);
    }

    @Override
    public void deletesById(Integer id) {
        Plane plane = planeRepository.findByIdAndIsDeletedFalse(id);
        if (plane == null) {
            return;
        }
        plane.setDeleted(true);
        planeRepository.save(plane);
    }

    @Override
    public Plane save(Plane plane) {
        return planeRepository.save(plane);
    }
}
