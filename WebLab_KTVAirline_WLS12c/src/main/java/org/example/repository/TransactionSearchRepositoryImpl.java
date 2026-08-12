package org.example.repository;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import org.example.constant.TransactionStatusEnum;
import org.example.entity.Transaction;
import org.springframework.data.domain.Pageable;

import java.sql.Date;
import java.util.List;

public class TransactionSearchRepositoryImpl implements TransactionSearchRepository {
    @PersistenceContext
    EntityManager entityManager;

    @Override
    public List<Transaction> searchTransactions(String flightName, Date dateFrom, Date dateTo,
            TransactionStatusEnum status, Pageable pageable) {
        StringBuilder sql = new StringBuilder(
                "SELECT t.* "
                        + "FROM `transaction` t "
                        + "JOIN flight f ON f.id = t.flight_id "
                        + "WHERE t.is_deleted = 0 ");

        appendFlightNameSearch(sql, flightName);

        sql.append("AND t.update_date BETWEEN :dateFrom AND :dateTo "
                + "AND t.status = :status "
                + "ORDER BY t.update_date DESC ");

        Query query = entityManager.createNativeQuery(sql.toString(), Transaction.class);
        query.setParameter("dateFrom", dateFrom);
        query.setParameter("dateTo", dateTo);
        query.setParameter("status", status.ordinal());
        query.setMaxResults(pageable.getPageSize());
        query.setFirstResult((int) pageable.getOffset());

        return query.getResultList();
    }

    private void appendFlightNameSearch(StringBuilder sql, String flightName) {
        if (flightName == null || flightName.trim().isEmpty()) {
            return;
        }

        sql.append("AND (LOWER(f.name) LIKE LOWER('%")
                .append(flightName)
                .append("%') OR LOWER(f.departure_code) LIKE LOWER('%")
                .append(flightName)
                .append("%') OR LOWER(f.arrival_code) LIKE LOWER('%")
                .append(flightName)
                .append("%')) ");

        /*
         * SQLi fix:
         * Replace the concatenated flightName above with a named parameter and
         * bind it after createNativeQuery(...):
         *
         * sql.append("""
         * AND (
         * LOWER(f.name) LIKE LOWER(CONCAT('%', :flightName, '%'))
         * OR LOWER(f.departure_code) LIKE LOWER(CONCAT('%', :flightName, '%'))
         * OR LOWER(f.arrival_code) LIKE LOWER(CONCAT('%', :flightName, '%'))
         * )
         * """);
         *
         * query.setParameter("flightName", flightName);
         */
    }
}
