package com.madawheels.repository;

import com.madawheels.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    /**
     * Catalogue client : tous les véhicules disponibles, quelle que soit l'agence
     * de départ. Chaque filtre est optionnel : la condition est neutre quand la
     * valeur est null.
     */
    @Query("select v from Vehicle v " +
            "where v.available = true " +
            "and (:type is null or v.type = :type) " +
            "and (:transmission is null or v.transmission = :transmission) " +
            "and (:fuel is null or v.fuel = :fuel) " +
            "and (:maxPrice is null or v.pricePerDay <= :maxPrice) " +
            "order by v.pricePerDay asc")
    List<Vehicle> searchVehicles(@Param("type") String type,
                                 @Param("transmission") String transmission,
                                 @Param("fuel") String fuel,
                                 @Param("maxPrice") BigDecimal maxPrice);

    /**
     * Recherche admin (tous les véhicules, disponibles ou non).
     * Les paramètres ne sont JAMAIS null ici : PostgreSQL type un paramètre null
     * comme bytea, ce qui fait échouer lower(...) ("function lower(bytea) does not exist").
     * Une chaîne vide donne le motif '%%' qui correspond à tout.
     */
    @Query("select v from Vehicle v where " +
            "(lower(v.name) like lower(concat('%', :keyword, '%')) " +
            "  or lower(v.brand) like lower(concat('%', :keyword, '%')) " +
            "  or lower(v.model) like lower(concat('%', :keyword, '%'))) " +
            "and lower(v.departure) like lower(concat('%', :departure, '%')) " +
            "order by v.id asc")
    List<Vehicle> adminSearchQuery(@Param("keyword") String keyword, @Param("departure") String departure);

    /** Point d'entrée conservé : AdminService n'a pas besoin de changer. */
    default List<Vehicle> adminSearch(String keyword, String departure) {
        return adminSearchQuery(keyword == null ? "" : keyword.trim(),
                departure == null ? "" : departure.trim());
    }

    /** Utilisé par le tableau de bord admin. */
    long countByAvailableTrue();
}