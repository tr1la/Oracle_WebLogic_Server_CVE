package org.example.service;

import org.example.constant.SeatType;
import org.example.entity.Promotion;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public interface PromotionService {
    public List<Promotion> findAll(Pageable pageable);

    public List<Promotion> findByCode(String code, Pageable pageable);

    public List<Promotion> findByTitle(String title, Pageable pageable);

    public List<Promotion> findByActive(Boolean active, Pageable pageable);

    public List<Promotion> findBySeatType(SeatType seatType, Pageable pageable);

    public Promotion findById(Integer id);

    public Promotion save(Promotion promotion);

    public Promotion importPromotion(Promotion promotion);

    public Map<String, String> queuePromotionXml(MultipartFile file) throws IOException;

    public void delete(Integer id);
}
