import React, { useState } from 'react';
import FinancingCard, {
  type FinancingOffer,
} from '../../../../../packages/ui-cards/FinancingCard';

interface FinancingPickerProps {
  offers: FinancingOffer[];
  onSave?: (offer: FinancingOffer) => void;
}

export function FinancingPicker({ offers, onSave }: FinancingPickerProps) {
  const [selected, setSelected] = useState<FinancingOffer | null>(null);
  const [detailsIndex, setDetailsIndex] = useState<number | null>(null);

  const handleSave = () => {
    if (selected) onSave?.(selected);
  };

  return (
    <div className="flex flex-col gap-4">
      {offers.map((offer, idx) => (
        <div key={offer.provider} className="border rounded p-2">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold">{offer.provider}</div>
              <div className="text-sm text-gray-600">
                {offer.rate.toFixed(2)}% · {offer.term}m · $
                {offer.monthly.toFixed(2)}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label={`select ${offer.provider}`}
                onClick={() => setSelected(offer)}
                className="px-2 py-1 border rounded"
              >
                {selected?.provider === offer.provider ? 'Selected' : 'Select'}
              </button>
              <button
                type="button"
                aria-label={`details ${offer.provider}`}
                onClick={() =>
                  setDetailsIndex(detailsIndex === idx ? null : idx)
                }
                className="px-2 py-1 border rounded"
              >
                View details
              </button>
            </div>
          </div>
          {detailsIndex === idx && (
            <div className="mt-2">
              <FinancingCard offers={[offer]} />
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={handleSave}
        disabled={!selected}
        className="px-3 py-2 border rounded self-start"
        aria-label="save selection"
      >
        Save
      </button>
    </div>
  );
}

export default FinancingPicker;
