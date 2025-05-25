interface Listing {
  id: string;
  price: number;
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  imageUrl: string;
  propertyType: string;
  status: string;
}

interface ListingsProps {
  listings: Listing[];
}

export function Listings({ listings }: ListingsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-w-[900px] bg-background rounded-xl">
      {listings.map((listing) => (
        <div
          key={listing.id}
          className="flex flex-col bg-card rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow"
        >
          <img
            src={listing.imageUrl}
            alt={listing.address}
            className="w-full h-48 object-cover"
          />
          <div className="p-4 flex flex-col gap-2">
            <div className="text-xl font-semibold text-primary">
              {formatPrice(listing.price)}
            </div>
            <div className="text-sm text-muted-foreground">{listing.address}</div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{listing.beds} beds</span>
              <span>{listing.baths} baths</span>
              <span>{listing.sqft.toLocaleString()} sqft</span>
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-blue-600">{listing.propertyType}</span>
              <span className="text-green-600">{listing.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 