import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { SITE } from "@/data/content";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How the Roystian Foundation virtual internship platform collects, stores and uses participant information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="11 October 2026"
      intro="This policy describes what information the Roystian Foundation virtual internship platform collects, why it is collected, where it is stored and the choices you have."
      sections={[
        {
          heading: "Information we collect",
          paragraphs: [
            "We collect the information needed to run the programme, process your fee and issue a credential.",
          ],
          bullets: [
            "Account details: name, email address and password (the password is held by our sign-in provider and is never visible to us)",
            "Contact and education details: mobile number, education level, college or institution, course and city",
            "Programme data: domain, experience level, programme selected, registration reference and payment status",
            "Learning data: module completion, notes, assessment attempts and scores, practical task and project submissions, including files you upload",
            "Career tools data you choose to create: resume and LinkedIn drafts, mock interview answers, challenge entries, scholarship and fellowship applications, and your Career Passport",
          ],
        },
        {
          heading: "How information is used",
          paragraphs: [
            "Information is used to deliver the programme, track completion requirements, review your work, issue and verify certificates, process payments and refunds, and send programme communications such as registration confirmation, account security codes, review outcomes and completion notices.",
            "Trainers see the records of students in the domains they teach. A college placement cell sees the progress of students who list that college. Partner organisations see only Career Passports that a student has chosen to publish.",
          ],
        },
        {
          heading: "Where your data is stored",
          paragraphs: [
            "The platform is hosted on DigitalOcean in its Bangalore, India data centre. Your account and programme records are stored in a managed PostgreSQL database and uploaded files in private object storage, both in that data centre. Passwords are stored only as salted one-way hashes, and sign-in sessions can be revoked at any time. Emails are delivered by Resend. Data is encrypted in transit and at rest.",
          ],
        },
        {
          heading: "Payments",
          paragraphs: [
            "Programme fees are processed by Cashfree Payments. Card, UPI and net banking details are entered on Cashfree's checkout and handled by Cashfree; Roystian Foundation does not receive or store them. We keep the order reference, amount, payment status and payment method type so that registrations and refunds can be reconciled.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "The platform uses only essential cookies: secure, httpOnly session cookies that keep you signed in. We do not use advertising or tracking cookies. Your onboarding progress may be kept in your browser's local storage until you finish registering.",
          ],
        },
        {
          heading: "Certificate verification and public profiles",
          paragraphs: [
            "The public verification page displays the participant name, domain, programme, duration, issue date and certificate status. It does not display contact details, assessment scores or submission content.",
            "A Career Passport is private until you publish it, and only the sections you switch on are shown.",
          ],
        },
        {
          heading: "Retention",
          paragraphs: [
            "Account and programme records are kept while your account is active and for as long as needed to support certificate verification, resolve disputes and meet accounting obligations for payment records. Uploaded files are kept for the duration of the programme review and may be deleted afterwards.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "You can view and correct your profile details from your dashboard. You may ask for a copy of your data, for corrections, or for your account to be deleted. On deletion we remove your personal details; a minimal record of any issued certificate may be kept so that it remains verifiable, and payment records are kept where the law requires.",
          ],
        },
        {
          heading: "Contact",
          paragraphs: [`Privacy questions and requests can be sent to ${SITE.email}.`],
        },
      ]}
    />
  );
}
