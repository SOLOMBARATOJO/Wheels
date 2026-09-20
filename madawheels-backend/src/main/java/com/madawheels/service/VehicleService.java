package com.madawheels.service;

import com.madawheels.entity.Vehicle;
import com.madawheels.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;

    public List<Vehicle> searchVehicles(String departure, String destination, String date, String time) {
        // La date et l'heure ne filtrent pas encore les véhicules (pas de colonne
        // correspondante en base), mais elles transitent correctement dans le
        // contrat SOAP et sont disponibles ici si un filtrage par créneau est
        // ajouté plus tard.
        return vehicleRepository.findByDepartureAndDestinationAndAvailableTrue(departure, destination);
    }
}