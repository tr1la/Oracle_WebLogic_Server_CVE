package org.example.security;

import org.example.constant.Role;
import org.example.repository.BookingOrderRepository;
import org.example.repository.TransactionRepository;
import org.example.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;

class UploadOwnerAuthorizationManagerTest {

    private Integer avatarOwnerId;
    private String avatarUrl;
    private Integer bookingQrOwnerId;
    private String bookingQrUrl;
    private Integer transactionQrOwnerId;
    private String transactionQrUrl;

    private final UserRepository userRepository = repositoryProxy(UserRepository.class, (method, args) -> {
        if ("existsByIdAndAvatarUrlAndIsDeletedFalse".equals(method.getName())) {
            return Objects.equals(args[0], avatarOwnerId) && Objects.equals(args[1], avatarUrl);
        }
        return defaultReturn(method);
    });
    private final BookingOrderRepository bookingOrderRepository =
            repositoryProxy(BookingOrderRepository.class, (method, args) -> {
                if ("existsByUserIdAndQrCodeAndIsDeletedFalse".equals(method.getName())) {
                    return Objects.equals(args[0], bookingQrOwnerId) && Objects.equals(args[1], bookingQrUrl);
                }
                return defaultReturn(method);
            });
    private final TransactionRepository transactionRepository =
            repositoryProxy(TransactionRepository.class, (method, args) -> {
                if ("existsByUserIdAndQrCodeAndIsDeletedFalse".equals(method.getName())) {
                    return Objects.equals(args[0], transactionQrOwnerId) && Objects.equals(args[1], transactionQrUrl);
                }
                return defaultReturn(method);
            });
    private final UploadOwnerAuthorizationManager authorizationManager = new UploadOwnerAuthorizationManager(
            userRepository,
            bookingOrderRepository,
            transactionRepository);

    @Test
    void allowsUserToReadOwnAvatar() {
        avatarOwnerId = 7;
        avatarUrl = "/uploads/avatars/me.png";

        AuthorizationDecision decision = authorizationManager.check(
                () -> authentication(7, "user@example.com", Role.USER),
                context("/uploads/avatars/me.png"));

        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    void deniesUserReadingAnotherUsersUpload() {
        AuthorizationDecision decision = authorizationManager.check(
                () -> authentication(7, "user@example.com", Role.USER),
                context("/uploads/avatars/other.png"));

        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    void allowsAdminToReadAnyUpload() {
        AuthorizationDecision decision = authorizationManager.check(
                () -> authentication(1, "admin@example.com", Role.ADMIN),
                context("/uploads/avatars/other.png"));

        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    void allowsCurrentUsersProfileQr() {
        String email = "user@example.com";
        String expectedQrUrl = "/uploads/qrcodes/QR-" + Integer.toHexString(email.hashCode()) + ".svg";

        AuthorizationDecision decision = authorizationManager.check(
                () -> authentication(7, email, Role.USER),
                context(expectedQrUrl));

        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    void deniesTraversalUploadPath() {
        AuthorizationDecision decision = authorizationManager.check(
                () -> authentication(7, "user@example.com", Role.USER),
                context("/uploads/avatars/../qrcodes/QR-owned.svg"));

        assertThat(decision.isGranted()).isFalse();
    }

    private RequestAuthorizationContext context(String requestUri) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", requestUri);
        request.setRequestURI(requestUri);
        return new RequestAuthorizationContext(request);
    }

    private Authentication authentication(Integer id, String email, Role role) {
        UserDetailsImpl userDetails = UserDetailsImpl.builder()
                .id(id)
                .email(email)
                .password("password")
                .username(email)
                .role(role)
                .build();
        return new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities());
    }

    @SuppressWarnings("unchecked")
    private <T> T repositoryProxy(Class<T> repositoryType, RepositoryInvocation invocation) {
        return (T) Proxy.newProxyInstance(
                repositoryType.getClassLoader(),
                new Class<?>[] { repositoryType },
                (proxy, method, args) -> {
                    if ("toString".equals(method.getName())) {
                        return repositoryType.getSimpleName() + "Proxy";
                    }
                    if ("hashCode".equals(method.getName())) {
                        return System.identityHashCode(proxy);
                    }
                    if ("equals".equals(method.getName())) {
                        return proxy == args[0];
                    }
                    return invocation.invoke(method, args == null ? new Object[0] : args);
                });
    }

    private Object defaultReturn(Method method) {
        Class<?> returnType = method.getReturnType();
        if (returnType == boolean.class || returnType == Boolean.class) {
            return false;
        }
        if (returnType == int.class || returnType == Integer.class) {
            return 0;
        }
        if (returnType == long.class || returnType == Long.class) {
            return 0L;
        }
        return null;
    }

    @FunctionalInterface
    private interface RepositoryInvocation {
        Object invoke(Method method, Object[] args);
    }
}
