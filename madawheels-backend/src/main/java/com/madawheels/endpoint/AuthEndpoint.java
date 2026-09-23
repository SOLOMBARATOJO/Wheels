package com.madawheels.endpoint;

import com.madawheels.service.AuthService;
import com.madawheels.service.AuthService.LoginResult;
import com.madawheels.service.AuthService.RegisterResult;
import com.madawheels.service.AuthService.VerifyResult;
import com.madawheels.wsdl.GetUserRequest;
import com.madawheels.wsdl.GetUserResponse;
import com.madawheels.wsdl.LoginRequest;
import com.madawheels.wsdl.LoginResponse;
import com.madawheels.wsdl.RegisterRequest;
import com.madawheels.wsdl.RegisterResponse;
import com.madawheels.wsdl.UserInfo;
import com.madawheels.wsdl.VerifyCodeRequest;
import com.madawheels.wsdl.VerifyCodeResponse;

import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

@Endpoint
public class AuthEndpoint {

    private static final String NAMESPACE_URI =
            "http://www.madawheels.com/vehicles";

    private final AuthService authService;

    public AuthEndpoint(AuthService authService) {
        this.authService = authService;
    }

    @PayloadRoot(
            namespace = NAMESPACE_URI,
            localPart = "registerRequest"
    )
    @ResponsePayload
    public RegisterResponse register(@RequestPayload RegisterRequest request) {
        RegisterResult result = authService.register(
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                request.getPhone(),
                request.getPassword()
        );

        RegisterResponse response = new RegisterResponse();
        response.setUserId(result.userId());
        response.setStatus(result.status());
        response.setEmailSent(result.emailSent());
        response.setMessage(result.message());
        return response;
    }

    @PayloadRoot(
            namespace = NAMESPACE_URI,
            localPart = "verifyCodeRequest"
    )
    @ResponsePayload
    public VerifyCodeResponse verifyCode(@RequestPayload VerifyCodeRequest request) {
        VerifyResult result = authService.verifyCode(
                request.getEmail(), request.getCode());

        VerifyCodeResponse response = new VerifyCodeResponse();
        response.setSuccess(result.success());
        response.setUser(toWsUser(result.user()));
        response.setMessage(result.message());
        return response;
    }

    @PayloadRoot(
            namespace = NAMESPACE_URI,
            localPart = "loginRequest"
    )
    @ResponsePayload
    public LoginResponse login(@RequestPayload LoginRequest request) {
        LoginResult result = authService.login(
                request.getEmail(), request.getPassword());

        LoginResponse response = new LoginResponse();
        response.setSuccess(result.success());
        response.setUser(toWsUser(result.user()));
        response.setMessage(result.message());
        return response;
    }

    @PayloadRoot(
            namespace = NAMESPACE_URI,
            localPart = "getUserRequest"
    )
    @ResponsePayload
    public GetUserResponse getUser(@RequestPayload GetUserRequest request) {
        com.madawheels.service.AuthService.UserInfo user =
                authService.getUser(request.getUserId());

        GetUserResponse response = new GetUserResponse();
        response.setUser(toWsUser(user));
        response.setMessage("Profil récupéré.");
        return response;
    }

    private UserInfo toWsUser(com.madawheels.service.AuthService.UserInfo user) {
        UserInfo ws = new UserInfo();
        ws.setUserId(user.userId());
        ws.setFirstName(user.firstName());
        ws.setLastName(user.lastName());
        ws.setEmail(user.email());
        ws.setPhone(user.phone() != null ? user.phone() : "");
        ws.setRole(user.role());
        ws.setStatus(user.status());
        return ws;
    }
}