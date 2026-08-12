package org.example.serviceImpl;

import org.example.constant.TransactionStatusEnum;
import org.example.entity.Transaction;
import org.example.repository.TransactionRepository;
import org.example.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.util.List;

@Service
public class TransactionServiceImpl implements TransactionService {
    @Autowired
    TransactionRepository transactionRepository;

    @Override
    public List<Transaction> findByConditions(String flightName, Date dateFrom, Date dateTo, TransactionStatusEnum status,
                                              Pageable pageable) {
        return transactionRepository.searchTransactions(flightName, dateFrom, dateTo, status, pageable);
    }

    @Override
    public Transaction findById(Integer id) {
        return transactionRepository.findByIdAndIsDeletedFalse(id);
    }

    @Override
    public List<Transaction> findAll(Pageable pageable) {
        return transactionRepository.findByIsDeletedFalse(pageable).getContent();
    }

    @Override
    public Transaction save(Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    @Override
    public void delete(Integer id) {
        Transaction transaction = transactionRepository.findByIdAndIsDeletedFalse(id);
        transaction.setDeleted(true);
        transactionRepository.save(transaction);
    }

    @Override
    public List<Transaction> findByFlightId(Integer id) {
        return transactionRepository.findByFlightIdAndIsDeletedFalse(id);
    }

    @Override
    public List<Transaction> findByStatus(TransactionStatusEnum status) {
        return transactionRepository.findByStatusAndIsDeletedFalse(status);
    }
}
