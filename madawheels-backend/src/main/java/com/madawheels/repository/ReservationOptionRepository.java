package com.madawheels.repository;

import com.madawheels.entity.ReservationOption;
import com.madawheels.entity.ReservationOptionKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReservationOptionRepository extends JpaRepository<ReservationOption, ReservationOptionKey> {

    @Query("select ro from ReservationOption ro join fetch ro.option where ro.id.reservationId = :reservationId")
    List<ReservationOption> findByReservationId(@Param("reservationId") Long reservationId);
}