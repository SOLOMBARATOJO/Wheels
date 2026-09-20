import java.io.*;
import java.net.*;

public class SocketClientDemo {

    public static void main(String[] args) {
        String host = "localhost";
        int port = 6000;

        System.out.println("=== Client Socket TCP ===");
        System.out.println("Connexion au serveur " + host + ":" + port + "...");

        try (Socket socket = new Socket(host, port)) {
            System.out.println("Connecté au serveur.");

            PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
            BufferedReader in = new BufferedReader(
                    new InputStreamReader(socket.getInputStream()));

            String message = "Bonjour serveur";
            out.println(message);
            System.out.println("Message envoyé : " + message);

            String reponse = in.readLine();
            System.out.println("Réponse du serveur : " + reponse);

        } catch (IOException e) {
            System.err.println("Erreur client : " + e.getMessage());
        }
    }
}