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
     * Liste toutes les réservations d'un client (identifié par son email),
     * chacune avec son véhicule et le détail des options choisies.
     */
    public List<ReservationSummary> findReservations(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Aucun compte trouvé pour cet email."));

        List<Reservation> reservations =
                reservationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

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
            List<OptionLine> optionLines) {}
}