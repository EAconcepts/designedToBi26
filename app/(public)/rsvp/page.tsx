'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { RsvpPrefillProvider, useRsvpPrefill } from '@/components/forms/RsvpPrefillProvider';
import { SITE } from '@/content/site.config';

function RsvpContent() {
  const { guest } = useRsvpPrefill();
  const [step, setStep] = useState(1);
  const [complete, setComplete] = useState(false);
  const [attending, setAttending] = useState<'yes' | 'no'>('yes');
  const [customName, setCustomName] = useState<string | null>(null);
  const householdName = customName ?? guest?.displayName ?? '';
  const [guestNames, setGuestNames] = useState('');
  const [dietary, setDietary] = useState('');
  const [songRequest, setSongRequest] = useState('');
  const [note, setNote] = useState('');
  const [email, setEmail] = useState('');

  const next = (event: FormEvent) => {
    event.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      setComplete(true);
    }
  };

  const primaryContact = SITE.rsvpContacts[0];

  return (
    <div className="route-page">
      <div className="form-page paper-section">
        <aside className="form-page__aside rsvp-aside">
          <div>
            <p className="section-kicker section-kicker--gold">Your invitation</p>
            <h1>
              Kindly
              <br />
              <em>respond</em>
            </h1>
            <p>We’ve saved a place for you. Please reply by 5 December 2026.</p>
          </div>
          <div className="steps">
            {['Your household', 'Events & details', 'A note for us'].map((label, index) => (
              <span className={step >= index + 1 ? 'active' : ''} key={label}>
                <b>{index + 1}</b>
                {label}
              </span>
            ))}
          </div>
          {primaryContact && (
            <small>
              Need help? {primaryContact.name} · {primaryContact.tel}
            </small>
          )}
        </aside>

        <section className="form-page__main">
          {complete ? (
            <div className="form-success">
              <div className="locked-seal">AE</div>
              <p className="section-kicker">Response received</p>
              <h2>We’re so glad you’ll be there.</h2>
              <p>
                A confirmation will be kept with our planning team. Add the solemnization to your
                calendar so the date stays close.
              </p>
              <div>
                <a
                  className="button button--magenta"
                  href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Adetolani%20%26%20Abiodun%20Wedding&dates=20261219T100000Z/20261219T150000Z&location=Methodist%20Church%20Olorunsogo-GeriAlimi%20Ilorin"
                  target="_blank"
                  rel="noreferrer"
                >
                  Add to calendar
                </a>
                <Link href="/" className="button button--glass" style={{ color: 'var(--ink)' }}>
                  Return home
                </Link>
              </div>
            </div>
          ) : (
            <form className="editorial-form" onSubmit={next}>
              <div className="form-heading">
                <span>0{step}</span>
                <div>
                  <p className="section-kicker">Step {step} of 3</p>
                  <h2>
                    {step === 1
                      ? 'Who’s joining us?'
                      : step === 2
                        ? 'Choose your moments'
                        : 'One last thing'}
                  </h2>
                </div>
              </div>

              {step === 1 && (
                <>
                  <label>
                    Household name
                    <input
                      required
                      placeholder="The Adeyemi Family"
                      value={householdName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </label>
                  <fieldset>
                    <legend>Will you be able to attend?</legend>
                    <label className="choice-card">
                      <input
                        type="radio"
                        name="attending"
                        required
                        checked={attending === 'yes'}
                        onChange={() => setAttending('yes')}
                      />
                      <span>
                        <b>Joyfully accepts</b>We’ll be there to celebrate
                      </span>
                    </label>
                    <label className="choice-card">
                      <input
                        type="radio"
                        name="attending"
                        checked={attending === 'no'}
                        onChange={() => setAttending('no')}
                      />
                      <span>
                        <b>Regretfully declines</b>Sending our love from afar
                      </span>
                    </label>
                  </fieldset>
                  <label>
                    Guest names
                    <textarea
                      rows={3}
                      placeholder={'First guest\nSecond guest'}
                      value={guestNames}
                      onChange={(e) => setGuestNames(e.target.value)}
                    />
                  </label>
                </>
              )}

              {step === 2 && (
                <>
                  <fieldset>
                    <legend>Events you’ll attend</legend>
                    <label className="choice-card">
                      <input type="checkbox" defaultChecked />
                      <span>
                        <b>Solemnization</b>19 December · 11:00am
                      </span>
                    </label>
                    <label className="choice-card">
                      <input type="checkbox" defaultChecked />
                      <span>
                        <b>Reception</b>19 December · Time to be announced
                      </span>
                    </label>
                  </fieldset>
                  <label>
                    Dietary notes
                    <textarea
                      rows={3}
                      placeholder="Allergies or dietary requirements"
                      value={dietary}
                      onChange={(e) => setDietary(e.target.value)}
                    />
                  </label>
                </>
              )}

              {step === 3 && (
                <>
                  <label>
                    Your dance-floor request
                    <input
                      placeholder="A song that always gets you dancing"
                      value={songRequest}
                      onChange={(e) => setSongRequest(e.target.value)}
                    />
                  </label>
                  <label>
                    A private note to the couple
                    <textarea
                      rows={5}
                      placeholder="Share your wishes, memories or advice..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </label>
                  <label>
                    Email for confirmation
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                </>
              )}

              <div className="form-actions">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(step - 1)} className="button">
                    Back
                  </button>
                )}
                <button className="button button--magenta" type="submit">
                  {step === 3 ? 'Send our response' : 'Continue'} <span>→</span>
                </button>
              </div>

              <p className="privacy-hint">
                Your details are used only to plan the celebration.{' '}
                <Link href="/privacy">Privacy notice</Link>
              </p>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

export default function RsvpPage() {
  return (
    <RsvpPrefillProvider>
      <RsvpContent />
    </RsvpPrefillProvider>
  );
}
