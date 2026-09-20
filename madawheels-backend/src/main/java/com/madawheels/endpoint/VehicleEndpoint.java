package com.madawheels.endpoint;

import com.madawheels.entity.Vehicle;
import com.madawheels.service.VehicleService;
import com.madawheels.wsdl.SearchVehiclesRequest;
import com.madawheels.wsdl.SearchVehiclesResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import java.util.List;

@Endpoint
public class VehicleEndpoint {

    private static final String NAMESPACE_URI = "http://www.madawheels.com/vehicles";

    @Autowired
    private VehicleService vehicleService;

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "searchVehiclesRequest")
    @ResponsePayload
    public SearchVehiclesResponse searchVehicles(@RequestPayload SearchVehiclesRequest request) {

        List<Vehicle> vehicles = vehicleService.searchVehicles(
                request.getDeparture(),
                request.getDestination(),
                request.getDate(),
                request.getTime()
        );

        SearchVehiclesResponse response = new SearchVehiclesResponse();

        for (Vehicle v : vehicles) {
            com.madawheels.wsdl.Vehicle wsdlVehicle = new com.madawheels.wsdl.Vehicle();
            wsdlVehicle.setId(v.getId());
            wsdlVehicle.setName(v.getName());
            wsdlVehicle.setType(v.getType());
            wsdlVehicle.setPrice(v.getPrice());
            wsdlVehicle.setAvailable(v.getAvailable());
            response.getVehicle().add(wsdlVehicle);
        }

        return response;
    }
}