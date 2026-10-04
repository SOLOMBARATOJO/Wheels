package com.madawheels.controller;

import com.madawheels.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

/**
 * Import d'une image de véhicule depuis l'appareil de l'administrateur.
 * Le fichier est enregistré dans le dossier configuré (app.upload-dir) sous un
 * nom généré, et servi ensuite par /uploads/** (voir WebConfig).
 */
@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "image/gif", "gif");

    private final UserRepository userRepository;
    private final Path uploadDir;

    public UploadController(UserRepository userRepository,
                            @Value("${app.upload-dir:uploads}") String dir) {
        this.userRepository = userRepository;
        this.uploadDir = Paths.get(dir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new IllegalStateException("Impossible de créer le dossier d'upload : " + this.uploadDir, e);
        }
    }

    @PostMapping(value = "/vehicles", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadVehicleImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("adminUserId") Long adminUserId) {

        boolean isAdmin = userRepository.findById(adminUserId)
                .map(u -> "ADMIN".equals(u.getRole()))
                .orElse(false);
        if (!isAdmin) {
            return error(HttpStatus.FORBIDDEN, "Accès refusé : compte non administrateur.");
        }
        if (file.isEmpty()) {
            return error(HttpStatus.BAD_REQUEST, "Le fichier est vide.");
        }
        if (file.getSize() > MAX_BYTES) {
            // HttpStatus.PAYLOAD_TOO_LARGE est déprécié depuis Spring 7 (renommé côté RFC) ;
            // on passe par le code numérique pour rester compatible avec toutes les versions.
            return error(HttpStatus.valueOf(413), "Image trop volumineuse (5 Mo maximum).");
        }
        String extension = EXTENSIONS.get(file.getContentType());
        if (extension == null) {
            return error(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Format non supporté (JPG, PNG, WEBP ou GIF).");
        }

        // Nom généré : on ne réutilise jamais le nom envoyé par le client.
        String filename = UUID.randomUUID() + "." + extension;
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, uploadDir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            return error(HttpStatus.INTERNAL_SERVER_ERROR, "Échec de l'enregistrement de l'image.");
        }

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/").path(filename).toUriString();
        return ResponseEntity.ok(Map.of("url", url));
    }

    private ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}