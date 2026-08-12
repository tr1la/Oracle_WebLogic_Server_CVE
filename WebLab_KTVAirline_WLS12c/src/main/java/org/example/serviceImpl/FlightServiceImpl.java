package org.example.serviceImpl;

import org.example.constant.FlightStatus;
import org.example.entity.Flight;
import org.example.repository.FlightRepository;
import org.example.service.FlightService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FlightServiceImpl implements FlightService {
    @Autowired
    FlightRepository flightRepository;

    @Override
    public List<Flight> findByConditions(String flightName, LocalDateTime dateFrom, LocalDateTime dateTo, String departure, String arrival, Pageable pageable) {
        return flightRepository.findByIsDeletedFalseAndNameContainsAndStartTimeBetweenAndDepartureContainsAndArrivalContains
                (flightName, dateFrom, dateTo, departure, arrival, pageable);
    }

    @Override
    public List<Flight> searchFlights(String searchTerm, LocalDateTime dateFrom, LocalDateTime dateTo, String departure, String arrival, Pageable pageable) {
        return flightRepository.searchFlights(searchTerm, dateFrom, dateTo, departure, arrival, pageable);
    }

    @Override
    public List<Flight> findAll(Pageable pageable) {
        return flightRepository.findByIsDeletedFalse(pageable);
    }

    @Override
    public Flight findById(Integer id) {
        return flightRepository.findByIdAndIsDeletedFalse(id);
    }

    @Override
    public Flight save(Flight flight) {
        return flightRepository.save(flight);
    }

    @Override
    public void delete(Integer id) {
        Flight flight = flightRepository.findByIdAndIsDeletedFalse(id);
        flight.setDeleted(true);
        flightRepository.save(flight);
    }

    @Override
    public List<Flight> findByStatus(FlightStatus statusEnum) {
        return flightRepository.findByStatusAndIsDeletedFalse(statusEnum);
    }
}
