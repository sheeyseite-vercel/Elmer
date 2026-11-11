"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { saveBusinessProfile, type OnboardingState } from "./actions";

type Defaults = Record<string, string | undefined>;

const CAN = [
  "Import Google Business Profile CSV exports and show their aggregated numbers, labelled with the source.",
  "Record your own manual rank checks (keyword, place, device, Maps or Search) as point-in-time observations.",
  "Track public competitor information you enter, with the date it was checked.",
  "Show which numbers are missing instead of filling gaps.",
];
const CANNOT = [
  "Identify individual searchers or explain why a person chose a listing.",
  "Show a permanent or universal Google ranking. A rank check is one observation at one place and time.",
  "Guarantee higher rankings or more customers.",
  "Access competitors' private analytics, or store patient or health information.",
];

export function OnboardingWizard({ defaults }: { defaults?: Defaults }) {
  const [step, setStep] = useState(defaults ? 1 : 0);
  const [state, action, pending] = useActionState<OnboardingState, FormData>(saveBusinessProfile, {});
  const e = state.errors ?? {};
  const d = defaults ?? {};

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted">Step {step + 1} of 2</p>
        <h1 className="text-2xl font-semibold">{step === 0 ? "What this app can and cannot measure" : "Confirm your business details"}</h1>
      </div>

      {step === 0 && (
        <>
          <Card>
            <CardTitle>It can</CardTitle>
            <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm text-muted">
              {CAN.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </Card>
          <Card>
            <CardTitle>It cannot</CardTitle>
            <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm text-muted">
              {CANNOT.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </Card>
          <Button className="w-full" onClick={() => setStep(1)}>Continue</Button>
        </>
      )}

      {/* Keep the form mounted-but-hidden is unnecessary; render only on step 1 */}
      {step === 1 && (
        <form action={action} className="space-y-4">
          <p className="text-sm text-muted">
            Enter only what you can confirm. Nothing is pre-filled or assumed; you can edit these later in Settings.
          </p>
          <Card className="space-y-4">
            <TextField label="Business name" name="name" required defaultValue={d.name ?? "Elmer Osteopatia"} error={e.name} />
            <TextField label="City or area" name="city" required defaultValue={d.city} error={e.city} />
            <TextField label="Address (optional)" name="address" autoComplete="street-address" defaultValue={d.address} error={e.address} />
            <TextField label="Service area (optional)" name="serviceArea" defaultValue={d.serviceArea} error={e.serviceArea} />
            <SelectField
              label="Primary language"
              name="primaryLanguage"
              defaultValue={d.primaryLanguage ?? "en"}
              options={[{ value: "en", label: "English" }, { value: "es", label: "Español" }]}
              error={e.primaryLanguage}
            />
            <TextField label="Phone (optional)" name="phone" type="tel" defaultValue={d.phone} error={e.phone} />
            <TextField label="Website (optional)" name="website" type="url" inputMode="url" placeholder="https://" defaultValue={d.website} error={e.website} />
            <TextField label="Booking URL (optional)" name="bookingUrl" type="url" inputMode="url" placeholder="https://" defaultValue={d.bookingUrl} error={e.bookingUrl} />
            <TextField label="Google Business Profile URL (optional)" name="profileUrl" type="url" inputMode="url" placeholder="https://" defaultValue={d.profileUrl} error={e.profileUrl} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Latitude (optional)" name="latitude" inputMode="decimal" defaultValue={d.latitude} error={e.latitude} hint="Used for the geo map." />
              <TextField label="Longitude (optional)" name="longitude" inputMode="decimal" defaultValue={d.longitude} error={e.longitude} />
            </div>
            <SelectField
              label="Reporting"
              name="reportingCadence"
              defaultValue={d.reportingCadence ?? "weekly"}
              options={[
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "both", label: "Weekly and monthly" },
              ]}
              error={e.reportingCadence}
            />
            <p className="text-xs text-muted">Timezone: Europe/Madrid · Currency: EUR</p>
          </Card>
          {state.message && <p role="alert" className="text-sm text-danger">{state.message}</p>}
          <div className="flex gap-3">
            {!defaults && <Button type="button" variant="secondary" onClick={() => setStep(0)}>Back</Button>}
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? "Saving…" : "Save and continue"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
