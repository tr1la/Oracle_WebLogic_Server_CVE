package org.example.security;

import org.example.repository.BookingOrderRepository;
import org.example.repository.TransactionRepository;
import org.example.repository.UserRepository;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.function.Supplier;

@Component
public class UploadOwnerAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {
    private static final String UPLOAD_PREFIX = "/uploads/";
    private static final String QR_UPLOAD_PREFIX = "/uploads/qrcodes/";
    private static final String QR_UPLOAD_SUFFIX = ".svg";

    private final UserRepository userRepository;
    private final BookingOrderRepository bookingOrderRepository;
    private final TransactionRepository transactionRepository;

    public UploadOwnerAuthorizationManager(UserRepository userRepository,
                                           BookingOrderRepository bookingOrderRepository,
                                           TransactionRepository transactionRepository) {
        this.userRepository = userRepository;
        this.bookingOrderRepository = bookingOrderRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public AuthorizationDecision check(Supplier<Authentication> authentication,
                                       RequestAuthorizationContext context) {
        Authentication currentAuthentication = authentication.get();
        boolean allowed = currentAuthentication != null
                && currentAuthentication.isAuthenticated()
                && isUploadOwner(currentAuthentication, context);
        return new AuthorizationDecision(allowed);
    }

    private boolean isUploadOwner(Authentication authentication, RequestAuthorizationContext context) {
        if (isAdmin(authentication)) {
            return true;
        }
        if (!(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            return false;
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        if (userDetails.getId() == null) {
            return false;
        }

        String uploadUrl = normalizeUploadUrl(context);
        if (uploadUrl == null) {
            return false;
        }

        Integer userId = userDetails.getId();
        return userRepository.existsByIdAndAvatarUrlAndIsDeletedFalse(userId, uploadUrl)
                || bookingOrderRepository.existsByUserIdAndQrCodeAndIsDeletedFalse(userId, uploadUrl)
                || transactionRepository.existsByUserIdAndQrCodeAndIsDeletedFalse(userId, uploadUrl)
                || isCurrentUserProfileQr(userDetails, uploadUrl);
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    private String normalizeUploadUrl(RequestAuthorizationContext context) {
        try {
            String requestUri = context.getRequest().getRequestURI();
            String contextPath = context.getRequest().getContextPath();
            if (contextPath != null && !contextPath.trim().isEmpty() && requestUri.startsWith(contextPath)) {
                requestUri = requestUri.substring(contextPath.length());
            }

            String decodedPath = UriUtils.decode(requestUri, StandardCharsets.UTF_8).replace('\\', '/');
            if (!decodedPath.startsWith(UPLOAD_PREFIX)) {
                return null;
            }

            String relativeUploadPath = decodedPath.substring(UPLOAD_PREFIX.length());
            Path normalizedRelativePath = Paths.get(relativeUploadPath).normalize();
            if (normalizedRelativePath.isAbsolute() || startsWithParentTraversal(normalizedRelativePath)) {
                return null;
            }

            String normalizedUrl = UPLOAD_PREFIX + normalizedRelativePath.toString().replace('\\', '/');
            return normalizedUrl.equals(decodedPath) ? normalizedUrl : null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private boolean startsWithParentTraversal(Path path) {
        return path.getNameCount() > 0 && "..".equals(path.getName(0).toString());
    }

    private boolean isCurrentUserProfileQr(UserDetailsImpl userDetails, String uploadUrl) {
        if (userDetails.getEmail() == null || userDetails.getEmail().trim().isEmpty()) {
            return false;
        }
        String expectedProfileQrUrl = QR_UPLOAD_PREFIX
                + "QR-"
                + Integer.toHexString(userDetails.getEmail().hashCode())
                + QR_UPLOAD_SUFFIX;
        return expectedProfileQrUrl.equals(uploadUrl);
    }
}
