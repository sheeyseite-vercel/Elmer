import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { addDays } from "@/lib/analytics/dashboard";
import { normalizeTerm } from "@/lib/schema/keywords";
import { chunk, metricDocId, todayInMadrid } from "@/lib/data/metrics";
import { leadDocId } from "@/lib/data/leads";
import { taskDocId } from "@/lib/data/profile";
import { termDocId } from "@/lib/data/search-terms";
import { METRICS } from "@/lib/metrics";

export const demoBusinessId = (uid: string) => `demo_${uid}`;

/** Everything below is INVENTED and lives only in a separate business marked isDemo. */
const PURGE = ["performance_metrics", "tracked_keywords", "rank_checks", "lead_aggregates", "reviews", "search_terms", "profile_tasks", "ai_reports", "imports", "data_sources", "competitors", "competitor_snapshots"];

export async function purgeDemo(uid: string) {
  const db = adminDb();
  const id = demoBusinessId(uid);
  for (const name of PURGE) {
    for (;;) {
      const snap = await db.collection(name).where("businessId", "==", id).limit(400).get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
  await db.collection("business_profiles").doc(id).delete();
}

export async function seedDemo(uid: string) {
  await purgeDemo(uid); // always start from a clean, known state
  const db = adminDb();
  const id = demoBusinessId(uid);
  const now = new Date().toISOString();
  const today = todayInMadrid();

  await db.collection("business_profiles").doc(id).set({
    name: "DEMO – Fictional Clinic", city: "Madrid", address: "", serviceArea: "", primaryLanguage: "en",
    phone: "", website: "", bookingUrl: "", profileUrl: "", latitude: 40.4168, longitude: -3.7038,
    reportingCadence: "weekly", isDemo: true, ownerUid: uid, memberUids: [uid],
    timezone: "Europe/Madrid", currency: "EUR", createdAt: now, updatedAt: now,
  });

  // 90 days of daily counts: weekday pattern plus pseudo-random noise (deterministic).
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const base: Record<string, number> = { profile_views: 40, search_appearances: 160, calls: 5, website_clicks: 9, direction_requests: 4 };
  const writes: { ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }[] = [];
  for (let i = 1; i <= 90; i++) {
    const date = addDays(today, -i);
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    const weekday = dow === 0 || dow === 6 ? 0.55 : 1;
    const growth = 1 + (90 - i) / 400;
    for (const m of METRICS) {
      const value = Math.max(0, Math.round((base[m.key] ?? 5) * weekday * growth * (0.75 + rnd() * 0.5)));
      writes.push({
        ref: db.collection("performance_metrics").doc(metricDocId(id, m.key, date, "manual")),
        data: { businessId: id, metric: m.key, value, unit: "count", granularity: "day", periodStart: date, periodEnd: date, sourceKind: "manual", sourceId: "demo", createdAt: now },
      });
    }
  }

  const kw = [
    { term: "osteópata madrid", language: "es", targetArea: "Madrid", positions: [9, 7, 5] },
    { term: "osteopath madrid", language: "en", targetArea: "Madrid", positions: [null, 14, 11] },
    { term: "dolor lumbar", language: "es", targetArea: "Madrid", positions: [4, 4, 6] },
  ] as const;
  for (const k of kw) {
    const ref = db.collection("tracked_keywords").doc();
    writes.push({
      ref,
      data: {
        term: k.term, language: k.language, targetArea: k.targetArea, surface: "maps", group: "", tags: [], notes: "DEMO",
        termKey: normalizeTerm(k.term, k.language, k.targetArea), businessId: id, status: "active", createdAt: now, updatedAt: now,
      },
    });
    k.positions.forEach((position, idx) => {
      const day = addDays(today, -(40 - idx * 14));
      writes.push({
        ref: db.collection("rank_checks").doc(),
        data: {
          businessId: id, keywordId: ref.id, keyword: k.term, checkedAt: `${day}T10:00:00.000Z`,
          locationLabel: "DEMO – city centre", lat: 40.4168, lng: -3.7038, device: "mobile", surface: "maps",
          position, depth: 20, competitors: [{ name: "DEMO Clinic A", position: 1 }, { name: "DEMO Clinic B", position: 2 }],
          methodology: "DEMO data, not a real check", referenceUrl: "", source: "demo", createdAt: now,
        },
      });
    });
  }

  const m0 = `${today.slice(0, 7)}-01`;
  const prevEnd = addDays(m0, -1);
  const prevStart = `${prevEnd.slice(0, 7)}-01`;
  const lead = (start: string, end: string, source: string, calls: number, inquiries: number, bookings: number) =>
    writes.push({ ref: db.collection("lead_aggregates").doc(leadDocId(id, start, end, source)), data: { businessId: id, periodStart: start, periodEnd: end, source, calls, inquiries, bookings, entry: "demo", updatedAt: now } });
  lead(prevStart, prevEnd, "phone", 38, 38, 24);
  lead(prevStart, prevEnd, "website", 0, 17, 6);

  const rev = (n: number, date: string, rating: number, text: string, topics: string[], replyStatus: string) =>
    writes.push({ ref: db.collection("reviews").doc(`${id}_r${n}`), data: { businessId: id, reviewDate: date, rating, excerpt: text, topics, replyStatus, replyDraft: "", entry: "demo", createdAt: now, updatedAt: now } });
  rev(1, addDays(today, -3), 5, "DEMO: Friendly and on time.", ["friendliness"], "needs_reply");
  rev(2, addDays(today, -12), 2, "DEMO: Waited a long time.", ["wait time"], "needs_reply");
  rev(3, addDays(today, -30), 4, "DEMO: Clear explanations.", ["communication"], "replied");

  const month = prevEnd.slice(0, 7);
  const demoTerms: [string, number | null][] = [["osteópata madrid", 120], ["dolor lumbar", 64], ["demo fictional clinic", 31], ["osteópata cerca de mí", null]];
  demoTerms.forEach(([phrase, n]) =>
    writes.push({
      ref: db.collection("search_terms").doc(termDocId(id, month, phrase)),
      data: { businessId: id, month, phrase, belowThreshold: n === null, ...(n !== null ? { impressions: n } : {}), source: "manual", updatedAt: now },
    }));

  writes.push({
    ref: db.collection("profile_tasks").doc(taskDocId(id, "hours")),
    data: { businessId: id, itemKey: "hours", status: "complete", priority: "medium", dueDate: "", note: "", updatedAt: now },
  });

  for (const part of chunk(writes, 400)) {
    const batch = db.batch();
    part.forEach((w) => batch.set(w.ref, w.data));
    await batch.commit();
  }
}
