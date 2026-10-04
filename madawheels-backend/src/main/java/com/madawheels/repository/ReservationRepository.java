package com.madawheels.repository;

import com.madawheels.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Historique visible côté client (exclut les réservations masquées par le client). */
    List<Reservation> findByUserIdAndDeletedByClientFalseOrderByCreatedAtDesc(Long userId);

    Optional<Reservation> findByReference(String reference);

    List<Reservation> findAllByOrderByCreatedAtDesc();

    List<Reservation> findByStatusOrderByCreatedAtDesc(String status);

    List<Reservation> findByVehicleIdAndStatusIn(Long vehicleId, List<String> statuses);

    /** Utilisé par le tableau de bord admin pour les compteurs par statut. */
    long countByStatus(String status);
}