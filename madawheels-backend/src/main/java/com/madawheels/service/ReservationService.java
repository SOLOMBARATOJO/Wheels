package com.madawheels.service;

import com.madawheels.entity.CarOption;
import com.madawheels.entity.Reservation;
import com.madawheels.entity.ReservationOption;
import com.madawheels.entity.User;
import com.madawheels.entity.Vehicle;
import com.madawheels.repository.OptionRepository;
import com.madawheels.repository.ReservationOptionRepository;
import com.madawheels.repository.ReservationRepository;
import com.madawheels.repository.UserRepository;
import com.madawheels.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReservationService {

    private static final DateTimeFormatter REF_DATE_FMT =
            DateTimeFormatter.BASIC_ISO_DATE;

    private final ReservationRepository reservationRepository;
    private final ReservationOptionRepository reservationOptionRepository;
    private final OptionRepository optionRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final SmtpMailSender smtpMailSender;

    public ReservationService(ReservationRepository reservationRepository,
                              ReservationOptionRepository reservationOptionRepository,
                              OptionRepository optionRepository,
                              UserRepository userRepository,
                              VehicleRepository vehicleRepository,
                              SmtpMailSender smtpMailSender) {
        this.reservationRepository = reservationRepository;
        this.reservationOptionRepository = reservationOptionRepository;
        this.optionRepository = optionRepository;
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.smtpMailSender = smtpMailSender;
    }

    public ReservationOutcome createReservation(
            String firstName, String lastName, String email, String phone,
            Long vehicleId, String departure, String returnLocation,
            String startDate, String startTime, String endDate, String endTime,
            Integer driverAge, List<SelectedOption> selectedOptions) {

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Véhicule introuvable."));

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setFirstName(firstName);
            u.setLastName(lastName);
            u.setEmail(email);
            u.setPhone(phone);
            u.setRole("CLIENT");
            return userRepository.save(u);
        });

        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        long days = Math.max(1, ChronoUnit.DAYS.between(start, end));
        BigDecimal nbDays = BigDecimal.valueOf(days);

        BigDecimal vehiclePrice = vehicle.getPricePerDay().multiply(nbDays);

        List<OptionLine> optionLines = new ArrayList<>();
        BigDecimal optionsPrice = BigDecimal.ZERO;

        for (SelectedOption sel : selectedOptions) {
            CarOption carOption = optionRepository.findById(sel.optionId())
                    .filter(o -> Boolean.TRUE.equals(o.getAvailable()))
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Option « " + sel.optionId() + " » indisponible."));

            int quantity = Math.max(1, sel.quantity() == null ? 1 : sel.quantity());
            // Tarif unitaire annoncé dans le catalogue (« /jour » ou « fixe »).
            boolean perDay = "jour".equalsIgnoreCase(carOption.getUnit());
            BigDecimal unitPrice = perDay
                    ? carOption.getPrice().multiply(nbDays)
                    : carOption.getPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));

            optionLines.add(new OptionLine(
                    carOption.getId(), carOption.getName(), quantity, unitPrice, lineTotal));
            optionsPrice = optionsPrice.add(lineTotal);
        }

        BigDecimal totalPrice = vehiclePrice.add(optionsPrice);

        Reservation reservation = new Reservation();
        reservation.setUserId(user.getId());
        reservation.setVehicleId(vehicle.getId());
        reservation.setDeparture(departure);
        reservation.setReturnLocation(returnLocation);
        reservation.setStartDate(start);
        reservation.setStartTime(LocalTime.parse(startTime));
        reservation.setEndDate(end);
        reservation.setEndTime(LocalTime.parse(endTime));
        reservation.setDriverAge(driverAge);
        reservation.setStatus("PENDING");
        reservation.setVehiclePrice(vehiclePrice);
        reservation.setOptionsPrice(optionsPrice);
        reservation.setTotalPrice(totalPrice);

        reservation = reservationRepository.save(reservation);

        for (SelectedOption sel : selectedOptions) {
            CarOption carOption = optionRepository.findById(sel.optionId())
                    .filter(o -> Boolean.TRUE.equals(o.getAvailable()))
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Option « " + sel.optionId() + " » indisponible."));
            reservationOptionRepository.save(new ReservationOption(
                    reservation, carOption,
                    Math.max(1, sel.quantity() == null ? 1 : sel.quantity())));
        }

        // L'id (IDENTITY) n'existe qu'après l'insertion : la référence
        // lisible ("DEV-YYYYMMDD-NNN") est donc générée puis persistée ici.
        reservation.setReference(buildReference(reservation));
        reservation = reservationRepository.saveAndFlush(reservation);

        // Communication socket client/serveur : envoi de l'email de
        // confirmation via SMTP. Jamais bloquant pour la réservation : un
        // échec réseau est loggué et remonté comme emailSent=false.
        boolean emailSent = false;
        try {
            emailSent = smtpMailSender.sendConfirmationEmail(reservation, vehicle, user, optionLines);
        } catch (RuntimeException ex) {
            emailSent = false;
        }

        return new ReservationOutcome(reservation, emailSent, optionLines);
    }

    private String buildReference(Reservation reservation) {
        String reference = "DEV-" + reservation.getCreatedAt().toLocalDate().format(REF_DATE_FMT)
                + "-" + String.format("%03d", reservation.getId());
        reservation.setReference(reference);
        return reference;
    }

    public record SelectedOption(Long optionId, Integer quantity) {}

    public record OptionLine(Long optionId, String name, Integer quantity,
                             BigDecimal unitPrice, BigDecimal totalPrice) {}

    public record ReservationOutcome(Reservation reservation, boolean emailSent,
                                     List<OptionLine> optionLines) {}

    /**
     * Liste les réservations d'un client (identifié par son email) qu'il n'a pas
     * supprimées de son historique, chacune avec son véhicule et ses options.
     */
    public List<ReservationSummary> findReservations(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Aucun compte trouvé pour cet email."));

        List<Reservation> reservations =
                reservationRepository.findByUserIdAndDeletedByClientFalseOrderByCreatedAtDesc(user.getId());

        List<ReservationSummary> summaries = new ArrayList<>();
        for (Reservation r : reservations) {
            Vehicle vehicle = vehicleRepository.findById(r.getVehicleId())
                    .orElse(null);

            List<OptionLine> optionLines = new ArrayList<>();
            long days = Math.max(1, ChronoUnit.DAYS.between(r.getStartDate(), r.getEndDate()));
            for (ReservationOption ro : reservationOptionRepository.findByReservationId(r.getId())) {
                boolean perDay = "jour".equalsIgnoreCase(ro.getOption().getUnit());
                BigDecimal unitPrice = perDay
                        ? ro.getOption().getPrice().multiply(BigDecimal.valueOf(days))
                        : ro.getOption().getPrice();
                optionLines.add(new OptionLine(
                        ro.getOption().getId(),
                        ro.getOption().getName(),
                        ro.getQuantity(),
                        unitPrice,
                        unitPrice.multiply(BigDecimal.valueOf(ro.getQuantity()))
                ));
            }

            summaries.add(new ReservationSummary(
                    r.getId(),
                    r.getReference(),
                    r.getStatus(),
                    r.getVehicleId(),
                    vehicle != null ? vehicle.getBrand() + " " + vehicle.getModel() : "Véhicule supprimé",
                    vehicle != null ? vehicle.getImageUrl() : null,
                    r.getDeparture(),
                    r.getReturnLocation(),
                    r.getStartDate().toString(),
                    r.getStartTime().toString(),
                    r.getEndDate().toString(),
                    r.getEndTime().toString(),
                    r.getVehiclePrice(),
                    r.getOptionsPrice(),
                    r.getTotalPrice(),
                    r.getCreatedAt() != null ? r.getCreatedAt().toString() : null,
                    r.getPaymentMethod(),
                    r.getCardHolder(),
                    r.getCardLast4(),
                    r.getPaidAt() != null ? r.getPaidAt().toString() : null,
                    optionLines
            ));
        }
        return summaries;
    }

    public record ReservationSummary(
            Long reservationId,
            String reference,
            String status,
            Long vehicleId,
            String vehicleName,
            String vehicleImage,
            String departure,
            String returnLocation,
            String startDate,
            String startTime,
            String endDate,
            String endTime,
            BigDecimal vehiclePrice,
            BigDecimal optionsPrice,
            BigDecimal totalPrice,
            String createdAt,
            String paymentMethod,
            String cardHolder,
            String cardLast4,
            String paidAt,
            List<OptionLine> optionLines) {}

    /**
     * Suppression « douce » : la réservation est masquée de l'historique du
     * client mais reste en base (transactions et statistiques de l'admin intactes).
     * Seules les réservations terminées ou refusées peuvent être supprimées.
     */
    public String deleteReservation(Long userId, Long reservationId) {
        Reservation r = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable."));
        if (!r.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Accès refusé : cette réservation ne vous appartient pas.");
        }
        if (!List.of("TERMINEE", "REFUSEE").contains(r.getStatus())) {
            throw new IllegalArgumentException(
                    "Seules les réservations terminées ou refusées peuvent être supprimées.");
        }
        r.setDeletedByClient(true);
        reservationRepository.save(r);
        return "Réservation supprimée de votre historique.";
    }

    public record PaymentResult(Reservation reservation, boolean emailSent, String message) {}

    public PaymentResult submitPayment(String reference, String cardHolder, String cardNumber, String expiry) {
        Reservation reservation = reservationRepository.findByReference(reference)
                .orElseThrow(() -> new IllegalArgumentException("Numéro de devis introuvable."));

        if (!"VALIDEE".equals(reservation.getStatus())) {
            throw new IllegalArgumentException(
                    "Cette réservation n'est pas en attente de paiement (statut actuel : " + reservation.getStatus() + ").");
        }
        if (cardHolder == null || cardHolder.isBlank()) {
            throw new IllegalArgumentException("Le nom du titulaire de la carte est requis.");
        }
        String digits = cardNumber == null ? "" : cardNumber.replaceAll("\\s", "");
        if (digits.length() < 12 || !digits.matches("\\d+")) {
            throw new IllegalArgumentException("Numéro de carte invalide.");
        }

        reservation.setPaymentMethod("CARTE");
        reservation.setCardHolder(cardHolder.trim());
        reservation.setCardLast4(digits.substring(digits.length() - 4));
        reservation.setPaidAt(java.time.LocalDateTime.now());
        reservation.setStatus("TERMINEE");
        reservation = reservationRepository.save(reservation);

        User client = userRepository.findById(reservation.getUserId()).orElse(null);
        Vehicle vehicle = vehicleRepository.findById(reservation.getVehicleId()).orElse(null);

        // Reconstruire le détail des options pour le reçu.
        long daysCount = Math.max(1, ChronoUnit.DAYS.between(reservation.getStartDate(), reservation.getEndDate()));
        List<OptionLine> optionLines = new ArrayList<>();
        for (ReservationOption ro : reservationOptionRepository.findByReservationId(reservation.getId())) {
            boolean perDay = "jour".equalsIgnoreCase(ro.getOption().getUnit());
            BigDecimal unitPrice = perDay
                    ? ro.getOption().getPrice().multiply(BigDecimal.valueOf(daysCount))
                    : ro.getOption().getPrice();
            optionLines.add(new OptionLine(
                    ro.getOption().getId(), ro.getOption().getName(), ro.getQuantity(),
                    unitPrice, unitPrice.multiply(BigDecimal.valueOf(ro.getQuantity()))));
        }

        boolean emailSent = false;
        if (client != null) {
            try {
                emailSent = smtpMailSender.sendPaymentConfirmedEmail(reservation, vehicle, client, optionLines);
            } catch (RuntimeException ex) {
                emailSent = false;
            }
        }
        return new PaymentResult(reservation, emailSent, "Paiement enregistré, votre réservation est maintenant terminée.");
    }
}