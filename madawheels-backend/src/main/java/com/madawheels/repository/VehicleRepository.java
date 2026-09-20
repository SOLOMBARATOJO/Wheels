package com.madawheels.repository;

import com.madawheels.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByDepartureAndDestinationAndAvailableTrue(String departure, String destination);
}