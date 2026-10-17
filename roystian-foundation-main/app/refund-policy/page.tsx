import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { SITE } from "@/data/content";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Refund terms for the Roystian Foundation Self-Paced and Industry-Led virtual internship programmes.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      updated="11 October 2026"
      intro="This policy explains when a programme fee can be refunded and how a refund request is processed."
      sections={[
        {
          heading: "Before the programme starts",
          paragraphs: [
            "A full refund is available if a refund request is made before any learning content has been accessed and before the programme start date for Industry-Led cohorts.",
          ],
        },
        {
          heading: "After the programme starts",
          paragraphs: [
            "Once learning content has been accessed, or once an Industry-Led cohort has begun, the fee is not refundable. This is because content, assessments and live sessions are made available in full at the start of the programme.",
            "A certificate is earned by completing the programme requirements; it is not purchased, and an unfinished programme is not grounds for a refund.",
          ],
        },
        {
          heading: "Programme cancellation",
          paragraphs: [
            "If a scheduled Industry-Led cohort is cancelled and no alternative date is acceptable to the participant, the fee is refunded in full.",
          ],
        },
        {
          heading: "Duplicate or failed payments",
          paragraphs: [
            "Duplicate charges, and amounts debited for a payment that did not complete a registration, are refunded in full once verified.",
          ],
        },
        {
          heading: "How to request a refund",
          paragraphs: [
            `Send your registration ID and the reason for the request to ${SITE.email}. We will confirm whether the request is approved.`,
          ],
        },
        {
          heading: "How refunds are paid",
          paragraphs: [
            "Payments are processed by Cashfree Payments, and approved refunds are issued through Cashfree to the original payment method. Refunds typically reach your account 5–7 working days after approval, depending on your bank or card issuer.",
            "Once a refund is issued, access to that programme's coursework ends.",
          ],
        },
      ]}
    />
  );
}
