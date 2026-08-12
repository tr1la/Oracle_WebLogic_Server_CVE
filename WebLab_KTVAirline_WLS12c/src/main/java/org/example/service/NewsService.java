package org.example.service;

import org.example.constant.Category;
import org.example.entity.News;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NewsService {
    public List<News> findAll(Pageable pageable);
    public List<News> findByTitle(String title, Pageable pageable);
    public List<News> findByCategory(Category category, Pageable pageable);
    public News findById(Integer id);
    public News save(News book);
    public void delete(Integer id);
}
