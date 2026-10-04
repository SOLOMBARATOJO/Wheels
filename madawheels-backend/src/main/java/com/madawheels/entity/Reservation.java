package com.madawheels.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Column(nullable = false, length = 100)
    private String departure;

    @Column(name = "return_location", nullable = false, length = 100)
    private String returnLocation;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "driver_age", nullable = false)
    private Integer driverAge;

    @Column(nullable = false, length = 30)
    private String status = "PENDING";

    @Column(name = "reference", unique = true, length = 40)
    private String reference;

    @Column(name = "vehicle_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal vehiclePrice = BigDecimal.ZERO;

    @Column(name = "options_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal optionsPrice = BigDecimal.ZERO;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "card_holder", length = 150)
    private String cardHolder;

    @Column(name = "card_last4", length = 4)
    private String cardLast4;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    // @Column(name = "refusal_reason", columnDefinition = "TEXT")
    // private String refusalReason;

        @Column(name = "refusal_reason", columnDefinition = "TEXT")
    private String refusalReason;

    @Column(name = "deleted_by_client", nullable = false)
    private Boolean deletedByClient = false;


    public Reservation() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public String getDeparture() { return departure; }
    public void setDeparture(String departure) { this.departure = departure; }

    public String getReturnLocation() { return returnLocation; }
    public void setReturnLocation(String returnLocation) { this.returnLocation = returnLocation; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public Integer getDriverAge() { return driverAge; }
    public void setDriverAge(Integer driverAge) { this.driverAge = driverAge; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public BigDecimal getVehiclePrice() { return vehiclePrice; }
    public void setVehiclePrice(BigDecimal vehiclePrice) { this.vehiclePrice = vehiclePrice; }

    public BigDecimal getOptionsPrice() { return optionsPrice; }
    public void setOptionsPrice(BigDecimal optionsPrice) { this.optionsPrice = optionsPrice; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }


    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getCardHolder() { return cardHolder; }
    public void setCardHolder(String cardHolder) { this.cardHolder = cardHolder; }

    public String getCardLast4() { return cardLast4; }
    public void setCardLast4(String cardLast4) { this.cardLast4 = cardLast4; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    public String getAdminNote() { return adminNote; }
    public void setAdminNote(String adminNote) { this.adminNote = adminNote; }

    // public String getRefusalReason() { return refusalReason; }
    // public void setRefusalReason(String refusalReason) { this.refusalReason = refusalReason; }

        public String getRefusalReason() { return refusalReason; }
    public void setRefusalReason(String refusalReason) { this.refusalReason = refusalReason; }

    public Boolean getDeletedByClient() { return deletedByClient; }
    public void setDeletedByClient(Boolean deletedByClient) { this.deletedByClient = deletedByClient; }
}