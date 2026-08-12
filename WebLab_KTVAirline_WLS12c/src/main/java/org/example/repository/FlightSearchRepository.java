package org.example.repository;

import org.example.entity.Flight;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface FlightSearchRepository {
    List<Flight> searchFlights(String keyword, LocalDateTime dateFrom, LocalDateTime dateTo,
                               String departure, String arrival, Pageable pageable);
}
