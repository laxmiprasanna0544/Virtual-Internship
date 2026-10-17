import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDomain } from "@/data/domains";
import { readJson, requireStudent } from "@/lib/server/auth";
import { getSql, pgCode, UNIQUE_VIOLATION, withUser } from "@/lib/server/db";

const visibility = z.object({
  readiness: z.boolean(),
  projects: z.boolean(),
  assessments: z.boolean(),
  badges: z.boolean(),
  certificate: z.boolean(),
  contact: z.boolean(),
});

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("ensure") }),
  z.object({
    action: z.literal("update"),
    headline: z.string().max(200).optional(),
    about: z.string().max(4000).optional(),
    slug: z.string().regex(/^[a-z0-9-]{3,64}$/, "Use at least 3 letters or numbers for your profile address.").optional(),
    published: z.boolean().optional(),
    visibility: visibility.optional(),
  }),
]);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** Creates the student's Career Passport, or updates it. */
export async function POST(req: NextRequest) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;
  const parsed = body.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const input = parsed.data;

  if (input.action === "ensure") {
    const [me] = await withUser(userId, (tx) => tx<{ full_name: string; domain_id: string | null; has: boolean }[]>`
      select p.full_name, s.domain_id,
             exists (select 1 from public.career_passports cp where cp.student_id = p.id) as has
      from public.profiles p join public.students s on s.id = p.id where p.id = ${userId}`);
    if (me?.has) return NextResponse.json({ ok: true });
    const domain = getDomain(me?.domain_id);
    const base = slugify(me?.full_name ?? "").padEnd(3, "0") || "student";
    const headline = domain ? `${domain.shortName} intern · Roystian Foundation` : "Roystian Foundation intern";
    // Other students' passports are hidden by RLS, so which slugs are taken is
    // checked as the owner (slugs are public addresses, not private data).
    const taken = new Set(
      (await getSql()<{ slug: string }[]>`
        select slug from public.career_passports where slug = ${base} or slug like ${base + "-%"}`).map((r) => r.slug),
    );
    let n = 1;
    const next = () => {
      let slug = n === 1 ? base : `${base}-${n}`;
      while (taken.has(slug)) slug = `${base}-${++n}`;
      taken.add(slug);
      return slug;
    };
    // A concurrent sign-up can still take the slug between the check and the insert.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await withUser(userId, (tx) => tx`
          insert into public.career_passports (student_id, slug, headline)
          values (${userId}, ${next()}, ${headline})
          on conflict (student_id) do nothing`);
        return NextResponse.json({ ok: true });
      } catch (error) {
        if (pgCode(error) !== UNIQUE_VIOLATION) throw error;
      }
    }
    return NextResponse.json({ error: "Could not create your passport. Please try again." }, { status: 500 });
  }

  try {
    const rows = await withUser(userId, (tx) => tx`
      update public.career_passports
      set headline = coalesce(${input.headline ?? null}, headline),
          about = coalesce(${input.about ?? null}, about),
          slug = coalesce(${input.slug ?? null}, slug),
          published = coalesce(${input.published ?? null}, published),
          visibility = coalesce(${input.visibility ? tx.json(input.visibility) : null}, visibility)
      where student_id = ${userId}
      returning student_id`);
    if (!rows.length) return NextResponse.json({ error: "Create your passport first." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (pgCode(error) === UNIQUE_VIOLATION) {
      return NextResponse.json({ error: "That profile address is already taken." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not save your passport." }, { status: 500 });
  }
}
