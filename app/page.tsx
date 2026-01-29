export default function Home() {
  return (
    <>
      <section className="card">
        <h1 className="h1">Eat healthier. Plan smarter. Live better.</h1>
        <p className="sub">
          HealthFlow turns your day, meals, and shopping into one calm, clear plan — with a low-UPF focus and simple nutrition insight.
        </p>

        <div className="btnRow">
          <a className="btn" href="/app">Try HealthFlow</a>
          <a className="btn secondary" href="/app">Create my plan</a>
        </div>
      </section>

      <section className="card">
        <h3>What you get</h3>
        <ul>
          <li>One clear daily plan</li>
          <li>Low-UPF meals (based on your preference)</li>
          <li>Shopping list you can copy and print</li>
          <li>Simple nutrition notes</li>
          <li>Favourites for personalisation</li>
        </ul>
      </section>

      <section className="card">
        <h3>Disclaimer</h3>
        <p className="sub">
          HealthFlow provides general lifestyle guidance and does not replace professional medical advice.
        </p>
      </section>
    </>
  );
}
