package com.madawheels.endpoint;

import com.madawheels.entity.Reservation;
import com.madawheels.entity.User;
import com.madawheels.entity.Vehicle;
import com.madawheels.service.AdminService;
import com.madawheels.wsdl.AdminReservation;
import com.madawheels.wsdl.AdminSearchVehiclesRequest;
import com.madawheels.wsdl.AdminSearchVehiclesResponse;
import com.madawheels.wsdl.AdminStatsRequest;
import com.madawheels.wsdl.AdminStatsResponse;
import com.madawheels.wsdl.ClientSummary;
import com.madawheels.wsdl.CreateVehicleRequest;
import com.madawheels.wsdl.CreateVehicleResponse;
import com.madawheels.wsdl.DeleteVehicleRequest;
import com.madawheels.wsdl.DeleteVehicleResponse;
import com.madawheels.wsdl.ListClientsForAdminRequest;
import com.madawheels.wsdl.ListClientsForAdminResponse;
import com.madawheels.wsdl.ListReservationsForAdminRequest;
import com.madawheels.wsdl.ListReservationsForAdminResponse;
import com.madawheels.wsdl.ListTransactionsForAdminRequest;
import com.madawheels.wsdl.ListTransactionsForAdminResponse;
import com.madawheels.wsdl.RefuseReservationRequest;
import com.madawheels.wsdl.RefuseReservationResponse;
import com.madawheels.wsdl.Transaction;
import com.madawheels.wsdl.UpdateVehicleRequest;
import com.madawheels.wsdl.UpdateVehicleResponse;
import com.madawheels.wsdl.ValidateReservationRequest;
import com.madawheels.wsdl.ValidateReservationResponse;

import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import java.util.List;

@Endpoint
public class AdminEndpoint {

    private static final String NAMESPACE_URI = "http://www.madawheels.com/vehicles";

    private final AdminService adminService;

    public AdminEndpoint(AdminService adminService) {
        this.adminService = adminService;
    }

    // ---------- Réservations ----------

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "listReservationsForAdminRequest")
    @ResponsePayload
    public ListReservationsForAdminResponse listReservationsForAdmin(
            @RequestPayload ListReservationsForAdminRequest request) {

        List<Reservation> reservations =
                adminService.listReservations(request.getAdminUserId(), request.getStatus());

        ListReservationsForAdminResponse response = new ListReservationsForAdminResponse();
        for (Reservation r : reservations) {
            response.getReservation().add(toWsdlAdminReservation(r));
        }
        return response;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "validateReservationRequest")
    @ResponsePayload
    public ValidateReservationResponse validateReservation(@RequestPayload ValidateReservationRequest request) {
        AdminService.ActionResult result = adminService.validateReservation(
                request.getAdminUserId(), request.getReservationId(), request.getAdminNote());

        ValidateReservationResponse response = new ValidateReservationResponse();
        response.setReservationId(result.reservation().getId());
        response.setStatus(result.reservation().getStatus());
        response.setEmailSent(result.emailSent());
        response.setMessage(result.message());
        return response;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "refuseReservationRequest")
    @ResponsePayload
    public RefuseReservationResponse refuseReservation(@RequestPayload RefuseReservationRequest request) {
        AdminService.ActionResult result = adminService.refuseReservation(
                request.getAdminUserId(), request.getReservationId(), request.getReason());

        RefuseReservationResponse response = new RefuseReservationResponse();
        response.setReservationId(result.reservation().getId());
        response.setStatus(result.reservation().getStatus());
        response.setEmailSent(result.emailSent());
        response.setMessage(result.message());
        return response;
    }

    // ---------- Gestion de la flotte ----------

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "createVehicleRequest")
    @ResponsePayload
    public CreateVehicleResponse createVehicle(@RequestPayload CreateVehicleRequest request) {
        Vehicle vehicle = new Vehicle();
        vehicle.setName(request.getName());
        vehicle.setBrand(request.getBrand());
        vehicle.setModel(request.getModel());
        vehicle.setType(request.getType());
        vehicle.setTransmission(request.getTransmission());
        vehicle.setSeats(request.getSeats());
        vehicle.setDoors(request.getDoors());
        vehicle.setFuel(request.getFuel());
        vehicle.setPricePerDay(request.getPricePerDay());
        vehicle.setImageUrl(request.getImageUrl());
        vehicle.setDescription(request.getDescription());
        vehicle.setDeparture(request.getDeparture());
        vehicle.setAvailable(request.isAvailable() != null ? request.isAvailable() : Boolean.TRUE);

        Vehicle saved = adminService.createVehicle(request.getAdminUserId(), vehicle);

        CreateVehicleResponse response = new CreateVehicleResponse();
        response.setVehicleId(saved.getId());
        response.setMessage("Véhicule ajouté avec succès.");
        return response;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "updateVehicleRequest")
    @ResponsePayload
    public UpdateVehicleResponse updateVehicle(@RequestPayload UpdateVehicleRequest request) {
        Vehicle patch = new Vehicle();
        patch.setName(request.getName());
        patch.setBrand(request.getBrand());
        patch.setModel(request.getModel());
        patch.setType(request.getType());
        patch.setTransmission(request.getTransmission());
        patch.setSeats(request.getSeats());
        patch.setDoors(request.getDoors());
        patch.setFuel(request.getFuel());
        patch.setPricePerDay(request.getPricePerDay());
        patch.setImageUrl(request.getImageUrl());
        patch.setDescription(request.getDescription());
        patch.setDeparture(request.getDeparture());
        patch.setAvailable(request.isAvailable());

        Vehicle updated = adminService.updateVehicle(request.getAdminUserId(), request.getVehicleId(), patch);

        UpdateVehicleResponse response = new UpdateVehicleResponse();
        response.setVehicleId(updated.getId());
        response.setMessage("Véhicule modifié avec succès.");
        return response;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "deleteVehicleRequest")
    @ResponsePayload
    public DeleteVehicleResponse deleteVehicle(@RequestPayload DeleteVehicleRequest request) {
        String message = adminService.deleteVehicle(request.getAdminUserId(), request.getVehicleId());

        DeleteVehicleResponse response = new DeleteVehicleResponse();
        response.setMessage(message);
        return response;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "adminSearchVehiclesRequest")
    @ResponsePayload
    public AdminSearchVehiclesResponse adminSearchVehicles(@RequestPayload AdminSearchVehiclesRequest request) {
        List<Vehicle> vehicles = adminService.searchVehicles(
                request.getAdminUserId(), request.getKeyword(), request.getDeparture());

        AdminSearchVehiclesResponse response = new AdminSearchVehiclesResponse();
        for (Vehicle v : vehicles) {
            com.madawheels.wsdl.Vehicle wsdlVehicle = new com.madawheels.wsdl.Vehicle();
            wsdlVehicle.setId(v.getId());
            wsdlVehicle.setName(v.getName());
            wsdlVehicle.setBrand(v.getBrand());
            wsdlVehicle.setModel(v.getModel());
            wsdlVehicle.setType(v.getType());
            wsdlVehicle.setTransmission(v.getTransmission());
            wsdlVehicle.setSeats(v.getSeats());
            wsdlVehicle.setDoors(v.getDoors());
            wsdlVehicle.setFuel(v.getFuel());
            wsdlVehicle.setPricePerDay(v.getPricePerDay());
            wsdlVehicle.setImageUrl(v.getImageUrl());
            wsdlVehicle.setDescription(v.getDescription());
            wsdlVehicle.setDeparture(v.getDeparture());
            wsdlVehicle.setAvailable(v.getAvailable());
            response.getVehicle().add(wsdlVehicle);
        }
        return response;
    }

    // ---------- Clients (vue admin / CRM) ----------

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "listClientsForAdminRequest")
    @ResponsePayload
    public ListClientsForAdminResponse listClientsForAdmin(@RequestPayload ListClientsForAdminRequest request) {
        List<AdminService.ClientView> clients = adminService.listClients(request.getAdminUserId());

        ListClientsForAdminResponse response = new ListClientsForAdminResponse();
        for (AdminService.ClientView view : clients) {
            User u = view.user();
            ClientSummary cs = new ClientSummary();
            cs.setUserId(u.getId());
            cs.setFirstName(u.getFirstName());
            cs.setLastName(u.getLastName());
            cs.setEmail(u.getEmail());
            cs.setPhone(u.getPhone() != null ? u.getPhone() : "");
            cs.setStatus(u.getStatus());
            cs.setReservationsCount(view.reservationsCount());
            response.getClient().add(cs);
        }
        return response;
    }

    // ---------- Transactions (paiements clients) ----------

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "listTransactionsForAdminRequest")
    @ResponsePayload
    public ListTransactionsForAdminResponse listTransactionsForAdmin(
            @RequestPayload ListTransactionsForAdminRequest request) {

        List<AdminService.TransactionView> transactions = adminService.listTransactions(request.getAdminUserId());

        ListTransactionsForAdminResponse response = new ListTransactionsForAdminResponse();
        for (AdminService.TransactionView view : transactions) {
            Reservation r = view.reservation();
            User client = view.client();
            Vehicle vehicle = view.vehicle();

            Transaction t = new Transaction();
            t.setReservationId(r.getId());
            t.setReference(r.getReference());
            t.setStatus(r.getStatus());
            t.setClientFirstName(client != null ? client.getFirstName() : "");
            t.setClientLastName(client != null ? client.getLastName() : "");
            t.setClientEmail(client != null ? client.getEmail() : "");
            t.setClientPhone(client != null && client.getPhone() != null ? client.getPhone() : "");
            t.setVehicleName(vehicle != null ? vehicle.getBrand() + " " + vehicle.getModel() : "Véhicule supprimé");
            t.setDeparture(r.getDeparture());
            t.setReturnLocation(r.getReturnLocation());
            t.setStartDate(r.getStartDate() != null ? r.getStartDate().toString() : "");
            t.setEndDate(r.getEndDate() != null ? r.getEndDate().toString() : "");
            t.setVehiclePrice(r.getVehiclePrice());
            t.setOptionsPrice(r.getOptionsPrice());
            t.setTotalPrice(r.getTotalPrice());
            t.setPaymentMethod(r.getPaymentMethod() != null ? r.getPaymentMethod() : "");
            t.setCardHolder(r.getCardHolder() != null ? r.getCardHolder() : "");
            t.setCardLastFour(r.getCardLast4() != null ? r.getCardLast4() : "");
            t.setPaidAt(r.getPaidAt() != null ? r.getPaidAt().toString() : "");
            t.setCreatedAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
            response.getTransaction().add(t);
        }
        return response;
    }

    // ---------- Statistiques (tableau de bord) ----------

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "adminStatsRequest")
    @ResponsePayload
    public AdminStatsResponse adminStats(@RequestPayload AdminStatsRequest request) {
        AdminService.Stats stats = adminService.getStats(request.getAdminUserId());

        AdminStatsResponse response = new AdminStatsResponse();
        response.setTotalClients((int) stats.totalClients());
        response.setTotalVehicles((int) stats.totalVehicles());
        response.setAvailableVehicles((int) stats.availableVehicles());
        response.setPendingReservations((int) stats.pendingReservations());
        response.setValidatedReservations((int) stats.validatedReservations());
        response.setCompletedReservations((int) stats.completedReservations());
        response.setRefusedReservations((int) stats.refusedReservations());
        return response;
    }

    // ---------- Mapping ----------

    private AdminReservation toWsdlAdminReservation(Reservation r) {
        AdminReservation ar = new AdminReservation();
        ar.setReservationId(r.getId());
        ar.setReference(r.getReference());
        ar.setStatus(r.getStatus());
        ar.setUserId(r.getUserId());
        ar.setVehicleId(r.getVehicleId());
        ar.setDeparture(r.getDeparture());
        ar.setReturnLocation(r.getReturnLocation());
        ar.setStartDate(r.getStartDate() != null ? r.getStartDate().toString() : "");
        ar.setEndDate(r.getEndDate() != null ? r.getEndDate().toString() : "");
        ar.setTotalPrice(r.getTotalPrice());
        ar.setAdminNote(r.getAdminNote());
        ar.setCreatedAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
        return ar;
    }
}