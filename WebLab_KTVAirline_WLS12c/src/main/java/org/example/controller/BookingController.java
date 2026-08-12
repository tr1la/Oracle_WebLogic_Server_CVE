package org.example.controller;

import org.example.payload.BookingRequest;
import org.example.security.UserDetailsImpl;
import org.example.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1/booking")
public class BookingController {
    private static final Pattern SAFE_BUSINESS_PROMOTION_CODE = Pattern.compile("^[A-Z0-9_-]{1,32}$");

    @Autowired
    BookingService bookingService;

    @PostMapping("/quote")
    public ResponseEntity<?> quote(@RequestBody BookingRequest request, Authentication authentication) {
        try {
            rejectUnsafeBusinessPromotionCode(request);
            return ResponseEntity.ok().body(bookingService.quote(request, getAuthenticatedUserId(authentication)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }

    @PostMapping("/hold")
    public ResponseEntity<?> hold(@RequestBody BookingRequest request, Authentication authentication) {
        try {
            Integer userId = getAuthenticatedUserId(authentication);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            rejectUnsafeBusinessPromotionCode(request);
            return ResponseEntity.ok().body(bookingService.hold(request, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }

    @PostMapping("/apply-promotion")
    public ResponseEntity<?> applyPromotion(@RequestBody BookingRequest request, Authentication authentication) {
        try {
            Integer userId = getAuthenticatedUserId(authentication);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            return ResponseEntity.ok().body(bookingService.applyPromotion(request, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }

    @PostMapping(value = "/draft/save", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<?> saveDraft(@RequestBody BookingRequest request, Authentication authentication) {
        try {
            Integer userId = getAuthenticatedUserId(authentication);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            byte[] draftBytes = bookingService.saveDraft(request);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"booking-draft.ser\"")
                    .body(draftBytes);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }
    /*
     * FIXED CODE:
     *
     * Replace the octet-stream .ser save endpoint above with this JSON DTO endpoint.
     *
     * @PostMapping(value = "/draft/save", consumes = MediaType.APPLICATION_JSON_VALUE,
     *         produces = MediaType.APPLICATION_JSON_VALUE)
     * public ResponseEntity<?> saveDraft(@Valid @RequestBody BookingRequest request,
     *         Authentication authentication) {
     *     try {
     *         Integer userId = getAuthenticatedUserId(authentication);
     *         if (userId == null) {
     *             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
     *         }
     *
     *         rejectUnsafeBusinessPromotionCode(request);
     *         BookingRequest draft = bookingService.saveDraft(request);
     *         return ResponseEntity.ok()
     *                 .contentType(MediaType.APPLICATION_JSON)
     *                 .header(HttpHeaders.CONTENT_DISPOSITION,
     *                         "attachment; filename=\"booking-draft.json\"")
     *                 .body(draft);
     *     } catch (IllegalArgumentException e) {
     *         return ResponseEntity.badRequest().body(e.getMessage());
     *     } catch (Exception e) {
     *         return ResponseEntity.internalServerError().body("Server Error");
     *     }
     * }
     */

    @PostMapping(value = "/draft/import", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<?> importDraft(@RequestBody byte[] draftBytes, Authentication authentication) {
        try {
            Integer userId = getAuthenticatedUserId(authentication);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            return ResponseEntity.ok().body(bookingService.importDraft(draftBytes, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Bản nháp không còn khả dụng: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }
    /*
     * FIXED CODE:
     *
     * Replace the octet-stream import endpoint above with this JSON DTO endpoint.
     *
     * @PostMapping(value = "/draft/import", consumes = MediaType.APPLICATION_JSON_VALUE)
     * public ResponseEntity<?> importDraft(@Valid @RequestBody BookingRequest draft,
     *         Authentication authentication) {
     *     try {
     *         Integer userId = getAuthenticatedUserId(authentication);
     *         if (userId == null) {
     *             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
     *         }
     *
     *         rejectUnsafeBusinessPromotionCode(draft);
     *         return ResponseEntity.ok().body(bookingService.importDraft(draft, userId));
     *     } catch (IllegalArgumentException e) {
     *         return ResponseEntity.badRequest().body(e.getMessage());
     *     } catch (IllegalStateException e) {
     *         return ResponseEntity.status(HttpStatus.CONFLICT)
     *                 .body("Bản nháp không còn khả dụng: " + e.getMessage());
     *     } catch (Exception e) {
     *         return ResponseEntity.internalServerError().body("Server Error");
     *     }
     * }
     */

    @PostMapping("/confirm")
    public ResponseEntity<?> confirm(@RequestBody BookingRequest request, Authentication authentication) {
        try {
            Integer userId = getAuthenticatedUserId(authentication);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
            }

            rejectUnsafeBusinessPromotionCode(request);
            return ResponseEntity.ok().body(bookingService.confirm(request, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Server Error");
        }
    }

    private Integer getAuthenticatedUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            return userDetails.getId();
        }
        return null;
    }

    private void rejectUnsafeBusinessPromotionCode(BookingRequest request) {
        if (request == null || request.getPromotionCode() == null || request.getPromotionCode().trim().isEmpty()) {
            return;
        }

        String promotionCode = request.getPromotionCode().trim();
        if (!SAFE_BUSINESS_PROMOTION_CODE.matcher(promotionCode).matches()) {
            throw new IllegalArgumentException("Invalid promotion code");
        }
        request.setPromotionCode(promotionCode);
    }
}
