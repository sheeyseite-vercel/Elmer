"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/badges";
import { PRESETS, PROVIDER_KINDS, type ProviderKind, type ProviderView } from "@/lib/ai/providers";
import { activateProvider, deleteProvider, saveProvider, testProvider, type ProviderState } from "./actions";

export function ProviderManager({ providers, encryptionReady }: { providers: ProviderView[]; encryptionReady: boolean }) {
  const [editing, setEditing] = useState<ProviderView | "new" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(fn: () => Promise<ProviderState>) {
    setNotice(null);
    start(async () => {
      const r = await fn();
      if (r.message) setNotice(r.message);
    });
  }

  return (
    <div className="space-y-4">
      {!encryptionReady && (
        <Card role="alert" className="border-warning/50">
          <p className="text-sm">
            <strong>ENCRYPTION_KEY is missing on the server.</strong> Providers cannot be saved until it is set.
          </p>
        </Card>
      )}

      {providers.length === 0 && editing === null && (
        <Card className="text-center">
          <p className="font-semibold">No provider yet</p>
          <p className="mt-1 text-sm text-muted">Add Gemini, Groq, OpenRouter or any OpenAI-compatible provider.</p>
        </Card>
      )}

      {providers.map((p) => (
        <Card key={p.id} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{p.label}</CardTitle>
            {p.active ? <StatusBadge tone="success">Active</StatusBadge> : <StatusBadge>Inactive</StatusBadge>}
          </div>
          <dl className="grid gap-1 text-sm text-muted">
            <div>Type: {PRESETS[p.kind].label}</div>
            <div>Model: <span className="text-text">{p.model}</span></div>
            <div>Key: •••• {p.keyLast4}</div>
            <div className="break-all">URL: {p.baseUrl}</div>
            {p.lastTest && (
              <div className={p.lastTest.ok ? "text-success" : "text-danger"}>
                Last test: {p.lastTest.detail} ({new Date(p.lastTest.at).toLocaleString()})
              </div>
            )}
          </dl>
          <div className="flex flex-wrap gap-2">
            {!p.active && (
              <Button disabled={pending} onClick={() => run(() => activateProvider(p.id))}>Use this provider</Button>
            )}
            <Button variant="secondary" disabled={pending} onClick={() => run(() => testProvider(p.id))}>Test</Button>
            <Button variant="secondary" disabled={pending} onClick={() => setEditing(p)}>Edit</Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => {
                if (window.confirm(`Delete "${p.label}"? Its saved key will be removed.`)) run(() => deleteProvider(p.id));
              }}
            >
              Delete
            </Button>
          </div>
        </Card>
      ))}

      {notice && <p role="status" className="text-sm text-muted">{notice}</p>}

      {editing === null ? (
        <Button className="w-full" disabled={!encryptionReady} onClick={() => setEditing("new")}>
          Add provider
        </Button>
      ) : (
        <ProviderForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ProviderForm({ initial, onClose }: { initial: ProviderView | null; onClose: () => void }) {
  const [kind, setKind] = useState<ProviderKind>(initial?.kind ?? "gemini");
  const [label, setLabel] = useState(initial?.label ?? PRESETS.gemini.label);
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? PRESETS.gemini.baseUrl);
  const [model, setModel] = useState(initial?.model ?? PRESETS.gemini.model);
  const [state, action, pending] = useActionState<ProviderState, FormData>(saveProvider, {});
  const e = state.errors ?? {};

  function pickKind(next: ProviderKind) {
    setKind(next);
    // Presets fill the fields; the owner can still edit everything.
    setLabel(PRESETS[next].label);
    setBaseUrl(PRESETS[next].baseUrl);
    setModel(PRESETS[next].model);
  }

  return (
    <form action={action} className="space-y-4">
      <Card className="space-y-4">
        <CardTitle>{initial ? `Edit ${initial.label}` : "Add provider"}</CardTitle>
        {initial && <input type="hidden" name="id" value={initial.id} />}
        <SelectField
          label="Provider"
          name="kind"
          value={kind}
          onChange={(ev) => pickKind(ev.target.value as ProviderKind)}
          options={PROVIDER_KINDS.map((k) => ({ value: k, label: PRESETS[k].label }))}
          error={e.kind}
        />
        <TextField label="Name" name="label" value={label} onChange={(ev) => setLabel(ev.target.value)} error={e.label} required />
        <TextField label="Base URL" name="baseUrl" inputMode="url" value={baseUrl} onChange={(ev) => setBaseUrl(ev.target.value)} error={e.baseUrl} required hint="Must be a public https:// address." />
        <TextField label="Model" name="model" value={model} onChange={(ev) => setModel(ev.target.value)} error={e.model} required hint="Model names change; edit this if a default is retired." />
        <TextField
          label={initial ? "New API key (leave empty to keep the current one)" : "API key"}
          name="apiKey"
          type="password"
          autoComplete="off"
          error={e.apiKey}
          required={!initial}
        />
        {state.message && (
          <p role="alert" className={state.ok ? "text-sm text-success" : "text-sm text-danger"}>{state.message}</p>
        )}
      </Card>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>{state.ok ? "Close" : "Cancel"}</Button>
        <Button type="submit" className="flex-1" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );
}
