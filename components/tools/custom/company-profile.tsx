'use client';

import type { CompanyResponse } from '@FiveElmsCapital/five-elms-ts-sdk';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import { useState } from 'react';
import { Globe, Linkedin, LineChart, ChevronDown, ChevronUp, Building2, Users, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CompanyProfileProps {
  profile?: {
    profile: CompanyResponse;
    summary: string;
  } | null;
  isLoading?: boolean;
}

// Type guard to check if the response is a valid CompanyResponse
function isValidCompanyResponse(profile: any): profile is CompanyResponse {
  return (
    profile &&
    typeof profile === 'object' &&
    'company' in profile &&
    typeof profile.company === 'string'
  );
}

// Helper function to safely format dates
function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return isValid(date) ? format(date, 'MMM d, yyyy') : 'N/A';
}

// Helper function to format scores
function formatScore(score: number | string | null): string {
  if (score === null) return 'N/A';
  return typeof score === 'number' ? score.toFixed(1) : score;
}

export function CompanyProfile({ profile, isLoading = false }: CompanyProfileProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Show loading state
  if (isLoading || typeof profile === 'undefined') {
    return (
      <Card className="w-full p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <p>Loading company information...</p>
        </div>
      </Card>
    );
  }

  // Handle empty or invalid response
  if (!profile || !profile.profile || !isValidCompanyResponse(profile.profile)) {
    return (
      <Card className="w-full p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="size-5" />
          <p>No company information found</p>
        </div>
      </Card>
    );
  }

  const companyData = profile.profile;

  return (
    <div className="flex flex-col gap-4 rounded-2xl p-6 bg-card text-card-foreground shadow-sm">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold">{companyData.company}</h3>
          <div className="flex gap-3">
            {companyData.website && (
              <a 
                href={companyData.website}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <Globe className="size-4" />
              </a>
            )}
            {companyData.linkedin && (
              <a 
                href={companyData.linkedin}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <Linkedin className="size-4" />
              </a>
            )}
            {companyData.crunchbase_link && (
              <a 
                href={companyData.crunchbase_link}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <LineChart className="size-4" />
              </a>
            )}
          </div>
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

      {/* Quick Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Location</span>
            <span className="text-sm font-medium">
              {[companyData.city, companyData.state_province].filter(Boolean).join(', ')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Staff Size</span>
            <span className="text-sm font-medium">{companyData.staff_size.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">Founded</span>
          <span className="text-sm font-medium">{companyData.year_founded}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">Funding</span>
          <span className="text-sm font-medium">{companyData.funding_status}</span>
        </div>
      </div>

      {/* Scores and Description */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">LISA Rank</span>
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

          {companyData.last_post_call_score && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Post Call Score</span>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {formatScore(companyData.last_post_call_score)}
              </div>
            </div>
          )}

          {companyData.last_call_quality_score && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Quality Score</span>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {formatScore(companyData.last_call_quality_score)}
              </div>
            </div>
          )}
        </div>

        {companyData.company_description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {companyData.company_description}
          </p>
        )}
      </div>

      {/* Expandable Section */}
      <div className="mt-2 pt-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full flex justify-between items-center"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>Interaction History</span>
          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Interaction Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Total Interactions</span>
                <span className="text-sm font-medium">{companyData.instances}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Last Activity</span>
                <span className="text-sm font-medium">{formatDate(companyData.last_activity)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Total Calls</span>
                <span className="text-sm font-medium">{companyData.total_calls}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Total Emails</span>
                <span className="text-sm font-medium">{companyData.total_emails}</span>
              </div>
            </div>

            {/* Contact Info */}
            {(companyData.first_name || companyData.last_name) && (
              <div className="pt-4 border-t border-border">
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

            {/* Funding Details */}
            {companyData.total_funding > 0 && (
              <div className="pt-4 border-t border-border">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Funding</span>
                    <span className="text-sm font-medium">
                      ${companyData.total_funding.toLocaleString()}
                    </span>
                  </div>
                  {companyData.last_funding_on && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Last Funding Date</span>
                      <span className="text-sm font-medium">
                        {formatDate(companyData.last_funding_on)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 