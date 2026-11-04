import Link from "next/link";

const HomePage = () => (
  <main id="contenu" className="page">
    <h1>Autour de moi</h1>
    <p>
      Prix des carburants, équipements sportifs et risques près de chez vous, à
      partir des données ouvertes de l&apos;État.
    </p>
    <ul>
      <li>
        <Link href="/carburants/">Prix des carburants</Link>
      </li>
    </ul>
  </main>
);

export default HomePage;
