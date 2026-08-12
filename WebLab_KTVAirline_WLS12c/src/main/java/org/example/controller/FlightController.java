package org.example.controller;

import org.example.constant.FlightStatus;
import org.example.entity.Flight;
import org.example.service.FlightService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/flight")
public class FlightController {
    @Autowired
    FlightService flightService;

    @GetMapping(value = "/conditions")
    public ResponseEntity<?> getByConditions(
            @RequestParam String flightName,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate dateFrom,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate dateTo,
            @RequestParam String departure,
            @RequestParam String arrival,
            @RequestParam Integer pageNum,
            @RequestParam Integer pageSize) {
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);

            // Convert LocalDate to LocalDateTime for start and end of day
            LocalDateTime dateTimeFrom = dateFrom.atStartOfDay();
            LocalDateTime dateTimeTo = dateTo.atTime(LocalTime.MAX);

            List<Flight> flightList = flightService.searchFlights(
                    flightName, dateTimeFrom, dateTimeTo, departure, arrival, pageable);

            if (ObjectUtils.isEmpty(flightList)) {
                Map<String, Object> response = new HashMap<>();
                response.put("status", "NOT_FOUND");
                response.put("message", "Không tìm thấy chuyến bay phù hợp");
                return ResponseEntity.ok().body(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("status", "SUCCESS");
                response.put("data", flightList);
                response.put("total", flightList.size());
                return ResponseEntity.ok().body(response);
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Lỗi server: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
        /*
         * catch (Exception e) {
         * String requestId = UUID.randomUUID().toString();
         * logger.warn("Flight search failed, requestId={}", requestId, e);
         * Map<String, Object> response = new HashMap<>();
         * response.put("status", "ERROR");
         * response.put("message", "Server Error");
         * response.put("requestId", requestId);
         * return ResponseEntity.internalServerError().body(response);
         * }
         */
    }

    @GetMapping(value = "/all")
    public ResponseEntity<?> getAll(@RequestParam Integer pageNum, @RequestParam Integer pageSize) {
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);
            List<Flight> flightList = flightService
                    .findAll(pageable);
            if (ObjectUtils.isEmpty(flightList)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(flightList);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @GetMapping(value = "/id")
    public ResponseEntity<?> getById(@RequestParam Integer id) {
        try {
            Flight transaction = flightService.findById(id);
            if (ObjectUtils.isEmpty(transaction)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(transaction);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @PostMapping
    public ResponseEntity<?> saveFlight(@RequestBody Flight transaction) {
        try {
            transaction.setId(null);
            Flight savedFlight = flightService.save(transaction);
            if (ObjectUtils.isEmpty(transaction)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(savedFlight);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @PutMapping
    public ResponseEntity<?> editFlight(@RequestBody Flight transaction) {
        try {
            Flight editedFlight = flightService.save(transaction);
            if (ObjectUtils.isEmpty(transaction)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(editedFlight);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @PutMapping(value = "/list")
    public ResponseEntity<?> editFlights(@RequestBody List<Flight> transactions) {
        try {
            for (Flight transaction : transactions) {
                Flight savedFlight = flightService.save(transaction);
            }
            return ResponseEntity.ok().body("Edited");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deleteFlight(@RequestParam Integer id) {
        try {
            if (ObjectUtils.isEmpty(flightService.findById(id))) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                flightService.delete(id);
                return ResponseEntity.ok().body("Deleted");
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @GetMapping(value = "/status")
    public ResponseEntity<?> getByStatus(@RequestParam FlightStatus statusEnum) {
        try {
            List<Flight> transaction = flightService.findByStatus(statusEnum);
            if (ObjectUtils.isEmpty(transaction)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(transaction);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }
}
