package org.example.entity;

import javax.persistence.*;
import lombok.*;
import org.example.constant.FlightStatus;
import org.example.constant.SeatStatus;

import java.time.LocalDateTime;

@Table(name = "FLIGHT")
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class Flight extends BaseObject{
    @Column(name = "NAME", nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name="PLANE_ID", nullable=false)
    private Plane plane;

    @Column(name = "START_TIME", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "END_TIME", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "STATUS", nullable = false)
    private FlightStatus status;

    @Column(name = "DEPARTURE", nullable = false)
    private String departure;

    @Column(name = "DEPARTURE_CODE", nullable = false)
    private String departureCode;

    @Column(name = "ARRIVAL", nullable = false)
    private String arrival;

    @Column(name = "ARRIVAL_CODE", nullable = false)
    private String arrivalCode;

    @Column(name = "GATE", nullable = false)
    private String gate;
}
