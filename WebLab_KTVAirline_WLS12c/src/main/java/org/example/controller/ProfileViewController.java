package org.example.controller;

import org.example.entity.User;
import org.example.security.UserDetailsImpl;
import org.example.service.UserService;
import org.example.util.CustomThemeLoader;
import org.example.util.ProfileTheme;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Date;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Controller
public class ProfileViewController {
    private static final String EMPTY_VALUE = "Chưa cập nhật";
    private static final String DEFAULT_THEME = "light_mode.ftl";
    private static final DateTimeFormatter PROFILE_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final UserService userService;
    private final CustomThemeLoader customThemeLoader;

    public ProfileViewController(UserService userService, CustomThemeLoader customThemeLoader) {
        this.userService = userService;
        this.customThemeLoader = customThemeLoader;
    }

    @GetMapping(value = "/api/v1/profile/basic-info", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String basicInfo(Authentication authentication) {
        User user = resolveAuthenticatedUser(authentication);

        String themeName = resolveThemeName(user);
        /*
         * SINK REACHABILITY: profileTheme is persisted from the authenticated
         * user's JSON profile update, then passed directly to the server-side theme
         * loader when the profile card is rendered.
         *
         * FIXED CODE:
         *
         * String requestedTheme = user == null ? null : user.getProfileTheme();
         * String requestedThemeName = requestedTheme == null ? "" : requestedTheme.trim();
         * String themeName = "dark_mode.ftl".equals(requestedThemeName) ? "dark_mode.ftl" : DEFAULT_THEME;
         * return customThemeLoader.loadProfileTheme(themeName, buildProfileModel(user));
         */
        return customThemeLoader.loadProfileTheme(themeName, buildProfileModel(user));
    }

    private User resolveAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        User user = null;
        if (userDetails.getId() != null) {
            user = userService.findById(userDetails.getId());
        }
        if (user == null && StringUtils.hasText(userDetails.getEmail())) {
            user = userService.findByEmail(userDetails.getEmail());
        }
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        return user;
    }

    private Map<String, Object> buildProfileModel(User user) {
        Map<String, Object> model = new HashMap<>();
        /*
         * SINK ENABLER: profileTheme is a business object instead of a plain
         * string. With DefaultObjectWrapper bean fallback on Freemarker 2.3.29,
         * templates can use profileTheme.class.protectionDomain.classLoader as an
         * object-chain anchor without exposing the whole User entity.
         *
         * FIXED CODE:
         *
         * String profileEmail = valueOrDefault(user.getEmail());
         * String selectedTheme = user == null || user.getProfileTheme() == null
         *         ? DEFAULT_THEME
         *         : user.getProfileTheme().trim();
         *
         * model.put("name", valueOrDefault(user.getName()));
         * model.put("email", profileEmail);
         * model.put("idNumber", valueOrDefault(user.getIdNumber()));
         * model.put("birthday", formatDate(user.getBirthday()));
         * model.put("phoneNum", valueOrDefault(user.getPhoneNum()));
         * model.put("gender", formatGender(user.getGender()));
         * model.put("address", valueOrDefault(user.getAddress()));
         * model.put("profileTheme", "dark_mode.ftl".equals(selectedTheme) ? "dark_mode.ftl" : DEFAULT_THEME);
         * model.put("memberQrUrl", new org.example.util.QRCodeHelper().renderQrCode(profileEmail));
         */
        model.put("name", valueOrDefault(user.getName()));
        model.put("email", valueOrDefault(user.getEmail()));
        model.put("idNumber", valueOrDefault(user.getIdNumber()));
        model.put("birthday", formatDate(user.getBirthday()));
        model.put("phoneNum", valueOrDefault(user.getPhoneNum()));
        model.put("gender", formatGender(user.getGender()));
        model.put("address", valueOrDefault(user.getAddress()));
        model.put("profileTheme", new ProfileTheme(resolveThemeName(user)));
        return model;
    }

    private String resolveThemeName(User user) {
        if (user == null || !StringUtils.hasText(user.getProfileTheme())) {
            return DEFAULT_THEME;
        }
        return user.getProfileTheme().trim();
    }

    private String valueOrDefault(String value) {
        return StringUtils.hasText(value) ? value : EMPTY_VALUE;
    }

    private String formatDate(Date date) {
        if (date == null) {
            return EMPTY_VALUE;
        }

        return date.toLocalDate().format(PROFILE_DATE_FORMAT);
    }

    private String formatGender(String gender) {
        if (!StringUtils.hasText(gender)) {
            return EMPTY_VALUE;
        }

        switch (gender.trim().toUpperCase()) {
            case "MALE":
                return "Nam";
            case "FEMALE":
                return "Nữ";
            case "OTHER":
                return "Khác";
            default:
                return gender;
        }
    }
}
