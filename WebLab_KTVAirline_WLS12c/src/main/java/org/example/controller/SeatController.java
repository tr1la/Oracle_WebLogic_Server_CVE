package org.example.controller;

import org.example.constant.SeatStatus;
import org.example.entity.Seat;
import org.example.service.SeatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/seat")
public class SeatController {
    @Autowired
    SeatService seatService;

    @GetMapping(value = "/conditions")
    public ResponseEntity<?> getByEmail(@RequestParam String name
            , @RequestParam Boolean haveWindow
            , @RequestParam Integer pageNum
            , @RequestParam Integer pageSize){
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);
            List<Seat> seats = seatService.findByConditions(name, haveWindow, pageable);
            if(ObjectUtils.isEmpty(seats)){
                return ResponseEntity.notFound().build();
            } else {
                return ResponseEntity.ok().body(seats);
            }
        } catch (Exception e){
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }


    @GetMapping(value = "/id")
    public ResponseEntity<?> getById(@RequestParam Integer id){
        try {
            Seat seat = seatService.findById(id);
            if(ObjectUtils.isEmpty(seat)){
                return ResponseEntity.badRequest()
                        .body("Error: Id is not exist!");
            } else {
                return ResponseEntity.ok().body(seat);
            }
        } catch (Exception e){
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @GetMapping(value = "/all")
    public ResponseEntity<?> getAll(@RequestParam Integer pageNum
            , @RequestParam Integer pageSize) {
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);
            List<Seat> seatList = seatService.findAll(pageable);
            if(seatList.isEmpty()){
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(seatList);
            }
        } catch (Exception e){
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @PostMapping
    public ResponseEntity<?> saveSeat(@RequestBody Seat seat) {
        try {
            seat.setId(null);
            Seat saveSeat = seatService.save(seat);
            return ResponseEntity.ok().body(saveSeat);
        } catch (Exception e){
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deleteById(@RequestParam Integer id){
        try {
            if(seatService.existsById(id)){
                seatService.deletesById(id);
                return ResponseEntity.ok()
                        .body("Deleted");
            } else {
                return ResponseEntity.badRequest()
                        .body("Not found");
            }
        } catch (Exception e){
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @PutMapping
    public ResponseEntity<?> editUser(@RequestBody Seat seat){
        try {
            if(seatService.existsById(seat.getId())){
                seatService.save(seat);
                return ResponseEntity.ok()
                        .body("Edited");
            } else {
                return ResponseEntity.badRequest()
                        .body("Not found");
            }
        } catch (Exception e){
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }
}
