package com.madawheels.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ReservationOptionKey implements Serializable {

    @Column(name = "reservation_id")
    private Long reservationId;

    @Column(name = "option_id")
    private Long optionId;

    public ReservationOptionKey() {
    }

    public ReservationOptionKey(Long reservationId, Long optionId) {
        this.reservationId = reservationId;
        this.optionId = optionId;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public Long getOptionId() {
        return optionId;
    }

    public void setOptionId(Long optionId) {
        this.optionId = optionId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ReservationOptionKey that)) {
            return false;
        }
        return Objects.equals(reservationId, that.reservationId)
                && Objects.equals(optionId, that.optionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(reservationId, optionId);
    }
}