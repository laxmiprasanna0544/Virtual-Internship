import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms governing use of the Roystian Foundation virtual internship platform.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated="16 September 2026"
      intro="These terms describe what the Roystian Foundation virtual internship programme provides, what is expected of participants, and what is explicitly not promised."
      sections={[
        {
          heading: "What the programme provides",
          paragraphs: [
            "Self-Paced enrolment provides access to the structured learning material, resources, module assessments, the practical activity and the final assessment for the selected domain and experience level, for the duration of the programme. It does not include video lessons, live sessions, mentor interaction, a guided project, career guidance or a PehlaChance subscription.",
            "Industry-Led enrolment provides everything in Self-Paced and additionally provides the 15-day structured live programme, video lessons, sessions with working professionals, mentor interaction and live Q&A, guided practical assignments, a guided project, career guidance and one month of PehlaChance access, as described on the programme page.",
          ],
        },
        {
          heading: "Certification",
          paragraphs: [
            "A completion certificate is issued only after all completion requirements are satisfied: profile completion, module completion, module assessments passed, the practical task submitted and reviewed, and the final assessment passed at the stated threshold.",
            "Payment alone does not entitle a participant to a certificate. Certificates record completed work.",
          ],
        },
        {
          heading: "What is not promised",
          paragraphs: [
            "The programme does not promise or guarantee employment, internships with any third-party organisation, or placement of any kind.",
          ],
          bullets: [
            "No guaranteed job",
            "No guaranteed placement",
            "No guaranteed internship with any company",
            "No claim of government, university or statutory accreditation is made",
          ],
        },
        {
          heading: "Participant responsibilities",
          paragraphs: [
            "Participants are expected to complete their own work. Submissions that are not the participant's own may be rejected and may result in the certificate being withheld or revoked.",
            "Account credentials must not be shared. Programme content is provided for individual learning use.",
          ],
        },
        {
          heading: "Changes to the programme",
          paragraphs: [
            "Curriculum content, schedules and trainers may be updated to keep material current. Material changes affecting an active cohort will be communicated to enrolled participants.",
          ],
        },
        {
          heading: "Contact",
          paragraphs: [
            "Questions about these terms can be sent to the programme team through the contact details published on this site.",
          ],
        },
      ]}
    />
  );
}
