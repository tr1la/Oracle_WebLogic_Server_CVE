package org.example.service;

import org.example.constant.FlightStatus;
import org.example.entity.Flight;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface FlightService {
    List<Flight> findByConditions(String flightName, LocalDateTime dateFrom, LocalDateTime dateTo, String departure, String arrival, Pageable pageable);

    List<Flight> searchFlights(String searchTerm, LocalDateTime dateFrom, LocalDateTime dateTo, String departure, String arrival, Pageable pageable);

    List<Flight> findAll(Pageable pageable);

    Flight findById(Integer id);

    Flight save(Flight flight);

    void delete(Integer id);

    List<Flight> findByStatus(FlightStatus statusEnum);
}
