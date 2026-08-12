package org.example.service;

import org.example.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface UserService {
    public Integer saveUser(User user);

    public Integer save(User user);

    public User findByEmail(String email);

    public User findById(Integer id);

    public List<User> findAll(Pageable pageable);

    public boolean existsByEmail(String email);

    public boolean existsById(Integer id);

    public void deletesById(Integer id);

    public User uploadAvatar(Integer id, MultipartFile file, String filename) throws IOException;
}
