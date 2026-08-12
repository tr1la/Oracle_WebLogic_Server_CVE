package org.example.service;

import org.example.constant.TransactionStatusEnum;
import org.example.entity.Transaction;
import org.springframework.data.domain.Pageable;

import java.sql.Date;
import java.util.List;

public interface TransactionService {
    public List<Transaction> findByConditions(String flightName, Date dateFrom, Date dateTo, TransactionStatusEnum status,
                                              Pageable pageable);

    public Transaction findById(Integer id);

    public List<Transaction> findAll(Pageable pageable);

    public Transaction save(Transaction transaction);

    public void delete(Integer id);

    public List<Transaction> findByFlightId(Integer id);

    public List<Transaction> findByStatus(TransactionStatusEnum status);
}
