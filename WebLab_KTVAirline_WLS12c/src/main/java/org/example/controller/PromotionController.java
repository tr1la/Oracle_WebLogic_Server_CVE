package org.example.controller;

import org.example.constant.SeatType;
import org.example.entity.Promotion;
import org.example.service.PromotionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/promotion")
public class PromotionController {
    @Autowired
    PromotionService promotionService;

    @GetMapping(value = "/all")
    public ResponseEntity<?> getAll(@RequestParam Integer pageNum, @RequestParam Integer pageSize) {
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);
            List<Promotion> promotions = promotionService.findAll(pageable);
            if (ObjectUtils.isEmpty(promotions)) {
                return ResponseEntity.badRequest().body("Not found");
            } else {
                return ResponseEntity.ok().body(promotions);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }

    @GetMapping(value = "/id")
    public ResponseEntity<?> getById(@RequestParam Integer id) {
        try {
            Promotion promotion = promotionService.findById(id);
            if (ObjectUtils.isEmpty(promotion)) {
                return ResponseEntity.badRequest().body("Not found");
            } else {
                return ResponseEntity.ok().body(promotion);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }

    @GetMapping(value = "/code")
    public ResponseEntity<?> getByCode(@RequestParam String code, @RequestParam Integer pageNum,
                                       @RequestParam Integer pageSize) {
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);
            List<Promotion> promotions = promotionService.findByCode(code, pageable);
            if (ObjectUtils.isEmpty(promotions)) {
                return ResponseEntity.badRequest().body("Not found");
            } else {
                return ResponseEntity.ok().body(promotions);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }

    @GetMapping(value = "/title")
    public ResponseEntity<?> getByTitle(@RequestParam String title, @RequestParam Integer pageNum,
                                        @RequestParam Integer pageSize) {
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);
            List<Promotion> promotions = promotionService.findByTitle(title, pageable);
            if (ObjectUtils.isEmpty(promotions)) {
                return ResponseEntity.badRequest().body("Not found");
            } else {
                return ResponseEntity.ok().body(promotions);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }

    @GetMapping(value = "/active")
    public ResponseEntity<?> getByActive(@RequestParam Boolean active, @RequestParam Integer pageNum,
                                         @RequestParam Integer pageSize) {
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);
            List<Promotion> promotions = promotionService.findByActive(active, pageable);
            if (ObjectUtils.isEmpty(promotions)) {
                return ResponseEntity.badRequest().body("Not found");
            } else {
                return ResponseEntity.ok().body(promotions);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }

    @GetMapping(value = "/seat-type")
    public ResponseEntity<?> getBySeatType(@RequestParam SeatType seatType, @RequestParam Integer pageNum,
                                           @RequestParam Integer pageSize) {
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);
            List<Promotion> promotions = promotionService.findBySeatType(seatType, pageable);
            if (ObjectUtils.isEmpty(promotions)) {
                return ResponseEntity.badRequest().body("Not found");
            } else {
                return ResponseEntity.ok().body(promotions);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }

    @PostMapping
    public ResponseEntity<?> createPromotion(@RequestBody Promotion promotion) {
        try {
            promotion.setId(null);
            Promotion savedPromotion = promotionService.save(promotion);
            return ResponseEntity.ok().body(savedPromotion);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }

    @PostMapping(value = "/import-xml", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> importPromotionXml(@RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok().body(promotionService.queuePromotionXml(file));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Could not queue promotion XML import");
        }
    }

    @PutMapping
    public ResponseEntity<?> editPromotion(@RequestBody Promotion promotion) {
        try {
            Promotion savedPromotion = promotionService.save(promotion);
            return ResponseEntity.ok().body(savedPromotion);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }

    @PutMapping(value = "/list")
    public ResponseEntity<?> editPromotionList(@RequestBody List<Promotion> promotionList) {
        try {
            for (Promotion promotion : promotionList) {
                promotionService.save(promotion);
            }
            return ResponseEntity.ok().body("Edited");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deletePromotion(@RequestParam Integer id) {
        try {
            promotionService.delete(id);
            return ResponseEntity.ok().body("Deleted");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }
}
