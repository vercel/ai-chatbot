import React from "react";
import IntentInput from "@/components/intent/IntentInput";
import LeadValidationCard from "@/components/lead/LeadValidationCard";
import { LeadValidationResult } from "@/lib/lead/types";

function JourneyClient() {
  "use client";
  const [result, setResult] = React.useState<LeadValidationResult | null>(null);

  return (
    <div className="mx-auto my-6 max-w-4xl space-y-6 p-4">
      <IntentInput
        layout="wide"
        onValidated={(r) => setResult(r)}
        submitMode="serverAction"
      />

      {result && <LeadValidationCard result={result} />}
    </div>
  );
}

export default function Page() {
  return <JourneyClient />;
}

