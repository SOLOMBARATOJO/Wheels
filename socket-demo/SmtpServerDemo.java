import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Démo « socket : communication client / serveur ».
 *
 * Petit serveur SMTP receveur basé sur un ServerSocket TCP brut (même principe
 * que ServerSocketDemo). Le backend MadaWheels (SmtpMailSender.java) s'y
 * connecte en Socket et envoie l'email de confirmation de réservation.
 *
 * Usage :
 *   javac SmtpServerDemo.java
 *   java SmtpServerDemo [port]        (défaut : 2525)
 *
 * Les emails reçus sont affichés dans la console et sauvegardés dans le
 * dossier socket-demo/received-mails/.
 */
public class SmtpServerDemo {

    private static final DateTimeFormatter TS =
            DateTimeFormatter.ofPattern("HH:mm:ss.SSS");

    public static void main(String[] args) throws IOException {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 2525;
        Path outDir = Paths.get("received-mails");
        Files.createDirectories(outDir);

        System.out.println("=== Serveur SMTP de démonstration (Socket TCP) ===");
        System.out.println("En attente d'emails sur le port " + port + " ...");

        try (ServerSocket serverSocket = new ServerSocket(port)) {
            while (true) {
                Socket client = serverSocket.accept();
                handleClient(client, outDir);
            }
        }
    }

    private static void handleClient(Socket client, Path outDir) {
        System.out.println("[SMTP] Connexion de " + client.getInetAddress()
                + " à " + LocalDateTime.now().format(TS));
        try (BufferedReader in = new BufferedReader(
                new InputStreamReader(client.getInputStream()));
             PrintWriter out = new PrintWriter(client.getOutputStream(), true)) {

            out.println("220 madawheels-smtp ESMTP démo prête");

            StringBuilder message = new StringBuilder();
            boolean inData = false;
            String from = "";
            String to = "";
            String line;

            while ((line = in.readLine()) != null) {
                if (inData) {
                    if (line.equals(".")) {
                        inData = false;
                        message.append("\n");
                        String content = message.toString();
                        String file = outDir.resolve("email-"
                                + LocalDateTime.now().format(TS).replace(":", "").replace(".", "_")
                                + ".eml").toString();
                        Files.write(Paths.get(file), content.getBytes());
                        System.out.println("[SMTP] ===== EMAIL REÇU =====");
                        System.out.println(content);
                        System.out.println("[SMTP] ==== FIN EMAIL ====");
                        System.out.println("[SMTP] Sauvegardé : " + file);
                        out.println("250 OK message accepté");
                    } else {
                        message.append(line).append("\n");
                    }
                    continue;
                }

                String upper = line.toUpperCase();
                if (upper.startsWith("EHLO")) {
                    out.println("250-madawheels-smtp");
                    out.println("250 AUTH LOGIN");
                } else if (upper.startsWith("AUTH")) {
                    handleAuth(in, out);
                } else if (upper.startsWith("MAIL FROM:")) {
                    from = trimAddress(line);
                    out.println("250 OK");
                } else if (upper.startsWith("RCPT TO:")) {
                    to = trimAddress(line);
                    out.println("250 OK");
                } else if (upper.equals("DATA")) {
                    inData = true;
                    out.println("354 Commencez l'envoi du message ; terminez par <CRLF>.<CRLF>");
                } else if (upper.equals("QUIT")) {
                    out.println("221 Au revoir");
                    break;
                } else {
                    out.println("250 OK");
                }
            }
            System.out.println("[SMTP] Connexion fermée (" + from + " -> " + to + ")");
        } catch (IOException e) {
            System.err.println("[SMTP] Erreur : " + e.getMessage());
        }
    }

    private static void handleAuth(BufferedReader in, PrintWriter out) throws IOException {
        out.println("334 VXNlcm5hbWU6");                      // base64("Username:")
        if (in.readLine() != null) out.println("334 UGFzc3dvcmQ6");  // base64("Password:")
        if (in.readLine() != null) out.println("235 Authentification réussie");
    }

    private static String trimAddress(String line) {
        int lt = line.indexOf('<');
        int gt = line.indexOf('>');
        return (lt >= 0 && gt > lt) ? line.substring(lt + 1, gt) : line;
    }
}