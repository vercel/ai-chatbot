'use client';

import { CompanyProfileResponse } from '@FiveElmsCapital/five-elms-ts-sdk';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';

interface CompanyProfileProps {
  profile?: {
    profile: CompanyProfileResponse;
    summary: string;
  };
}

// Helper function to safely format dates
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return isValid(date) ? format(date, 'MMM d, yyyy') : 'N/A';
}

export function CompanyProfile({ profile }: CompanyProfileProps) {
  if (!profile?.profile) return null;

  const companyData = profile.profile;

  return (
    <div className="flex flex-col gap-4 rounded-2xl p-6 bg-card text-card-foreground shadow-sm">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold">{companyData.company}</h3>
          <a 
            href={companyData.website}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            {companyData.website}
          </a>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            {
              'bg-green-100 text-green-800': companyData.pipeline_status === 'Account',
              'bg-yellow-100 text-yellow-800': companyData.pipeline_status === 'Lead',
              'bg-blue-100 text-blue-800': companyData.pipeline_status === 'In Database',
            }
          )}>
            {companyData.pipeline_status}
          </div>
          <div className="text-sm text-muted-foreground">
            Added {formatDate(companyData.date_added_to_db)}
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Location</span>
          <span className="text-sm font-medium">
            {[companyData.city, companyData.state_province, companyData.country].filter(Boolean).join(', ')}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Founded</span>
          <span className="text-sm font-medium">{companyData.year_founded}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Staff Size</span>
          <span className="text-sm font-medium">{companyData.staff_size.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Funding Status</span>
          <span className="text-sm font-medium">{companyData.funding_status}</span>
        </div>
      </div>

      {/* Scores Section */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">LISA Score</span>
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            {
              'bg-green-100 text-green-800': companyData.lisa_rank === 'A',
              'bg-blue-100 text-blue-800': companyData.lisa_rank === 'B',
              'bg-yellow-100 text-yellow-800': companyData.lisa_rank === 'C',
              'bg-orange-100 text-orange-800': companyData.lisa_rank === 'D',
              'bg-red-100 text-red-800': companyData.lisa_rank === 'E',
            }
          )}>
            {companyData.lisa_rank} ({companyData.lisa_score.toFixed(1)})
          </div>
        </div>
        
        {companyData.total_funding > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Funding</span>
            <span className="text-sm font-medium">
              ${companyData.total_funding.toLocaleString()}
            </span>
          </div>
        )}

        {companyData.last_funding_on && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Last Funding Date</span>
            <span className="text-sm font-medium">
              {formatDate(companyData.last_funding_on)}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      {companyData.company_description && (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {companyData.company_description}
          </p>
        </div>
      )}

      {/* Contact Info */}
      {(companyData.first_name || companyData.last_name) && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Primary Contact</span>
            <span className="text-sm font-medium">
              {[companyData.first_name, companyData.last_name].filter(Boolean).join(' ')}
              {companyData.title && ` - ${companyData.title}`}
            </span>
            {companyData.email && (
              <a 
                href={`mailto:${companyData.email}`}
                className="text-sm text-primary hover:underline"
              >
                {companyData.email}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 