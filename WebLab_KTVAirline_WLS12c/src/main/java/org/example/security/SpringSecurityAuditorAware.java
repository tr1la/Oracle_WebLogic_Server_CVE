package org.example.security;

import org.example.entity.User;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.ObjectUtils;

import java.util.Optional;

public class SpringSecurityAuditorAware implements AuditorAware<String> {

    public Optional<String> getCurrentAuditor() {
        UserDetails auditor = null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserDetails) {
                auditor = (UserDetails) principal;
            }
        }
        return !ObjectUtils.isEmpty(auditor) ? Optional.ofNullable(auditor.getUsername()) : Optional.ofNullable(null);
    }
}
