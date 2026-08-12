package org.example.repository;

import org.example.constant.Category;
import org.example.entity.News;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsRepository extends JpaRepository<News, Integer> {
    public Page<News> findByIsDeletedFalse(Pageable pageable);
    public Page<News> findByTitleContainsAndIsDeletedFalse(String title, Pageable pageable);
    public Page<News> findByCategoryAndIsDeletedFalse(Category category, Pageable pageable);
    public News findByIdAndIsDeletedFalse(Integer id);
}
