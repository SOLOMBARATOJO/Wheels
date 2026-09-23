package com.madawheels.repository;

import com.madawheels.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    // Correspondance partielle et insensible à la casse : "antananarivo"
    // trouve aussi bien "Antananarivo Ivato" que "Antananarivo Centre".
    List<Vehicle> findByDepartureContainingIgnoreCaseAndAvailableTrue(String departure);

    List<Vehicle> findByAvailableTrue();

    // Recherche avec filtres de flotte (type / boîte / carburant / budget max).
    // Chaque filtre est optionnel : la condition devient neutre quand la valeur
    // est null, ce qui évite d'avoir à générer des requêtes dynamiques.
    @Query("select v from Vehicle v " +
            "where v.available = true " +
            "and (:departure is null or lower(v.departure) like lower(concat('%', :departure, '%'))) " +
            "and (:type is null or v.type = :type) " +
            "and (:transmission is null or v.transmission = :transmission) " +
            "and (:fuel is null or v.fuel = :fuel) " +
            "and (:maxPrice is null or v.pricePerDay <= :maxPrice)")
    List<Vehicle> searchVehicles(@Param("departure") String departure,
                                 @Param("type") String type,
                                 @Param("transmission") String transmission,
                                 @Param("fuel") String fuel,
                                 @Param("maxPrice") BigDecimal maxPrice);
}