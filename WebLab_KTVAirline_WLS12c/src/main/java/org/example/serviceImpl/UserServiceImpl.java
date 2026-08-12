package org.example.serviceImpl;

import org.example.entity.User;
import org.example.repository.UserRepository;
import org.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    private static final Set<String> BLOCKED_FILE_EXTENSIONS = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            ".exe",
            ".bat",
            ".cmd",
            ".sh",
            ".jar",
            ".jsp",
            ".xml")));
    private static final Set<String> ALLOWED_IMAGE_TYPES = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            "image/jpeg", "image/png")));

    private static final Pattern OBVIOUS_PARENT_TRAVERSAL = Pattern.compile("(^|[\\\\/])\\.\\.(?:[\\\\/]+|$)");

    @Override
    public Integer saveUser(User user) {
        user.setPassword(encoder.encode(user.getPassword()));
        return userRepository.save(user).getId();
    }

    @Override
    public Integer save(User user) {
        return userRepository.save(user).getId();
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmailAndIsDeletedFalse(email);
    }

    @Override
    public User findById(Integer id) {
        return userRepository.findByIdAndIsDeletedFalse(id);
    }

    @Override
    public List<User> findAll(Pageable pageable) {
        return userRepository.findByIsDeletedFalse(pageable).getContent();
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmailAndIsDeletedFalse(email);
    }

    @Override
    public boolean existsById(Integer id) {
        return userRepository.existsByIdAndIsDeletedFalse(id);
    }

    @Override
    public void deletesById(Integer id) {
        User user = userRepository.findByIdAndIsDeletedFalse(id);
        user.setDeleted(true);
        userRepository.save(user);
    }

    @Override
    public User uploadAvatar(Integer id, MultipartFile file, String requestedFilename) throws IOException {
        User user = userRepository.findByIdAndIsDeletedFalse(id);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Avatar file is required");
        }

        Path avatarDir = Paths.get(uploadDir, "avatars").toAbsolutePath().normalize();
        Files.createDirectories(avatarDir);

        String contentType = file.getContentType();
        if (contentType == null ||
                !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Only images are allowed");
        }

        String extension = getSafeImageExtension(contentType);
        String safeFilename = UUID.randomUUID() + extension;
        Path destination = avatarDir.resolve(safeFilename).normalize();
        if (!destination.startsWith(avatarDir)) {
            throw new IllegalArgumentException("Invalid upload path");
        }

        file.transferTo(destination.toFile());
        user.setAvatarUrl("/uploads/avatars/" + safeFilename);
        return user;
    }

    private boolean isBlockedByBlacklist(String filename) {
        return BLOCKED_FILE_EXTENSIONS.stream().anyMatch(filename::endsWith);
    }

    private String getSafeImageExtension(String contentType) {
        if (contentType == "image/jpeg") {
            return ".jpg";
        } else
            return ".png";
    }

    private String resolveUploadFilename(MultipartFile file, String requestedFilename) {
        if (requestedFilename != null && !requestedFilename.trim().isEmpty()) {
            return requestedFilename.trim();
        }
        return file.getOriginalFilename();
    }

    private void rejectRelativeParentPath(String value, String message) {
        if (OBVIOUS_PARENT_TRAVERSAL.matcher(value).find()) {
            throw new IllegalArgumentException(message);
        }
    }
}
