package com.madawheels.service;

import com.madawheels.entity.Vehicle;
import com.madawheels.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    /**
     * Renvoie tous les véhicules disponibles (available = true), sans filtre
     * d'agence ni de dates : chaque véhicule représente une catégorie de la
     * flotte, pas un exemplaire unique. Seuls les filtres optionnels
     * (type, transmission, carburant, prix max) sont appliqués.
     */
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

        if (driverAge == null || driverAge < 23) {
            throw new IllegalArgumentException("Le conducteur doit avoir au minimum 23 ans.");
        }

        // Cohérence des dates uniquement si elles sont fournies.
        if (!isBlank(startDate) && !isBlank(endDate)) {
            try {
                if (LocalDate.parse(endDate).isBefore(LocalDate.parse(startDate))) {
                    throw new IllegalArgumentException(
                            "La date de retour doit être postérieure à la date de départ.");
                }
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("Dates invalides.");
            }
        }

        return vehicleRepository.searchVehicles(
                isBlank(type) ? null : type,
                isBlank(transmission) ? null : transmission,
                isBlank(fuel) ? null : fuel,
                maxPrice);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}