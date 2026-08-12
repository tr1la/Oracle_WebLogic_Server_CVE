package org.example.controller;

import org.example.entity.User;
import org.example.security.UserDetailsImpl;
import org.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1/user")
public class UserController {
    private static final Pattern SAFE_PROFILE_QR_EMAIL = Pattern.compile(
            "^[A-Za-z0-9][A-Za-z0-9._%+-]{0,63}@"
                    + "[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?"
                    + "(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$");

    @Autowired
    UserService userService;

    @GetMapping(value = "/email")
    public ResponseEntity<?> getByEmail(@RequestParam String email, Authentication authentication){
        try {
            User user = userService.findByEmail(email);
            if(ObjectUtils.isEmpty(user)){
                return ResponseEntity.notFound().build();
            } else if (!canAccessUser(authentication, user.getId())) {
                return ResponseEntity.status(403).body("Forbidden");
            } else {
                return ResponseEntity.ok().body(user);
            }
        } catch (Exception e){
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @GetMapping(value = "/id")
    public ResponseEntity<?> getById(@RequestParam Integer id, Authentication authentication){
        try {
            User user = userService.findById(id);
            if(ObjectUtils.isEmpty(user)){
                return ResponseEntity.badRequest()
                        .body("Error: Id is not exist!");
            } else if (!canAccessUser(authentication, user.getId())) {
                return ResponseEntity.status(403).body("Forbidden");
            } else {
                return ResponseEntity.ok().body(user);
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
            List<User> userList = userService.findAll(pageable);
            if(userList.isEmpty()){
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(userList);
            }
        } catch (Exception e){
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deleteById(@RequestParam Integer id){
        try {
            if(userService.existsById(id)){
                userService.deletesById(id);
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
    public ResponseEntity<?> editUser(@RequestBody User user, Authentication authentication){
        try {
            if(userService.existsById(user.getId())){
                if (!canAccessUser(authentication, user.getId())) {
                    return ResponseEntity.status(403).body("Forbidden");
                }

                User existingUser = userService.findById(user.getId());
                normalizeEditableEmail(user, existingUser);
                user.setPassword(existingUser.getPassword());
                user.setRole(existingUser.getRole());
                user.setDeleted(existingUser.isDeleted());
                if (user.getAvatarUrl() == null) {
                    user.setAvatarUrl(existingUser.getAvatarUrl());
                }
                if (user.getProfileTheme() == null) {
                    user.setProfileTheme(existingUser.getProfileTheme());
                }
                /*
                 * SINK: profileTheme is persisted from a client-controlled JSON body.
                 * It later reaches CustomThemeLoader, so a tampered API request can
                 * turn the theme field into a path-traversal/LFI selector.
                 *
                 * FIXED CODE:
                 *
                 * java.util.Set<String> allowedProfileThemes = java.util.Set.of(
                 *         "light_mode.ftl", "dark_mode.ftl");
                 *
                 * String requestedTheme = user.getProfileTheme();
                 * if (!org.springframework.util.StringUtils.hasText(requestedTheme)) {
                 *     user.setProfileTheme(existingUser.getProfileTheme());
                 * } else if (!allowedProfileThemes.contains(requestedTheme.trim())) {
                 *     return ResponseEntity.badRequest().body("Invalid profile theme");
                 * } else {
                 *     user.setProfileTheme(requestedTheme.trim());
                 * }
                 */
                userService.save(user);
                return ResponseEntity.ok()
                        .body("Edited");
            } else {
                return ResponseEntity.badRequest()
                        .body("Not found");
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e){
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @PostMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAvatar(@PathVariable Integer id,
                                          @RequestParam("file") MultipartFile file,
                                          @RequestParam(value = "filename", required = false) String filename,
                                          Authentication authentication) {
        try {
            if (!canAccessUser(authentication, id)) {
                return ResponseEntity.status(403).body("Forbidden");
            }
            User user = userService.uploadAvatar(id, file, filename);
            return ResponseEntity.ok().body(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }

    private void normalizeEditableEmail(User user, User existingUser) {
        if (user.getEmail() == null) {
            user.setEmail(existingUser.getEmail());
            return;
        }

        String email = user.getEmail().trim();
        if (!SAFE_PROFILE_QR_EMAIL.matcher(email).matches()) {
            throw new IllegalArgumentException("Invalid email");
        }
        user.setEmail(email);
    }

    private boolean canAccessUser(Authentication authentication, Integer userId) {
        return isAdmin(authentication) || userId != null && userId.equals(getAuthenticatedUserId(authentication));
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    private Integer getAuthenticatedUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            return userDetails.getId();
        }
        return null;
    }
}
