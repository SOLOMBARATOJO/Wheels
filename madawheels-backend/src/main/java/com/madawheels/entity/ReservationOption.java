package com.madawheels.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "reservation_options")
public class ReservationOption {

    @EmbeddedId
    private ReservationOptionKey id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("reservationId")
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("optionId")
    @JoinColumn(name = "option_id")
    private CarOption option;

    @Column(nullable = false)
    private Integer quantity = 1;

    public ReservationOption() {
    }

    public ReservationOption(Reservation reservation, CarOption option, Integer quantity) {
        this.reservation = reservation;
        this.option = option;
        this.quantity = quantity;
        this.id = new ReservationOptionKey(reservation.getId(), option.getId());
    }

    public ReservationOptionKey getId() {
        return id;
    }

    public void setId(ReservationOptionKey id) {
        this.id = id;
    }

    public Reservation getReservation() {
        return reservation;
    }

    public void setReservation(Reservation reservation) {
        this.reservation = reservation;
    }

    public CarOption getOption() {
        return option;
    }

    public void setOption(CarOption option) {
        this.option = option;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}