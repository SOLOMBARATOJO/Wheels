export default function Footer() {
  return (
    <footer className="mw-footer">
      <div className="mw-footer-grid">
        <div>
          <h4>Nos agences</h4>
          <p>Trouvez l'agence la plus proche</p>
          <a className="f-item f-gold" href="/#contact">📍 Voir la carte des agences</a>
        </div>
        <div>
          <h4>Supports</h4>
          <a className="f-item" href="tel:+261348524671">+261 34 8524671</a>
          <a className="f-item" href="tel:+261330876780">+261 33 0876780</a>
          <a className="f-item f-gold" href="mailto:madawheels-madagascar@madauto.mg">madawheels-madagascar@madauto.mg</a>
        </div>
        <div>
          <h4>Liens utiles</h4>
          <a className="f-item" href="/#faq">Bon à savoir</a>
          <a className="f-item" href="/#faq">FAQ</a>
          <a className="f-item" href="/#contact">A propos de nous</a>
          <a className="f-item" href="/#contact">Contactez-nous</a>
        </div>
        <div>
          <h4>Suivez-nous</h4>
          <p>Restez informés de nos offres spéciales et nouveaux véhicules</p>
          <div className="mw-social">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="LinkedIn">in</a>
            <a href="#" aria-label="Instagram">ig</a>
            <a href="#" aria-label="YouTube">▶</a>
          </div>
        </div>
      </div>
      <div className="mw-footer-bottom">
        <div className="mw-footer-bottom-inner">
          <span>Copyright © MADAWHEELS</span>
          <span>
            <a href="/#contact" style={{ color: "inherit" }}>Conditions générales</a>
            <span style={{ margin: "0 12px" }}>·</span>
            <a href="/#contact" style={{ color: "inherit" }}>Politique de protection des données</a>
          </span>
        </div>
      </div>
    </footer>
  );
}