package com.madawheels.endpoint;

import com.madawheels.entity.Reservation;
import com.madawheels.service.ReservationService;
import com.madawheels.wsdl.CreateReservationRequest;
import com.madawheels.wsdl.CreateReservationResponse;
import com.madawheels.wsdl.FindReservationsRequest;
import com.madawheels.wsdl.FindReservationsResponse;
import com.madawheels.wsdl.ReservationOption;
import com.madawheels.wsdl.ReservationSummary;
import com.madawheels.wsdl.SelectedOption;

import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import java.util.ArrayList;
import java.util.List;

@Endpoint
public class ReservationEndpoint {

    private static final String NAMESPACE_URI = "http://www.madawheels.com/vehicles";

    private final ReservationService reservationService;

    public ReservationEndpoint(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "createReservationRequest")
    @ResponsePayload
    public CreateReservationResponse createReservation(@RequestPayload CreateReservationRequest request) {

        List<ReservationService.SelectedOption> selectedOptions = new ArrayList<>();
        for (SelectedOption sel : request.getSelectedOption()) {
            selectedOptions.add(new ReservationService.SelectedOption(
                    sel.getOptionId(), sel.getQuantity()));
        }

        ReservationService.ReservationOutcome outcome = reservationService.createReservation(
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                request.getPhone(),
                request.getVehicleId(),
                request.getDeparture(),
                request.getReturnLocation(),
                request.getStartDate(),
                request.getStartTime(),
                request.getEndDate(),
                request.getEndTime(),
                request.getDriverAge(),
                selectedOptions
        );

        Reservation reservation = outcome.reservation();

        CreateReservationResponse response = new CreateReservationResponse();
        response.setReservationId(reservation.getId());
        response.setReference(reservation.getReference());
        response.setStatus(reservation.getStatus());
        response.setVehiclePrice(reservation.getVehiclePrice());
        response.setOptionsPrice(reservation.getOptionsPrice());
        response.setTotalPrice(reservation.getTotalPrice());
        response.setEmailSent(outcome.emailSent());

        for (ReservationService.OptionLine line : outcome.optionLines()) {
            ReservationOption wsdlOption = new ReservationOption();
            wsdlOption.setOptionId(line.optionId());
            wsdlOption.setName(line.name());
            wsdlOption.setQuantity(line.quantity());
            wsdlOption.setUnitPrice(line.unitPrice());
            wsdlOption.setTotalPrice(line.totalPrice());
            response.getOption().add(wsdlOption);
        }

        return response;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "findReservationsRequest")
    @ResponsePayload
    public FindReservationsResponse findReservations(@RequestPayload FindReservationsRequest request) {

        List<ReservationService.ReservationSummary> summaries =
                reservationService.findReservations(request.getEmail());

        FindReservationsResponse response = new FindReservationsResponse();
        for (ReservationService.ReservationSummary summary : summaries) {
            ReservationSummary wsdlSummary = new ReservationSummary();
            wsdlSummary.setReservationId(summary.reservationId());
            wsdlSummary.setReference(summary.reference());
            wsdlSummary.setStatus(summary.status());
            wsdlSummary.setVehicleId(summary.vehicleId());
            wsdlSummary.setVehicleName(summary.vehicleName());
            wsdlSummary.setVehicleImage(summary.vehicleImage());
            wsdlSummary.setDeparture(summary.departure());
            wsdlSummary.setReturnLocation(summary.returnLocation());
            wsdlSummary.setStartDate(summary.startDate());
            wsdlSummary.setStartTime(summary.startTime());
            wsdlSummary.setEndDate(summary.endDate());
            wsdlSummary.setEndTime(summary.endTime());
            wsdlSummary.setVehiclePrice(summary.vehiclePrice());
            wsdlSummary.setOptionsPrice(summary.optionsPrice());
            wsdlSummary.setTotalPrice(summary.totalPrice());
            wsdlSummary.setCreatedAt(summary.createdAt());

            for (ReservationService.OptionLine line : summary.optionLines()) {
                ReservationOption wsdlOption = new ReservationOption();
                wsdlOption.setOptionId(line.optionId());
                wsdlOption.setName(line.name());
                wsdlOption.setQuantity(line.quantity());
                wsdlOption.setUnitPrice(line.unitPrice());
                wsdlOption.setTotalPrice(line.totalPrice());
                wsdlSummary.getOption().add(wsdlOption);
            }

            response.getReservation().add(wsdlSummary);
        }

        return response;
    }
}