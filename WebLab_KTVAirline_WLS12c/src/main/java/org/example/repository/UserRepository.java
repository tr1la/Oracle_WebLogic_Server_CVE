package org.example.repository;

import org.example.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {
    User findByEmailAndIsDeletedFalse(String email);
    Boolean existsByEmailAndIsDeletedFalse(String email);
    Page<User> findByIsDeletedFalse(Pageable pageable);
    Boolean existsByIdAndIsDeletedFalse(Integer id);
    User findByIdAndIsDeletedFalse(Integer id);
    Boolean existsByIdAndAvatarUrlAndIsDeletedFalse(Integer id, String avatarUrl);
}
