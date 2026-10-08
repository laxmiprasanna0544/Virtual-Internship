import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How the Roystian Foundation virtual internship platform handles participant information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="16 September 2026"
      intro="This policy describes what information the platform collects, why it is collected, and how it is used."
      sections={[
        {
          heading: "Information we collect",
          paragraphs: [
            "Registration collects the information required to run the programme and issue a credential.",
          ],
          bullets: [
            "Identity and contact details: name, email address and mobile number",
            "Education details: education level, college or institution, course and city",
            "Programme data: domain, experience level, programme selected and registration reference",
            "Learning data: module completion, assessment attempts and scores, and practical task submissions",
          ],
        },
        {
          heading: "How information is used",
          paragraphs: [
            "Information is used to deliver the programme, track completion requirements, issue and verify certificates, and send programme communications such as registration confirmation, reminders and completion notices.",
          ],
        },
        {
          heading: "Certificate verification",
          paragraphs: [
            "The public verification page displays the participant name, domain, programme, duration, issue date and certificate status. It does not display contact details, assessment scores or submission content.",
          ],
        },
        {
          heading: "Demo environment",
          paragraphs: [
            "In this demonstration environment, all data is stored locally in your own browser using localStorage. Nothing is transmitted to a server, and clearing your browser storage removes it entirely. Every student record shown by default is demo data.",
          ],
        },
        {
          heading: "Retention and removal",
          paragraphs: [
            "Programme records are retained for as long as needed to support certificate verification. Participants may request removal of their personal details by contacting the programme team; verification records may be retained in a reduced form so that issued certificates remain checkable.",
          ],
        },
        {
          heading: "Contact",
          paragraphs: [
            "Privacy questions can be raised with the programme team using the contact details published on this site.",
          ],
        },
      ]}
    />
  );
}
