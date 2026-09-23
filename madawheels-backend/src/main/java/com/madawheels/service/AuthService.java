package com.madawheels.service;

import com.madawheels.entity.User;
import com.madawheels.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Authentification : inscription, envoi du code de vérification à 6 chiffres
 * par email, activation du compte puis connexion. Le mot de passe n'est
 * jamais stocké en clair : on conserve un hachage PBKDF2 (sel aléatoire).
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private static final Pattern EMAIL_RE = Pattern.compile(
            "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");

    private static final int CODE_TTL_MINUTES = 10;
    private static final int PBKDF2_ITERATIONS = 120_000;
    private static final int SALT_BYTES = 16;
    private static final int HASH_BITS = 256;

    private final UserRepository userRepository;
    private final SmtpMailSender smtpMailSender;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserRepository userRepository, SmtpMailSender smtpMailSender) {
        this.userRepository = userRepository;
        this.smtpMailSender = smtpMailSender;
    }

    public record RegisterResult(Long userId, String status, boolean emailSent, String message) {}

    /**
     * Crée le compte (statut PENDING) et envoie le code à 6 chiffres par email.
     * Si un compte existe déjà avec cet email et n'est pas encore activé, le
     * code est simplement régénéré. Si le compte est déjà actif, on refuse.
     */
    public RegisterResult register(String firstName, String lastName, String email,
                                   String phone, String password) {
        email = normalize(email);
        requireText(firstName, "Prénom requis");
        requireText(lastName, "Nom requis");
        requireText(email, "Adresse email requise");
        requireText(password, "Mot de passe requis");
        if (!EMAIL_RE.matcher(email).matches()) {
            throw new IllegalArgumentException("Adresse email invalide.");
        }
        if (password.length() < 4) {
            throw new IllegalArgumentException("Le mot de passe doit contenir au moins 4 caractères.");
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null && "ACTIVE".equals(user.getStatus())) {
            throw new IllegalArgumentException(
                    "Un compte existe déjà avec cette adresse email. Connectez-vous.");
        }

        if (user == null) {
            user = new User();
            user.setFirstName(cap(firstName));
            user.setLastName(cap(lastName));
            user.setEmail(email);
            user.setPhone(phone == null ? null : phone.trim());
            user.setRole("CLIENT");
            user.setPasswordHash(hashPassword(password));
        } else {
            // Compte créé en tant qu'invité (réservation) ou en attente de
            // vérification : on complète l'inscription maintenant.
            user.setFirstName(cap(firstName));
            user.setLastName(cap(lastName));
            user.setPhone(phone == null ? null : phone.trim());
            user.setPasswordHash(hashPassword(password));
        }

        // Nouveau code à 6 chiffres, valable TTL minutes.
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(CODE_TTL_MINUTES);
        user.setVerificationCode(String.format(Locale.ROOT, "%06d", random.nextInt(1_000_000)));
        user.setVerificationCodeExpiry(expiry);
        user.setStatus("PENDING");
        userRepository.save(user);

        boolean emailSent;
        try {
            emailSent = smtpMailSender.sendVerificationEmail(
                    user.getFirstName(), user.getLastName(), email,
                    user.getVerificationCode(), expiry);
        } catch (RuntimeException ex) {
            log.warn("Échec d'envoi du code de vérification à {} : {}", email, ex.getMessage());
            emailSent = false;
        }

        return new RegisterResult(user.getId(), user.getStatus(), emailSent,
                "Code de vérification envoyé à " + email + ".");
    }

    public record VerifyResult(boolean success, UserInfo user, String message) {}

    public record UserInfo(Long userId, String firstName, String lastName, String email,
                           String phone, String role, String status) {
        static UserInfo of(User u) {
            return new UserInfo(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(),
                    u.getPhone(), u.getRole(), u.getStatus());
        }
    }

    /**
     * Vérifie le code reçu par email et active le compte. Un compte déjà actif
     * est accepté tel quel (idempotent).
     */
    public VerifyResult verifyCode(String email, String code) {
        User user = findByActiveEmail(normalize(email));
        if ("ACTIVE".equals(user.getStatus())) {
            return new VerifyResult(true, UserInfo.of(user), "Compte déjà activé.");
        }
        if (code == null || user.getVerificationCode() == null
                || !user.getVerificationCode().equals(code.trim())) {
            throw new IllegalArgumentException("Code de vérification invalide.");
        }
        if (user.getVerificationCodeExpiry() == null
                || user.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(
                    "Le code de vérification a expiré. Relancez une inscription pour en recevoir un nouveau.");
        }

        user.setStatus("ACTIVE");
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        userRepository.save(user);

        return new VerifyResult(true, UserInfo.of(user), "Compte activé avec succès.");
    }

    public record LoginResult(boolean success, UserInfo user, String message) {}

    public LoginResult login(String email, String password) {
        User user = findByActiveEmail(normalize(email));
        if ("PENDING".equals(user.getStatus())) {
            throw new IllegalArgumentException(
                    "Veuillez d'abord vérifier votre adresse email avec le code reçu.");
        }
        if (user.getPasswordHash() == null || !matchesPassword(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Adresse email ou mot de passe incorrect.");
        }
        return new LoginResult(true, UserInfo.of(user), "Connexion réussie.");
    }

    public UserInfo getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));
        return UserInfo.of(user);
    }

    private User findByActiveEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Aucun compte trouvé pour cette adresse email."));
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private static String cap(String s) {
        if (s == null || s.isBlank()) return s;
        String t = s.trim();
        return Character.toUpperCase(t.charAt(0)) + t.substring(1).toLowerCase(Locale.ROOT);
    }

    private static void requireText(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(message);
        }
    }

    // ---------- Hachage PBKDF2 (format "pbkdf2$itérations$sel$hash") ----------

    private static final String PBKDF2_PREFIX = "pbkdf2";

    private String hashPassword(String password) {
        try {
            byte[] salt = new byte[SALT_BYTES];
            byte[] hash = pbkdf2(password, salt, PBKDF2_ITERATIONS);
            return PBKDF2_PREFIX + "$" + PBKDF2_ITERATIONS + "$"
                    + Base64.getEncoder().encodeToString(salt) + "$"
                    + Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new IllegalStateException("PBKDF2 indisponible.", e);
        }
    }

    private boolean matchesPassword(String password, String stored) {
        try {
            String[] parts = stored.split("\\$");
            if (parts.length != 4 || !PBKDF2_PREFIX.equals(parts[0])) {
                return false;
            }
            int iterations = Integer.parseInt(parts[1]);
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] expected = Base64.getDecoder().decode(parts[3]);
            byte[] actual = pbkdf2(password, salt, iterations);
            return MessageDigest.isEqual(expected, actual);
        } catch (RuntimeException | NoSuchAlgorithmException | InvalidKeySpecException e) {
            return false;
        }
    }

    private static byte[] pbkdf2(String password, byte[] salt, int iterations)
            throws NoSuchAlgorithmException, InvalidKeySpecException {
        if (salt.length == 0) {
            // Un sel vide ne devrait jamais arriver : on le régénère a minima.
            salt = new byte[]{'m', 'a', 'd', 'a'};
        }
        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt,
                iterations, HASH_BITS);
        return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
    }
}