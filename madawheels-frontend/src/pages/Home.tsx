import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Users, Car, ShieldCheck, MapPin, Phone, Mail, Info } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchWidget from "../components/SearchWidget";
import { AGENCIES } from "../constants";
import type { SearchParams } from "../types/vehicle";

function toQuery(p: SearchParams): string {
  const params = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) params.set(k, String(v));
  });
  return params.toString();
}

const GUIDE_STEPS = [
  { n: 1, title: "Rechercher", text: "Choisissez votre lieu de départ, votre lieu de retour, vos dates, vos heures et l'âge du conducteur." },
  { n: 2, title: "Comparer", text: "Parcourez notre flotte, filtrez par type de véhicule, transmission, carburant et budget." },
  { n: 3, title: "Personnaliser", text: "Sélectionnez votre véhicule et ajoutez vos options : avec ou sans chauffeur." },
  { n: 4, title: "Devis", text: "Renseignez vos coordonnées et acceptez les conditions générales de vente." },
  { n: 5, title: "Confirmer", text: "Validez votre devis et recevez votre numéro de réservation par email sous 24h ouvrées." },
];

const FEATURES = [
  { icon: Users, title: "Avec chauffeur", text: "Service chauffeur inclus et professionnels compétents pour vos déplacements en ville comme hors de la ville." },
  { icon: Car, title: "Sans chauffeur", text: "Conduisez vous-même votre véhicule, en toute liberté, avec une assurance franchise incluse." },
  { icon: ShieldCheck, title: "Flotte récente", text: "INEOS Grenadier, HYUNDAI County, NISSAN Navara, RENAULT Logan : des véhicules entretenus et climatisés." },
];

export default function Home() {
  const navigate = useNavigate();
  const [params, setParams] = useState<SearchParams>({
    departure: "",
    returnLocation: "",
    startDate: "",
    startTime: "10:00",
    endDate: "",
    endTime: "10:00",
    driverAge: 23,
  });
  const [sameReturn, setSameReturn] = useState(false);

  const handleSearch = () => {
    const effective = sameReturn ? params.departure : params.returnLocation;
    if (!params.departure || !effective || !params.startDate || !params.endDate) {
      toast.error("Veuillez renseigner le lieu de départ, le lieu de retour et les deux dates pour lancer la recherche.");
      return;
    }
    navigate(`/reserver?${toQuery({ ...params, returnLocation: effective })}`);
  };

  return (
    <>
      <Header />

      <section className="mw-hero">
        <div className="mw-hero-bg" style={{ backgroundImage: "url(/hero.jpg)" }} />
        <div className="mw-hero-inner">
          <div>
            <div className="mw-eyebrow">Madawheels vous accompagne dans tous vos déplacements à Madagascar</div>
            <h1>Découvrez Madagascar avec nos locations de véhicules</h1>
            <p className="mw-hero-desc">
              De l'aéroport à votre hôtel, en passant par votre lieu de conférence ou votre bureau, notre équipe
              met à votre disposition un service de location de voiture avec chauffeurs professionnels, compétents
              et fiables.
            </p>
          </div>
          <div className="mw-hero-img-wrap">
            <img className="mw-hero-img" src="/hero.jpg" alt="Véhicules MadaWheels" />
            <motion.div
              className="mw-hero-badge"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <span><Car size={14} style={{ verticalAlign: -2, marginRight: 4 }} />Plusieurs</span> véhicules disponibles à Madagascar
            </motion.div>
          </div>
        </div>
      </section>

      <div className="mw-container">
        <SearchWidget
          values={params}
          onChange={setParams}
          onSearch={handleSearch}
          sameReturn={sameReturn}
          onSameReturn={(b) => {
            setSameReturn(b);
            if (b) setParams({ ...params, returnLocation: params.departure });
          }}
        />
      </div>

      <section className="mw-container" style={{ padding: "64px 24px 0" }}>
        <h2 className="mw-section-title" style={{ fontSize: 28, marginBottom: 12 }}>
          Comment réserver en ligne ?
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 24, maxWidth: 720 }}>
          Suivez le guide en 5 étapes simples pour réserver votre véhicule en ligne, comme chez les grands
          loueurs internationaux.
        </p>
        <div className="mw-guide">
          {GUIDE_STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              className="mw-guide-step"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
            >
              <div className="mw-guide-num">{s.n}</div>
              <div className="mw-guide-title">{s.title}</div>
              <p>{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="faq" className="mw-container" style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 760, marginBottom: 28 }}>
          <h2 className="mw-section-title" style={{ fontSize: 28, marginBottom: 12 }}>
            Pourquoi louer une voiture à Madagascar ?
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 18 }}>
            Louer une voiture à Madagascar, c'est choisir la liberté de vous déplacer à votre rythme. Nous vous
            proposons des véhicules adaptés à tous vos besoins, avec ou sans chauffeur. Un service de qualité
            toujours au meilleur prix.
          </p>
          <Link to="/vehicules" className="mw-btn">Découvrir notre flotte de véhicules →</Link>
        </div>
        <div className="mw-fleet-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="mw-fcard"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <div className="mw-fcard-body">
                <f.icon size={30} color="var(--mw-gold)" />
                <div className="mw-fcard-name" style={{ fontSize: 18, fontWeight: 700, color: "var(--mw-heading)" }}>
                  {f.title}
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6 }}>{f.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="contact" className="mw-container" style={{ padding: "64px 24px" }}>
        <h2 className="mw-section-title" style={{ fontSize: 28, marginBottom: 28 }}>
          Nos agences et contacts
        </h2>
        <div className="mw-contact-grid">
          <div>
            <h3 className="mw-section-label" style={{ fontSize: 15 }}>
              <MapPin size={15} style={{ verticalAlign: -2, marginRight: 6 }} />Nos agences
            </h3>
            <ul className="mw-contact-list">
              {AGENCIES.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
              Ouvert du lundi au samedi de 8h à 18h, et les jours de vols à l'aéroport.
            </p>
          </div>
          <div>
            <h3 className="mw-section-label" style={{ fontSize: 15 }}>
              <Phone size={15} style={{ verticalAlign: -2, marginRight: 6 }} />Assistance téléphonique
            </h3>
            <p className="mw-contact-item">+261 34 85 246 71</p>
            <p className="mw-contact-item">+261 33 087 67 80</p>
            <h3 className="mw-section-label" style={{ fontSize: 15, marginTop: 18 }}>
              <Mail size={15} style={{ verticalAlign: -2, marginRight: 6 }} />Email
            </h3>
            <p className="mw-contact-item">madawheels-madagascar@madauto.mg</p>
            <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 12 }}>
              Assistance disponible 24/24 · 7/7 pour la réservation et la modification de vos demandes.
            </p>
          </div>
          <div>
            <h3 className="mw-section-label" style={{ fontSize: 15 }}>
              <Info size={15} style={{ verticalAlign: -2, marginRight: 6 }} />Bon à savoir
            </h3>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>
              L'âge minimum pour conduire est de 23 ans. Un service chauffeur est disponible en ville comme hors
              de la ville. Chaque véhicule est entretenu, climatisé et assuré avec franchise incluse.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}