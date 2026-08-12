package org.example.repository;

import org.example.constant.TransactionStatusEnum;
import org.example.entity.Transaction;
import org.springframework.data.domain.Pageable;

import java.sql.Date;
import java.util.List;

public interface TransactionSearchRepository {
    List<Transaction> searchTransactions(String flightName, Date dateFrom, Date dateTo,
                                         TransactionStatusEnum status, Pageable pageable);
}
