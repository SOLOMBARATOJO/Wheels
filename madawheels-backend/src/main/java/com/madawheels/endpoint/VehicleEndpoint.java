package com.madawheels.endpoint;

import com.madawheels.entity.Vehicle;
import com.madawheels.service.VehicleService;
import com.madawheels.wsdl.SearchVehiclesRequest;
import com.madawheels.wsdl.SearchVehiclesResponse;

import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import java.util.List;

@Endpoint
public class VehicleEndpoint {

    private static final String NAMESPACE_URI =
            "http://www.madawheels.com/vehicles";

    private final VehicleService vehicleService;

    public VehicleEndpoint(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PayloadRoot(
            namespace = NAMESPACE_URI,
            localPart = "searchVehiclesRequest"
    )
    @ResponsePayload
    public SearchVehiclesResponse searchVehicles(
            @RequestPayload SearchVehiclesRequest request) {

        List<Vehicle> vehicles =
                vehicleService.searchVehicles(
                        request.getDeparture(),
                        request.getReturnLocation(),
                        request.getStartDate(),
                        request.getStartTime(),
                        request.getEndDate(),
                        request.getEndTime(),
                        request.getDriverAge(),
                        request.getType(),
                        request.getTransmission(),
                        request.getFuel(),
                        request.getMaxPrice()
                );

        SearchVehiclesResponse response =
                new SearchVehiclesResponse();

        for (Vehicle vehicle : vehicles) {

            com.madawheels.wsdl.Vehicle wsdlVehicle =
                    new com.madawheels.wsdl.Vehicle();

            wsdlVehicle.setId(vehicle.getId());
            wsdlVehicle.setName(vehicle.getName());
            wsdlVehicle.setBrand(vehicle.getBrand());
            wsdlVehicle.setModel(vehicle.getModel());
            wsdlVehicle.setType(vehicle.getType());
            wsdlVehicle.setTransmission(vehicle.getTransmission());
            wsdlVehicle.setSeats(vehicle.getSeats());
            wsdlVehicle.setDoors(vehicle.getDoors());
            wsdlVehicle.setFuel(vehicle.getFuel());
            wsdlVehicle.setPricePerDay(vehicle.getPricePerDay());
            wsdlVehicle.setImageUrl(vehicle.getImageUrl());
            wsdlVehicle.setDescription(vehicle.getDescription());
            wsdlVehicle.setDeparture(vehicle.getDeparture());
            wsdlVehicle.setAvailable(vehicle.getAvailable());

            response.getVehicle().add(wsdlVehicle);
        }

        return response;
    }
}