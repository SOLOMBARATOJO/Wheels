import java.io.*;
import java.net.*;

public class ServerSocketDemo {

    public static void main(String[] args) {
        int port = 6000;

        System.out.println("=== Serveur Socket TCP ===");
        System.out.println("Démarrage sur le port " + port + "...");

        try (ServerSocket serverSocket = new ServerSocket(port)) {
            System.out.println("Serveur en attente de connexion...");

            // accept() bloque le programme jusqu'à ce qu'un client se connecte
            Socket clientSocket = serverSocket.accept();
            System.out.println("Client connecté : " + clientSocket.getInetAddress());

            BufferedReader in = new BufferedReader(
                    new InputStreamReader(clientSocket.getInputStream()));
            PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true);

            String messageRecu = in.readLine();
            System.out.println("Message reçu du client : " + messageRecu);

            String reponse = "Bonjour client";
            out.println(reponse);
            System.out.println("Réponse envoyée : " + reponse);

            clientSocket.close();
            System.out.println("Connexion fermée.");

        } catch (IOException e) {
            System.err.println("Erreur serveur : " + e.getMessage());
        }
    }
}