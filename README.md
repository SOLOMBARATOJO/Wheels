markdown
# 🚐 MadaWheels

Application Client/Serveur Java avec Web Service SOAP — projet universitaire (Java avancé).

Démonstration de :
- communication Client ↔ Serveur
- Web Service **SOAP** avec messages XML
- accès à une base **PostgreSQL** depuis le serveur
- communication à distance (HTTP/TCP)
- démonstration indépendante d'un **Socket TCP**

---

## 🏗️ Architecture

CLIENT (React)
↓ HTTP + SOAP/XML
WEB SERVICE SOAP (Spring Boot)
↓ JPA / SQL
PostgreSQL (mada_wheels)


Le client ne communique **jamais directement** avec la base de données — tout passe par le Web Service SOAP.

---

## 📁 Structure du dépôt

MadaWheels/
├── madawheels-backend/ → Spring Boot + Spring-WS + PostgreSQL (Java 21)
├── madawheels-frontend/ → React + TypeScript + Vite
└── socket-demo/ → Démo indépendante Socket TCP (ServerSocket / Socket)


---

## ⚙️ Prérequis

| Outil | Version |
|---|---|
| Java JDK | 21 |
| Maven | 3.9+ |
| PostgreSQL | 14+ |
| Node.js | 18+ |

---

## 🚀 Démarrage rapide

### 1. Cloner le dépôt

```bash
git clone https://github.com/TsioryRaph/Madawheels.git
cd Madawheels
```

### 2. Base de données PostgreSQL

Créer la base et la table (voir `madawheels-backend/src/main/resources/vehicles.xsd` pour le contrat SOAP) :

```sql
CREATE DATABASE mada_wheels;

CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    departure VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO vehicles (name, type, price, departure, destination, available) VALUES
('Toyota Hiace', 'Minibus', 150000, 'Antananarivo', 'Antsirabe', true),
('Mercedes Sprinter', 'Minibus', 200000, 'Antananarivo', 'Antsirabe', true),
('Toyota Coaster', 'Bus', 250000, 'Antananarivo', 'Antsirabe', false),
('Hyundai County', 'Minibus', 180000, 'Antananarivo', 'Fianarantsoa', true);
```

### 3. Backend (Spring Boot)

```bash
cd madawheels-backend
```

Configurer `src/main/resources/application.properties` avec ton mot de passe PostgreSQL local (fichier non versionné dans certains setups — vérifier avant de commit un mot de passe réel).

```bash
mvn clean install
mvn spring-boot:run
```

- API SOAP : `http://localhost:8080/ws`
- WSDL : `http://localhost:8080/ws/vehicles.wsdl`

### 4. Frontend (React)

Dans un autre terminal :

```bash
cd madawheels-frontend
npm install
npm run dev
```

- App : `http://localhost:5173`

### 5. Démo Socket TCP (indépendante, optionnelle)

Dans deux terminaux séparés :

```bash
cd socket-demo
javac ServerSocketDemo.java
javac SocketClientDemo.java

# Terminal 1
java ServerSocketDemo

# Terminal 2
java SocketClientDemo
```

---

## 🧪 Tests SOAP rapides (Postman / curl)

**POST** `http://localhost:8080/ws`
**Header** : `Content-Type: text/xml`

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                   xmlns:veh="http://www.madawheels.com/vehicles">
    <soapenv:Header/>
    <soapenv:Body>
        <veh:searchVehiclesRequest>
            <veh:departure>Antananarivo</veh:departure>
            <veh:destination>Antsirabe</veh:destination>
            <veh:date>2026-09-25</veh:date>
            <veh:time>08:00</veh:time>
        </veh:searchVehiclesRequest>
    </soapenv:Body>
</soapenv:Envelope>
```

---

## 🤝 Workflow de collaboration

```bash
git pull origin main          # récupérer les derniers changements
# ... faire ses modifications ...
git add .
git commit -m "description claire du changement"
git push origin main
```

⚠️ Toujours faire `git pull` avant de commencer à travailler, pour éviter les conflits.

---

## 📌 Stack technique

**Backend** : Java 21 · Spring Boot 4 · Spring Web Services · Spring Data JPA · Hibernate · PostgreSQL · Maven

**Frontend** : React · TypeScript · Vite

**Communication** : SOAP/XML (contract-first via XSD) — pas de REST

