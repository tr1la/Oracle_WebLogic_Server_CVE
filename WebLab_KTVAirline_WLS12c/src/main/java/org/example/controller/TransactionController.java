package org.example.controller;

import org.example.constant.TransactionStatusEnum;
import org.example.constant.SeatType;
import org.example.entity.Transaction;
import org.example.security.UserDetailsImpl;
import org.example.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/transaction")
public class TransactionController {
    @Autowired
    TransactionService transactionService;

    @GetMapping(value = "/conditions")
    public ResponseEntity<?> getByConditions(@RequestParam String flightName
            , @RequestParam Date dateFrom, @RequestParam Date dateTo, @RequestParam TransactionStatusEnum status
            , @RequestParam Integer pageNum, @RequestParam Integer pageSize, Authentication authentication) {
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);
            List<Transaction> transactionList = transactionService
                    .findByConditions(flightName, dateFrom, dateTo, status, pageable);
            if (!isAdmin(authentication)) {
                Integer userId = getAuthenticatedUserId(authentication);
                transactionList = transactionList.stream()
                        .filter(transaction -> isOwnedByUser(transaction, userId))
                        .collect(java.util.stream.Collectors.toList());
            }
            if (ObjectUtils.isEmpty(transactionList)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(transactionList);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @GetMapping(value = "/all")
    public ResponseEntity<?> getAll(@RequestParam Integer pageNum
            , @RequestParam Integer pageSize) {
        try {
            Pageable pageable = PageRequest.of(pageNum, pageSize);
            List<Transaction> transactionList = transactionService
                    .findAll(pageable);
            if (ObjectUtils.isEmpty(transactionList)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(transactionList);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @GetMapping(value = "/id")
    public ResponseEntity<?> getById(@RequestParam Integer id, Authentication authentication) {
        try {
            Transaction transaction = transactionService.findById(id);
            if (ObjectUtils.isEmpty(transaction)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else if (!canAccessTransaction(authentication, transaction)) {
                return ResponseEntity.status(403).body("Forbidden");
            } else {
                return ResponseEntity.ok().body(transaction);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @PostMapping
    public ResponseEntity<?> saveTransaction(@RequestBody Transaction transaction) {
        try {
            transaction.setId(null);
            Transaction savedTransaction = transactionService.save(transaction);
            if (ObjectUtils.isEmpty(transaction)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(savedTransaction);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @PutMapping
    public ResponseEntity<?> editTransaction(@RequestBody Transaction transaction, Authentication authentication) {
        try {
            if (!canSaveTransaction(authentication, transaction)) {
                return ResponseEntity.status(403).body("Forbidden");
            }
            Transaction savedTransaction = transactionService.save(transaction);
            if (ObjectUtils.isEmpty(transaction)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(savedTransaction);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @PutMapping(value = "/list")
    public ResponseEntity<?> editTransactions(@RequestBody List<Transaction> transactions, Authentication authentication) {
        try {
            for (Transaction transaction : transactions) {
                if (!canSaveTransaction(authentication, transaction)) {
                    return ResponseEntity.status(403).body("Forbidden");
                }
            }
            for(Transaction transaction : transactions){
                Transaction savedTransaction = transactionService.save(transaction);
            }
            return ResponseEntity.ok().body("Edited");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deleteTransaction(@RequestParam Integer id) {
        try {
            if (ObjectUtils.isEmpty(transactionService.findById(id))) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                transactionService.delete(id);
                return ResponseEntity.ok().body("Deleted");
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @GetMapping(value = "/status")
    public ResponseEntity<?> getByStatus(@RequestParam TransactionStatusEnum statusEnum) {
        try {
            List<Transaction> transaction = transactionService.findByStatus(statusEnum);
            if (ObjectUtils.isEmpty(transaction)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {
                return ResponseEntity.ok().body(transaction);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @GetMapping(value = "/flight")
    public ResponseEntity<?> sendDelayNoti(@RequestParam Integer flightId, Authentication authentication) {
        try {
            List<Transaction> transactions = transactionService.findByFlightId(flightId).stream()
                    .map(this::releaseExpiredHoldIfNeeded)
                    .collect(java.util.stream.Collectors.toList());
            if (!isAdmin(authentication)) {
                Integer userId = getAuthenticatedUserId(authentication);
                transactions = transactions.stream()
                        .filter(transaction -> isBookableTransaction(transaction)
                                || isOwnedActiveHold(transaction, userId))
                        .collect(java.util.stream.Collectors.toList());
            }
            if (ObjectUtils.isEmpty(transactions)) {
                return ResponseEntity.badRequest()
                        .body("Not found");
            } else {               
                return ResponseEntity.ok().body(transactions);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    @GetMapping(value = "/flight/availability")
    public ResponseEntity<?> getFlightAvailability(@RequestParam Integer flightId, Authentication authentication) {
        try {
            Integer userId = getAuthenticatedUserId(authentication);
            List<Transaction> transactions = transactionService.findByFlightId(flightId).stream()
                    .map(this::releaseExpiredHoldIfNeeded)
                    .collect(java.util.stream.Collectors.toList());
            Map<String, Map<String, Object>> availability = new HashMap<>();

            for (SeatType seatType : SeatType.values()) {
                Map<String, Object> seatInfo = new HashMap<>();
                seatInfo.put("availableSeats", 0);
                seatInfo.put("price", "0");
                availability.put(seatType.name(), seatInfo);
            }

            for (Transaction transaction : transactions) {
                if (transaction.getSeat() == null || transaction.getSeat().getType() == null) {
                    continue;
                }

                String seatType = transaction.getSeat().getType().name();
                Map<String, Object> seatInfo = availability.get(seatType);
                if (seatInfo == null
                        || (!isBookableTransaction(transaction) && !isOwnedActiveHold(transaction, userId))) {
                    continue;
                }

                int availableSeats = (int) seatInfo.get("availableSeats");
                seatInfo.put("availableSeats", availableSeats + 1);
                if ("0".equals(seatInfo.get("price")) && transaction.getPrice() != null) {
                    seatInfo.put("price", transaction.getPrice());
                }
            }

            return ResponseEntity.ok().body(availability);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Server Error");
        }
    }

    private boolean canAccessTransaction(Authentication authentication, Transaction transaction) {
        return isAdmin(authentication) || isOwnedByUser(transaction, getAuthenticatedUserId(authentication));
    }

    private boolean canSaveTransaction(Authentication authentication, Transaction submittedTransaction) {
        if (isAdmin(authentication)) {
            return true;
        }
        if (submittedTransaction == null || submittedTransaction.getId() == null) {
            return false;
        }

        Transaction existingTransaction = releaseExpiredHoldIfNeeded(transactionService.findById(submittedTransaction.getId()));
        if (ObjectUtils.isEmpty(existingTransaction)) {
            return false;
        }

        Integer userId = getAuthenticatedUserId(authentication);
        boolean submittedOwnedByUser = isOwnedByUser(submittedTransaction, userId);
        if (submittedTransaction.getUser() != null && !submittedOwnedByUser) {
            return false;
        }

        if (isOwnedByUser(existingTransaction, userId)) {
            return true;
        }

        return isBookableTransaction(existingTransaction)
                && submittedOwnedByUser;
    }

    private boolean isBookableTransaction(Transaction transaction) {
        return transaction != null
                && (transaction.getStatus() == TransactionStatusEnum.FREE
                || transaction.getStatus() == TransactionStatusEnum.CANCEL);
    }

    private boolean isOwnedActiveHold(Transaction transaction, Integer userId) {
        return transaction != null
                && userId != null
                && transaction.getStatus() == TransactionStatusEnum.HOLD
                && !isExpiredHold(transaction)
                && isOwnedByUser(transaction, userId);
    }

    private Transaction releaseExpiredHoldIfNeeded(Transaction transaction) {
        if (!isExpiredHold(transaction)) {
            return transaction;
        }

        transaction.setStatus(TransactionStatusEnum.FREE);
        transaction.setUser(null);
        transaction.setHoldExpiresAt(null);
        transaction.setQrCode(null);
        return transactionService.save(transaction);
    }

    private boolean isExpiredHold(Transaction transaction) {
        return transaction != null
                && transaction.getStatus() == TransactionStatusEnum.HOLD
                && (transaction.getHoldExpiresAt() == null
                        || !transaction.getHoldExpiresAt().after(new java.util.Date()));
    }

    private boolean isOwnedByUser(Transaction transaction, Integer userId) {
        return transaction != null
                && transaction.getUser() != null
                && transaction.getUser().getId() != null
                && transaction.getUser().getId().equals(userId);
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
