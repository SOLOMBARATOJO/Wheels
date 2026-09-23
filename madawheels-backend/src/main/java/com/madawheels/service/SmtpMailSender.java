package com.madawheels.service;

import com.madawheels.entity.Reservation;
import com.madawheels.entity.User;
import com.madawheels.entity.Vehicle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

import javax.net.ssl.SSLSocketFactory;

/**
 * Envoie l'email de récapitulatif de réservation en parlant directement le
 * protocole SMTP sur une connexion {@link java.net.Socket} (pas de librairie
 * JavaMail). C'est la preuve « socket : communication client / serveur »
 * demandée par le cours : le serveur ouvre un Socket TCP vers un serveur SMTP
 * et dialogue en EHLO/AUTH LOGIN/MAIL FROM/RCPT TO/DATA.
 */
@Component
public class SmtpMailSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpMailSender.class);

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Value("${smtp.host:localhost}")
    private String host;

    @Value("${smtp.port:2525}")
    private int port;

    @Value("${smtp.enabled:false}")
    private boolean enabled;

    @Value("${smtp.from:no-reply@madauto.mg}")
    private String from;

    @Value("${smtp.username:}")
    private String username;

    @Value("${smtp.password:}")
    private String password;

    /**
     * Envoie le récapitulatif. Retourne true si le serveur SMTP a accepté le
     * message (code 250 après DATA). Ne jette pas d'exception métier : en cas
     * d'échec réseau on loggue et on retourne false pour ne pas bloquer la
     * réservation.
     */
    public boolean sendConfirmationEmail(Reservation r, Vehicle v, User u) {
        return sendConfirmationEmail(r, v, u, java.util.List.of());
    }

    /**
     * Envoie le récapitulatif, avec le détail des options/assurances choisies.
     */
    public boolean sendConfirmationEmail(Reservation r, Vehicle v, User u,
                                         java.util.List<ReservationService.OptionLine> optionLines) {

        if (!enabled) {
            log.warn("SMTP désactivé (smtp.enabled=false), email de confirmation non envoyé.");
            return false;
        }

        String subject = "Récapitulatif de votre réservation";
        String htmlBody = buildEmailHtml(r, v, u, optionLines);
        return sendHtml(u.getFirstName() + " " + u.getLastName(), u.getEmail(), subject, htmlBody,
                "Email de confirmation envoyé à " + u.getEmail() + " pour la référence " + r.getReference());
    }

    /**
     * Envoie le code de vérification à 6 chiffres pour l'activation du compte
     * après l'inscription. Le code est valable jusqu'à la date d'expiration
     * mentionnée dans le message.
     */
    public boolean sendVerificationEmail(String firstName, String lastName, String email,
                                         String code, LocalDateTime expiry) {
        if (!enabled) {
            log.warn("SMTP désactivé (smtp.enabled=false), email de vérification non envoyé.");
            return false;
        }

        String htmlBody = "<div style=\"font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#F4F5F7;"
                + "color:#1A1A1A;max-width:640px;margin:0 auto;\">"
                + "<div style=\"background:#111214;color:#fff;padding:20px 28px;display:flex;"
                + "align-items:center;gap:10px;\">"
                + "<span style=\"background:#F5B301;width:34px;height:34px;border-radius:8px;"
                + "display:inline-block;text-align:center;line-height:34px;font-size:18px;\">🚗</span>"
                + "<span style=\"font-weight:800;font-size:20px;\">MadaWheels</span>"
                + "<span style=\"color:#F5B301;font-size:11px;font-weight:700;letter-spacing:1px;\">MADAGASCAR</span>"
                + "</div>"
                + "<div style=\"background:#fff;padding:28px;border-radius:0 0 14px 14px;\">"
                + "<h2 style=\"margin:0 0 6px;font-size:20px;\">Confirmez votre inscription</h2>"
                + "<p style=\"margin:0 0 18px;line-height:1.6;\">Bonjour " + htmlEscape(firstName)
                + " " + htmlEscape(lastName) + ",<br/>"
                + "Merci d'avoir rejoint MadaWheels. Pour activer votre compte, "
                + "saisissez le code de vérification ci-dessous :</p>"
                + "<div style=\"background:#FAFAFA;border:1px solid #E5E7EB;border-radius:12px;"
                + "text-align:center;padding:22px;margin:0 0 18px;font-size:40px;font-weight:800;"
                + "letter-spacing:14px;color:#111214;\">" + code + "</div>"
                + "<p style=\"margin:0 0 18px;line-height:1.6;\">Ce code est valable jusqu'au "
                + expiry.format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm"))
                + ". Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer ce message.</p>"
                + "<p style=\"line-height:1.6;\">L'équipe MadaWheels vous souhaite une excellente expérience.</p>"
                + "</div>"
                + "<div style=\"background:#111214;color:#9a9a9a;padding:18px 28px;font-size:12px;\">"
                + "<strong style=\"color:#fff;\">MadaWheels</strong> · Antananarivo, Madagascar · "
                + "+261 34 00 000 00 · contact@madauto.mg<br/>"
                + "© 2026 MadaWheels — Tous droits réservés.<br/>"
                + "Ce message est généré automatiquement, merci de ne pas y répondre."
                + "</div>"
                + "</div>";

        return sendHtml(firstName + " " + lastName, email, "Votre code de vérification MadaWheels",
                htmlBody, "Email de vérification envoyé à " + email);
    }

    /**
     * Ouvre une connexion SMTP explicite (SSL/TLS sur Socket) et écrit le
     * message HTML fourni. Vraie « communication client / serveur via Socket »
     * exigée par le cours : EHLO, AUTH LOGIN, MAIL FROM, RCPT TO, DATA.
     */
    private boolean sendHtml(String recipientName, String toEmail, String subject,
                             String htmlBody, String logSuccess) {
        // Connexion SMTP avec chiffrement implicite TLS (SMTPS) : on ouvre un
        // SSLSocket obtenu via SSLSocketFactory. Un SSLSocket EST un java.net.Socket
        // (héritage), donc la clause try-with-resources reste valide et on satisfait
        // l'exigence « communication client/serveur via Socket ».
        try (Socket socket = SSLSocketFactory.getDefault().createSocket(host, port)) {
            socket.setSoTimeout(10000);

            BufferedReader in = new BufferedReader(
                    new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
            PrintWriter out = new PrintWriter(socket.getOutputStream(), true, StandardCharsets.UTF_8);

            // 220 ready
            check(readResponse(in), "220", "réponse d'accueil");

            // EHLO
            sendCommand(out, "EHLO madawheels.local");
            check(readResponse(in), "250", "EHLO");

            // AUTH LOGIN (optionnel — seulement si un identifiant est configuré)
            if (username != null && !username.isBlank()) {
                sendCommand(out, "AUTH LOGIN");
                check(readResponse(in), "334", "AUTH LOGIN");
                sendCommand(out, Base64.getEncoder().encodeToString(stripSpaces(username).getBytes(StandardCharsets.UTF_8)));
                check(readResponse(in), "334", "identifiant AUTH");
                sendCommand(out, Base64.getEncoder().encodeToString(stripSpaces(password).getBytes(StandardCharsets.UTF_8)));
                check(readResponse(in), "235", "mot de passe AUTH");
            }

            // MAIL FROM / RCPT TO
            sendCommand(out, "MAIL FROM:<" + from + ">");
            check(readResponse(in), "250", "MAIL FROM");
            sendCommand(out, "RCPT TO:<" + toEmail + ">");
            check(readResponse(in), "250", "RCPT TO");

            // DATA
            sendCommand(out, "DATA");
            check(readResponse(in), "354", "DATA");

            String header = "From: MadaWheels <" + from + ">\r\n"
                    + "To: " + recipientName + " <" + toEmail + ">\r\n"
                    + "Subject: " + subject + "\r\n"
                    + "MIME-Version: 1.0\r\n"
                    + "Content-Type: text/html; charset=UTF-8\r\n"
                    + "Content-Transfer-Encoding: 8bit\r\n"
                    + "\r\n";

            // Tout point en début de ligne doit être doublé dans le corps DATA.
            String data = header + htmlBody.replace("\r\n.\r\n", "\r\n..\r\n");
            out.print(data);
            if (!data.endsWith("\r\n")) {
                out.print("\r\n");
            }
            out.print(".\r\n");
            out.flush();

            check(readResponse(in), "250", "DATA");

            sendCommand(out, "QUIT");
            readResponse(in);

            log.info(logSuccess + " via socket {}:{}", host, port);
            return true;

        } catch (IOException e) {
            log.warn("Échec de l'envoi SMTP vers {}:{} : {}", host, port, e.getMessage());
            return false;
        }
    }

    private static String stripSpaces(String s) {
        return s == null ? "" : s.replaceAll("\\s", "");
    }

    private void sendCommand(PrintWriter out, String command) {
        out.print(command + "\r\n");
        out.flush();
    }

    private String readResponse(BufferedReader in) throws IOException {
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = in.readLine()) != null) {
            sb.append(line).append("\n");
            // Fin de réponse : « 250 » + un espace (et non « 250- » pour un multi-réponses).
            if (line.length() >= 4
                    && Character.isDigit(line.charAt(0))
                    && Character.isDigit(line.charAt(1))
                    && Character.isDigit(line.charAt(2))
                    && line.charAt(3) == ' ') {
                break;
            }
        }
        return sb.toString();
    }

    private void check(String response, String expectedCode, String step) throws IOException {
        if (response == null || response.length() < 3
                || !response.startsWith(expectedCode)) {
            throw new IOException(
                    "SMTP " + step + " : réponse inattendue « " + loggable(response) + " »");
        }
    }

    private String loggable(String response) {
        return response == null ? "" : response.replace("\n", " ").trim();
    }

    private String buildEmailHtml(Reservation r, Vehicle v, User u,
                                  java.util.List<ReservationService.OptionLine> optionLines) {
        String vehicleLabel = v.getBrand() + " " + v.getModel();
        String period = "Du " + r.getStartDate().format(DATE_FMT)
                + " au " + r.getEndDate().format(DATE_FMT);
        int days = Math.max(1,
                (int) java.time.temporal.ChronoUnit.DAYS.between(r.getStartDate(), r.getEndDate()));

        StringBuilder optionsHtml = new StringBuilder();
        if (!optionLines.isEmpty()) {
            optionsHtml.append("<table style=\"width:100%;border-collapse:collapse;margin-bottom:18px;\">")
                    .append("<tr><th colspan=\"4\" style=\"text-align:left;background:#F5B301;")
                    .append("padding:8px 12px;border:1px solid #E5E7EB;\">Options et assurances</th></tr>");
            for (ReservationService.OptionLine line : optionLines) {
                optionsHtml.append("<tr>")
                        .append("<td style=\"padding:8px 12px;border:1px solid #E5E7EB;width:45%;\">")
                        .append(htmlEscape(line.name()))
                        .append("</td>")
                        .append("<td style=\"padding:8px 12px;border:1px solid #E5E7EB;\">x")
                        .append(line.quantity())
                        .append("</td>")
                        .append("<td style=\"padding:8px 12px;border:1px solid #E5E7EB;width:25%;\">")
                        .append(line.unitPrice())
                        .append(" € sur ").append(days)
                        .append(days > 1 ? " jours" : " jour")
                        .append("</td>")
                        .append("<td style=\"padding:8px 12px;border:1px solid #E5E7EB;text-align:right;\">")
                        .append(line.totalPrice())
                        .append(" €</td>")
                        .append("</tr>");
            }
            optionsHtml.append("</table>");
        }

        return "<div style=\"font-family:Segoe UI,Arial,Helvetica,sans-serif;background:#F4F5F7;"
                + "color:#1A1A1A;max-width:640px;margin:0 auto;\">"
                + "<div style=\"background:#111214;color:#fff;padding:20px 28px;display:flex;"
                + "align-items:center;gap:10px;\">"
                + "<span style=\"background:#F5B301;width:34px;height:34px;border-radius:8px;"
                + "display:inline-block;text-align:center;line-height:34px;font-size:18px;\">🚗</span>"
                + "<span style=\"font-weight:800;font-size:20px;\">MadaWheels</span>"
                + "<span style=\"color:#F5B301;font-size:11px;font-weight:700;letter-spacing:1px;\">MADAGASCAR</span>"
                + "</div>"
                + "<div style=\"background:#fff;padding:28px;border-radius:0 0 14px 14px;\">"
                + "<h2 style=\"margin:0 0 6px;font-size:20px;\">Récapitulatif de votre réservation</h2>"
                + "<p style=\"margin:0 0 18px;font-weight:700;\">Référence : " + r.getReference() + "</p>"
                + "<p style=\"margin:0 0 18px;line-height:1.6;\">Bonjour " + htmlEscape(u.getFirstName())
                + " " + htmlEscape(u.getLastName()) + ",<br/>"
                + "Nous vous remercions pour votre réservation. Voici le récapitulatif de votre location :</p>"
                + "<table style=\"width:100%;border-collapse:collapse;margin-bottom:18px;\">"
                + "<tr><th colspan=\"2\" style=\"text-align:left;background:#F5B301;"
                + "padding:8px 12px;border:1px solid #E5E7EB;\">Détails de la réservation</th></tr>"
                + row("Véhicule", vehicleLabel)
                + row("Période", period + " (" + days + (days > 1 ? " jours)" : " jour)"))
                + row("Lieu de départ", r.getDeparture())
                + row("Lieu de retour", r.getReturnLocation())
                + "</table>"
                + optionsHtml
                + "<table style=\"width:100%;border-collapse:collapse;margin-bottom:18px;\">"
                + "<tr><th colspan=\"2\" style=\"text-align:left;background:#F5B301;"
                + "padding:8px 12px;border:1px solid #E5E7EB;\">Montant estimé</th></tr>"
                + row("Véhicule", r.getVehiclePrice() + " €")
                + row("Options", r.getOptionsPrice() + " €")
                + "<tr><th style=\"text-align:left;background:#FAFAFA;padding:8px 12px;"
                + "border:1px solid #E5E7EB;\">Total</th>"
                + "<td style=\"padding:8px 12px;border:1px solid #E5E7EB;font-weight:700;\">"
                + r.getTotalPrice() + " €</td></tr>"
                + "</table>"
                + "<table style=\"width:100%;border-collapse:collapse;margin-bottom:18px;\">"
                + "<tr><th colspan=\"2\" style=\"text-align:left;background:#F5B301;"
                + "padding:8px 12px;border:1px solid #E5E7EB;\">Informations client</th></tr>"
                + row("Nom", u.getFirstName() + " " + u.getLastName())
                + row("Email", u.getEmail())
                + row("Téléphone", u.getPhone() != null ? u.getPhone() : "-")
                + "</table>"
                + "<p style=\"line-height:1.6;\">Pour toute question concernant votre réservation, "
                + "n'hésitez pas à nous contacter en mentionnant votre référence de réservation. "
                + "Nous vous souhaitons un excellent séjour,<br/><strong>L'équipe de location.</strong></p>"
                + "</div>"
                + "<div style=\"background:#111214;color:#9a9a9a;padding:18px 28px;font-size:12px;\">"
                + "<strong style=\"color:#fff;\">MadaWheels</strong> · Antananarivo, Madagascar · "
                + "+261 34 00 000 00 · contact@madauto.mg<br/>"
                + "© 2026 MadaWheels — Tous droits réservés.<br/>"
                + "Ce message est généré automatiquement, merci de ne pas y répondre."
                + "</div>"
                + "</div>";
    }

    private String row(String label, String value) {
        return "<tr><th style=\"text-align:left;background:#FAFAFA;padding:8px 12px;"
                + "border:1px solid #E5E7EB;width:40%;vertical-align:top;\">"
                + htmlEscape(label) + "</th>"
                + "<td style=\"padding:8px 12px;border:1px solid #E5E7EB;\">"
                + htmlEscape(value) + "</td></tr>";
    }

    private String htmlEscape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}