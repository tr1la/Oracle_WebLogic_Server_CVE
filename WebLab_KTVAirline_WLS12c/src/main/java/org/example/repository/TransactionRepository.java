package org.example.repository;

import javax.persistence.LockModeType;
import org.example.constant.TransactionStatusEnum;
import org.example.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.sql.Date;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Integer>, TransactionSearchRepository {
    public List<Transaction> findByFlightNameContainsAndUpdateDateBetweenAndStatusAndIsDeletedFalse(String flightName, Date dateFrom, Date dateTo,
                                                                                                    TransactionStatusEnum status, Pageable pageable);

    public List<Transaction> findByStatusAndIsDeletedFalse(TransactionStatusEnum status);

    public Page<Transaction> findByIsDeletedFalse(Pageable pageable);

    public List<Transaction> findByFlightIdAndIsDeletedFalse(Integer id);

    public Transaction findByIdAndIsDeletedFalse(Integer id);

    public boolean existsByUserIdAndQrCodeAndIsDeletedFalse(Integer userId, String qrCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Transaction t where t.id = :id and t.isDeleted = false")
    public Transaction findByIdAndIsDeletedFalseForUpdate(@Param("id") Integer id);
}
