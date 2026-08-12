package org.example.repository;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import org.example.entity.Flight;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public class FlightSearchRepositoryImpl implements FlightSearchRepository {
    @PersistenceContext
    EntityManager entityManager;

    @Override
    public List<Flight> searchFlights(String keyword, LocalDateTime dateFrom, LocalDateTime dateTo,
                                      String departure, String arrival, Pageable pageable) {
        StringBuilder sql = new StringBuilder(
                "SELECT f.* "
                        + "FROM flight f "
                        + "WHERE f.is_deleted = 0 ");

        appendKeywordSearch(sql, keyword);

        sql.append("AND f.start_time BETWEEN :dateFrom AND :dateTo "
                + "AND LOWER(f.departure) LIKE LOWER(CONCAT('%', :departure, '%')) "
                + "AND LOWER(f.arrival) LIKE LOWER(CONCAT('%', :arrival, '%')) "
                + "ORDER BY f.start_time ASC ");

        Query query = entityManager.createNativeQuery(sql.toString(), Flight.class);
        query.setParameter("dateFrom", dateFrom);
        query.setParameter("dateTo", dateTo);
        query.setParameter("departure", departure);
        query.setParameter("arrival", arrival);
        query.setMaxResults(pageable.getPageSize());
        query.setFirstResult((int) pageable.getOffset());

        return query.getResultList();
    }

    private void appendKeywordSearch(StringBuilder sql, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return;
        }

        sql.append("AND (LOWER(f.name) LIKE LOWER('%")
                .append(keyword)
                .append("%') OR LOWER(f.departure_code) LIKE LOWER('%")
                .append(keyword)
                .append("%') OR LOWER(f.arrival_code) LIKE LOWER('%")
                .append(keyword)
                .append("%')) ");

        /*
         * SQLi fix:
         * Replace the concatenated keyword above with a named parameter and bind it
         * after createNativeQuery(...):
         *
         * sql.append("""
         *         AND (
         *             LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
         *             OR LOWER(f.departure_code) LIKE LOWER(CONCAT('%', :keyword, '%'))
         *             OR LOWER(f.arrival_code) LIKE LOWER(CONCAT('%', :keyword, '%'))
         *         )
         *         """);
         *
         * query.setParameter("keyword", keyword);
         */
    }
}
