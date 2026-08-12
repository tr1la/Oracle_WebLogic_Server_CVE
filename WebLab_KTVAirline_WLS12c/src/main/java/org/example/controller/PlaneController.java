package org.example.controller;


import org.example.entity.Plane;
import org.example.entity.User;
import org.example.service.PlaneService;
import org.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plane")
public class PlaneController {
    @Autowired
    PlaneService planeService;

    @GetMapping(value = "/name")
    public ResponseEntity<?> getByEmail(@RequestParam String name, @RequestParam Integer pageNum
            , @RequestParam Integer pageSize){
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);
            List<Plane> planes = planeService.findByName(name, pageable);
            if(ObjectUtils.isEmpty(planes)){
                return ResponseEntity.notFound().build();
            } else {
                return ResponseEntity.ok().body(planes);
            }
        } catch (Exception e){
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @PostMapping
    public ResponseEntity<?> savePlane(@RequestBody Plane plane){
        try {
            plane.setId(null);
            Plane savePlane = planeService.save(plane);
            return ResponseEntity.ok().body(savePlane);
        } catch (Exception e){
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @GetMapping(value = "/id")
    public ResponseEntity<?> getById(@RequestParam Integer id){
        try {
            Plane plane = planeService.findById(id);
            if(ObjectUtils.isEmpty(plane)){
                return ResponseEntity.badRequest()
                        .body("Error: Id is not exist!");
            } else {
                return ResponseEntity.ok().body(plane);
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
            List<Plane> planeList = planeService.findAll(pageable);
            if(planeList.isEmpty()){
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(planeList);
            }
        } catch (Exception e){
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deleteById(@RequestParam Integer id){
        try {
            if(planeService.existsById(id)){
                planeService.deletesById(id);
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
    public ResponseEntity<?> editUser(@RequestBody Plane plane){
        try {
            if(planeService.existsById(plane.getId())){
                planeService.save(plane);
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
