package com.madawheels.service;

import com.madawheels.entity.Vehicle;
import com.madawheels.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    public List<Vehicle> searchVehicles(
            String departure,
            String returnLocation,
            String startDate,
            String startTime,
            String endDate,
            String endTime,
            Integer driverAge,
            String type,
            String transmission,
            String fuel,
            BigDecimal maxPrice) {

        // Vérification de l'âge minimum défini par l'interface.
        if (driverAge == null || driverAge < 23) {
            throw new IllegalArgumentException(
                    "Le conducteur doit avoir au minimum 23 ans."
            );
        }

        // Valeurs vides envoyées par le client = « pas de filtre ».
        String t = isBlank(type) ? null : type;
        String tr = isBlank(transmission) ? null : transmission;
        String f = isBlank(fuel) ? null : fuel;

        return vehicleRepository.searchVehicles(departure, t, tr, f, maxPrice);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}