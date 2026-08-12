package org.example.serviceImpl;

import org.example.constant.Category;
import org.example.entity.News;
import org.example.repository.NewsRepository;
import org.example.service.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NewsServiceImpl implements NewsService {
    @Autowired
    NewsRepository newsRepository;

    @Override
    public List<News> findAll(Pageable pageable) {
        return newsRepository.findByIsDeletedFalse(pageable).getContent();
    }

    @Override
    public List<News> findByTitle(String title, Pageable pageable) {
        return newsRepository.findByTitleContainsAndIsDeletedFalse(title, pageable).getContent();
    }

    @Override
    public List<News> findByCategory(Category category, Pageable pageable) {
        return newsRepository.findByCategoryAndIsDeletedFalse(category, pageable).getContent();
    }

    @Override
    public News findById(Integer id) {
        return newsRepository.findByIdAndIsDeletedFalse(id);
    }

    @Override
    public News save(News book) {
        return newsRepository.save(book);
    }

    @Override
    public void delete(Integer id) {
        News book = newsRepository.findByIdAndIsDeletedFalse(id);
        book.setDeleted(true);
        newsRepository.save(book);
    }
}
