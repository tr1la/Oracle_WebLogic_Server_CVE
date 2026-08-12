package org.example.controller;

import org.example.constant.Category;
import org.example.entity.News;
import org.example.service.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/news")
public class NewsController {
    @Autowired
    NewsService newsService;

    @GetMapping(value = "/all")
    public ResponseEntity<?> getAll(@RequestParam Integer pageNum, @RequestParam Integer pageSize) {
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);
            List<News> newsList = newsService.findAll(pageable);
            if (ObjectUtils.isEmpty(newsList)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(newsList);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @GetMapping(value = "/title")
    public ResponseEntity<?> getAll(@RequestParam String title, @RequestParam Integer pageNum
            , @RequestParam Integer pageSize) {
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);
            List<News> newsList = newsService.findByTitle(title, pageable);
            if (ObjectUtils.isEmpty(newsList)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(newsList);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @GetMapping(value = "/category")
    public ResponseEntity<?> getByCategory(@RequestParam Category category
            , @RequestParam Integer pageNum, @RequestParam Integer pageSize) {
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);
            List<News> newsList = newsService.findByCategory(category, pageable);
            if (ObjectUtils.isEmpty(newsList)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(newsList);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @GetMapping(value = "/id")
    public ResponseEntity<?> getById(@RequestParam Integer id) {
        try {
            News news = newsService.findById(id);
            if (ObjectUtils.isEmpty(news)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(news);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @PostMapping
    public ResponseEntity<?> createNews(@RequestBody News news) {
        try {
            news.setId(null);
            News savedNews = newsService.save(news);
            return ResponseEntity.ok().body(savedNews);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @PutMapping
    public ResponseEntity<?> editNews(@RequestBody News news) {
        try {
            News savedNews = newsService.save(news);
            return ResponseEntity.ok().body(savedNews);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @PutMapping(value = "/list")
    public ResponseEntity<?> editNewsList(@RequestBody List<News> newsList) {
        try {
            for(News news : newsList){
                News savedNews = newsService.save(news);
            }
            return ResponseEntity.ok().body("Edited");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deleteNews(@RequestParam Integer id) {
        try {
            newsService.delete(id);
            return ResponseEntity.ok().body("Deleted");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }
}
