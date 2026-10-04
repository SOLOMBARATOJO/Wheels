package com.madawheels.service;

import com.madawheels.entity.Reservation;
import com.madawheels.entity.User;
import com.madawheels.entity.Vehicle;
import com.madawheels.repository.ReservationRepository;
import com.madawheels.repository.UserRepository;
import com.madawheels.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.ArrayList;
import java.util.List;

/**
 * Actions réservées à l'admin : aucune réservation client ne peut être payée
 * sans que l'admin ait d'abord vérifié la disponibilité réelle du véhicule.
 */
@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final SmtpMailSender smtpMailSender;

    public AdminService(ReservationRepository reservationRepository, UserRepository userRepository,
                         VehicleRepository vehicleRepository, SmtpMailSender smtpMailSender) {
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.smtpMailSender = smtpMailSender;
    }

    private void requireAdmin(Long adminUserId) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new IllegalArgumentException("Administrateur introuvable."));
        if (!"ADMIN".equals(admin.getRole())) {
            throw new IllegalArgumentException("Accès refusé : compte non administrateur.");
        }
    }

    public List<Reservation> listReservations(Long adminUserId, String statusFilter) {
        requireAdmin(adminUserId);
        return (statusFilter == null || statusFilter.isBlank())
                ? reservationRepository.findAllByOrderByCreatedAtDesc()
                : reservationRepository.findByStatusOrderByCreatedAtDesc(statusFilter.toUpperCase());
    }

    public record ActionResult(Reservation reservation, boolean emailSent, String message) {}

    public ActionResult validateReservation(Long adminUserId, Long reservationId, String adminNote) {
        requireAdmin(adminUserId);
        Reservation reservation = getPendingReservation(reservationId);

        reservation.setStatus("VALIDEE");
        reservation.setAdminNote(adminNote);
        reservationRepository.save(reservation);

        User client = userRepository.findById(reservation.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Client introuvable."));
        Vehicle vehicle = vehicleRepository.findById(reservation.getVehicleId()).orElse(null);

        boolean emailSent;
        try {
            emailSent = smtpMailSender.sendPaymentRequestEmail(reservation, vehicle, client);
        } catch (RuntimeException ex) {
            log.warn("Échec envoi email de validation pour réservation {} : {}", reservation.getReference(), ex.getMessage(), ex);
            emailSent = false;
        }
        return new ActionResult(reservation, emailSent,
                "Réservation validée. Le client a été invité à régler par carte bancaire.");
    }

    public ActionResult refuseReservation(Long adminUserId, Long reservationId, String reason) {
        requireAdmin(adminUserId);
        Reservation reservation = getPendingReservation(reservationId);

        reservation.setStatus("REFUSEE");
        reservation.setRefusalReason(reason);
        reservationRepository.save(reservation);

        User client = userRepository.findById(reservation.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Client introuvable."));

        boolean emailSent;
        try {
            emailSent = smtpMailSender.sendReservationRefusedEmail(reservation, client, reason);
        } catch (RuntimeException ex) {
            log.warn("Échec envoi email de refus pour réservation {} : {}", reservation.getReference(), ex.getMessage(), ex);
            emailSent = false;
        }
        return new ActionResult(reservation, emailSent, "Réservation refusée.");
    }

    private Reservation getPendingReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable."));
        if (!"PENDING".equals(reservation.getStatus())) {
            throw new IllegalArgumentException(
                    "Cette réservation a déjà été traitée (statut actuel : " + reservation.getStatus() + ").");
        }
        return reservation;
    }

    // ---------- Gestion de la flotte ----------

    public Vehicle createVehicle(Long adminUserId, Vehicle vehicle) {
        requireAdmin(adminUserId);
        vehicle.setId(null);
        if (vehicle.getAvailable() == null) vehicle.setAvailable(true);
        return vehicleRepository.save(vehicle);
    }

    /** Seuls les champs non nuls/non vides transmis sont mis à jour (ex : juste le nom). */
    public Vehicle updateVehicle(Long adminUserId, Long vehicleId, Vehicle patch) {
        requireAdmin(adminUserId);
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Véhicule introuvable."));

        if (notBlank(patch.getName())) vehicle.setName(patch.getName());
        if (notBlank(patch.getBrand())) vehicle.setBrand(patch.getBrand());
        if (notBlank(patch.getModel())) vehicle.setModel(patch.getModel());
        if (notBlank(patch.getType())) vehicle.setType(patch.getType());
        if (notBlank(patch.getTransmission())) vehicle.setTransmission(patch.getTransmission());
        if (patch.getSeats() != null) vehicle.setSeats(patch.getSeats());
        if (patch.getDoors() != null) vehicle.setDoors(patch.getDoors());
        if (notBlank(patch.getFuel())) vehicle.setFuel(patch.getFuel());
        if (patch.getPricePerDay() != null) vehicle.setPricePerDay(patch.getPricePerDay());
        if (notBlank(patch.getImageUrl())) vehicle.setImageUrl(patch.getImageUrl());
        if (notBlank(patch.getDescription())) vehicle.setDescription(patch.getDescription());
        if (notBlank(patch.getDeparture())) vehicle.setDeparture(patch.getDeparture());
        if (patch.getAvailable() != null) vehicle.setAvailable(patch.getAvailable());

        return vehicleRepository.save(vehicle);
    }

    private static final List<String> ACTIVE_STATUSES = List.of("PENDING", "VALIDEE");

    /**
     * Un véhicule avec une réservation en cours n'est jamais supprimé "en dur" :
     * il passe seulement en indisponible, pour ne pas casser les réservations
     * déjà liées côté client.
     */
    public String deleteVehicle(Long adminUserId, Long vehicleId) {
        requireAdmin(adminUserId);
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Véhicule introuvable."));

        boolean occupied = !reservationRepository
                .findByVehicleIdAndStatusIn(vehicleId, ACTIVE_STATUSES).isEmpty();

        if (occupied) {
            vehicle.setAvailable(false);
            vehicleRepository.save(vehicle);
            return "Ce véhicule a des réservations en cours : il a été marqué « indisponible » " +
                    "plutôt que supprimé, pour ne pas impacter les clients concernés.";
        }

        vehicleRepository.delete(vehicle);
        return "Véhicule supprimé. Les anciennes réservations qui le concernaient afficheront " +
                "désormais « Véhicule supprimé » côté client.";
    }

    public List<Vehicle> searchVehicles(Long adminUserId, String keyword, String departure) {
        requireAdmin(adminUserId);
        return vehicleRepository.adminSearch(notBlank(keyword) ? keyword : null, notBlank(departure) ? departure : null);
    }

    // ---------- Clients (vue admin / CRM) ----------

    /** Une ligne de la liste des clients, prête à être mappée vers le type SOAP clientSummary. */
    public record ClientView(User user, int reservationsCount) {}

    public List<ClientView> listClients(Long adminUserId) {
        requireAdmin(adminUserId);
        List<User> clients = userRepository.findByRoleOrderByIdDesc("CLIENT");
        List<ClientView> views = new ArrayList<>();
        for (User client : clients) {
            int count = reservationRepository.findByUserIdOrderByCreatedAtDesc(client.getId()).size();
            views.add(new ClientView(client, count));
        }
        return views;
    }

    // ---------- Transactions (paiements clients) ----------

    /** Une transaction = une réservation payée (statut TERMINEE), avec le client et le véhicule résolus. */
    public record TransactionView(Reservation reservation, User client, Vehicle vehicle) {}

    public List<TransactionView> listTransactions(Long adminUserId) {
        requireAdmin(adminUserId);
        List<Reservation> paid = reservationRepository.findByStatusOrderByCreatedAtDesc("TERMINEE");
        List<TransactionView> views = new ArrayList<>();
        for (Reservation reservation : paid) {
            User client = userRepository.findById(reservation.getUserId()).orElse(null);
            Vehicle vehicle = vehicleRepository.findById(reservation.getVehicleId()).orElse(null);
            views.add(new TransactionView(reservation, client, vehicle));
        }
        return views;
    }

    // ---------- Statistiques (tableau de bord) ----------

    public record Stats(long totalClients, long totalVehicles, long availableVehicles,
                        long pendingReservations, long validatedReservations,
                        long completedReservations, long refusedReservations) {}

    public Stats getStats(Long adminUserId) {
        requireAdmin(adminUserId);
        return new Stats(
                userRepository.countByRole("CLIENT"),
                vehicleRepository.count(),
                vehicleRepository.countByAvailableTrue(),
                reservationRepository.countByStatus("PENDING"),
                reservationRepository.countByStatus("VALIDEE"),
                reservationRepository.countByStatus("TERMINEE"),
                reservationRepository.countByStatus("REFUSEE"));
    }

    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }
}