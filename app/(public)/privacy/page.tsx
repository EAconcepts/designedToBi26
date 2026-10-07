export default function PrivacyPage() {
  const sections = [
    [
      'What we collect',
      'Your name, RSVP details, optional contact information, dietary notes, gift receipt details and any photographs you choose to share.',
    ],
    [
      'How we use it',
      'Only to manage our guest list, arrange the celebration, send confirmations, process gifts and moderate the private gallery.',
    ],
    [
      'How long we keep it',
      'Sensitive planning data such as dietary notes will be removed after the celebration. Payment records may be retained where required.',
    ],
    [
      'Your choices',
      'You may ask us to correct or delete your information by contacting Shola Mass or Adeola using the details on your invitation.',
    ],
  ];

  return (
    <div className="route-page legal-page paper-section">
      <article>
        <p className="section-kicker">A thoughtful promise</p>
        <h1>
          Your privacy,
          <br />
          <em>held with care.</em>
        </h1>
        <p className="legal-intro">
          We collect only what we need to host you well and plan our celebration.
        </p>

        {sections.map(([title, body]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}

        <p className="legal-date">Last updated · October 2026</p>
      </article>
    </div>
  );
}
