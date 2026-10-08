import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Refund terms for the Roystian Foundation Self-Paced and Industry-Led virtual internship programmes.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      updated="16 September 2026"
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
            "Duplicate charges and amounts debited against a failed registration are refunded in full once verified.",
          ],
        },
        {
          heading: "How to request a refund",
          paragraphs: [
            "Send the registration ID and the reason for the request to the programme team. Approved refunds are returned to the original payment method.",
          ],
        },
        {
          heading: "Demo environment",
          paragraphs: [
            "No real payments are processed in this demonstration environment, so no real refunds can occur. Payment records shown here are simulated.",
          ],
        },
      ]}
    />
  );
}
