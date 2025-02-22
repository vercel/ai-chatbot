declare module '@FiveElmsCapital/five-elms-ts-sdk' {
    export type DatabaseStatus =
      | "1. Key Accounts & Leads"
      | "2. Owned Accounts"
      | "3. Unowned Accounts"
      | "4. GIH Leads"
      | "5. In Database - Approved"
      | "6. In Database - Calibrating"
      | "7. In Database - Not Scored"
      | "8. In Database - Eliminated"
      | "9. Not Viable"
  
    export type ScaleScore = "A" | "B" | "C" | "D" | "E"
    export type ScaleScoreSetting = "lisa_rank" | "last_call_scale_score"
    export type PipelineStatus = "Account" | "Lead" | "In Database"
    export type Viability = "Viable" | "Not Viable"
    export type QualityScoreSetting = "average_fit_score" | "last_call_quality_score"
    
    export type QAStatus =
      | "QA3 - Approved"
      | "QA2 - Approved"
      | "QA2 - Eliminated"
      | "QA3 - Eliminated"
      | "QA2 - Status Unknown"
      | "QA3 - Status Unknown"
      | null
  
    export type SFStageGroup =
      | "Active"
      | "Closed"
      | "Do Not Contact"
      | "Follow-Up"
      | "Pre-Call"
      | "Unknown"
      | null
  
    export type SFOwnership = "Owned - Key" | "Owned" | "Unowned" | null
  
    export type FundingStatus =
      | "Public"
      | "Acquired"
      | "Closed"
      | "Over Funding Limit"
      | "No Funding"
      | "Undisclosed Funding"
      | "<$5mm"
      | "$5-10mm"
      | "$10-15mm"
      | ">$15mm"
  
    export type HighestLifetimeOppStage =
      | "Call Complete"
      | "New"
      | "Evaluation / Diligence"
      | "Pursue"
      | "Termsheet Submitted"
      | "Termsheet Signed"
      | "Closed Won"
      | null
  
    export interface CompanySearchRequest {
      database_status?: DatabaseStatus[]
      scale_score?: ScaleScore[]
      scale_score_setting?: ScaleScoreSetting[]
      pipeline_status?: PipelineStatus[]
      viability?: Viability[]
      quality_score?: Array<number | null>
      quality_score_setting?: QualityScoreSetting[]
      total_scores_range?: number[]
      qa_status?: QAStatus[]
      salesforce_stage_group?: SFStageGroup[]
      salesforce_ownership?: SFOwnership[]
      key?: boolean
      owner_name?: string[]
      last_activity_range?: Array<string | null>
      travel_city?: string[]
      state_province?: string[]
      country?: string[]
      funding_status?: FundingStatus[]
      total_funding_range?: number[]
      last_funding_on_age_range?: Array<string | null>
      year_founded_age_range_years?: number[]
      staff_size_range?: number[]
      staff_size_include_na?: boolean
      date_added_to_db_range?: Array<string | null>
      staff_size_date_range?: Array<string | null>
      instances?: number[]
      instances_delivered?: number[]
      instances_w_email?: number[]
      instances_w_reply?: number[]
      instances_w_call?: number[]
      instances_w_opportunity?: number[]
      last_email_date?: Array<string | null>
      last_reply_date?: Array<string | null>
      last_call_date?: Array<string | null>
      last_live_meeting_date?: Array<string | null>
      last_opportunity_date?: Array<string | null>
      highest_lifetime_opportunity_stage?: HighestLifetimeOppStage[]
      last_call_arr?: number[]
      last_call_percent_us_revenue?: number[]
      last_call_raise_amount?: number[]
      last_call_raise_date?: Array<string | null>
      range_filter_keep_na?: boolean
      sort_cols?: Record<string, "asc" | "desc">
    }
  
    export interface FiveElmsAPIClientConfig {
      baseUrl: string
      token: string
      timeout?: number
      maxRetries?: number
    }
  
    export interface CompanyResponse {
      fec_domain_id: string
      company: string
      website: string
      linkedin: string
      company_description: string
      year_founded: string
      city: string
      state_province: string
      country: string
      city_state: string
      travel_city: string
      database_status: DatabaseStatus
      lisa_score: number
      lisa_rank: ScaleScore
      viability: Viability
      pipeline_status: PipelineStatus
      salesforce_stage_group: SFStageGroup
      salesforce_ownership: SFOwnership
      review_status: string
      date_added_to_db: string
      date_last_updated: string
      staff_size: number
      pct_2_year_employee_growth: number | null
      staff_size_date: string
      total_scores: number | null
      average_score: number | null
      last_fit_score_staff: string | null
      last_fit_score: string | null
      last_fit_score_date: string | null
      last_fit_score_review_source: string | null
      qa_status: QAStatus
      last_qa_date: string | null
      funding_status: FundingStatus
      total_funding: number
      last_funding_on: string | null
      acquisition_detail: string | null
      crunchbase_link: string | null
      salesforce_bucket: string
      salesforce_stage: string
      organization_id: string
      owner_name: string
      owner_pod: string | null
      owner_id: string
      post_call_score: number | null
      pc_score_date: string | null
      last_activity: string
      key: boolean
      do_not_contact: boolean
      unassigned_status: string | null
      salesloft_stage: string
      person_id: string
      first_name: string
      last_name: string
      title: string
      email: string
      ceo_linkedin_url: string
      instances: number
      instances_delivered: number
      instances_w_email: number
      instances_w_viewed_email: number
      instances_w_reply: number
      instances_w_call: number
      instances_w_live_meeting: number
      instances_w_opportunity: number
      pct_instances_delivered: number
      pct_instances_w_email: number
      pct_instances_w_viewed_email: number
      pct_instances_w_reply: number
      pct_instances_w_call: number
      pct_instances_w_live_meeting: number
      pct_instances_w_opportunity: number
      total_emails: number
      total_viewed_emails: number
      total_replies: number
      total_calls: number
      total_live_meetings: number
      total_opportunities: number
      first_email_date: string | null
      first_reply_date: string | null
      first_call_date: string | null
      first_live_meeting_date: string | null
      first_opportunity_date: string | null
      last_email_date: string | null
      last_reply_date: string | null
      last_call_date: string | null
      last_live_meeting_date: string | null
      last_opportunity_date: string | null
      reminder_status: string
      reminder_owner: string
      reminder_date: string | null
      open_reminder_count: number
      unique_instance_owners: number
      highest_instance_owner_seniority: string
      total_sourcing_calls: number
      total_company_calls: number
      highest_lifetime_opportunity_stage: HighestLifetimeOppStage
      total_opportunities_to_eval: string
      first_instance_start_date: string
      first_instance_attribution_bucket: string
      first_instance_attribution_funnel: string
      first_instance_owner: string
      converting_instance_start_date: string | null
      converting_instance_attribution_bucket: string | null
      converting_instance_attribution_funnel: string | null
      converting_instance_owner: string | null
      converting_instance_type: string | null
      last_instance_start_date: string
      last_instance_attribution_bucket: string
      last_instance_attribution_funnel: string
      last_instance_owner: string
      last_instance_type: string
      last_instance_delivered: boolean
      last_instance_contains_email: boolean
      last_instance_contains_viewed_email: boolean
      last_instance_contains_reply: boolean
      last_instance_contains_call: boolean
      last_instance_contains_live_meeting: boolean
      last_instance_contains_opportunity: boolean
      last_initial_call_type: string | null
      last_post_call_score: number | null
      last_call_quality_score: number | null
      last_call_scale_score: string | null
      last_quality_call: string | null
      last_call_arr: number | null
      last_call_arr_color: string | null
      last_call_growth_percent: number | null
      last_call_growth_color: string | null
      last_call_percent_us_revenue: number | null
      last_call_acv: number | null
      last_call_is_raising: boolean | null
      last_call_raise_amount: number | null
      last_call_raise_date: string | null
      last_call_raise_color: string | null
      last_call_good_to_refer_status: string | null
      last_call_recommendation: string | null
      last_call_ic_ddd_comments: string | null
      last_call_pod_leader_ddd_comments: string | null
      last_call_contributors: string | null
      last_call_notes: string | null
      last_opportunity_id: string | null
      last_opportunity_creator_name: string | null
      last_opportunity_owner_name: string | null
      last_opportunity_current_stage: string | null
      last_opportunity_highest_stage: string | null
      last_opportunity_primary_close_reason: string | null
      last_opportunity_close_reasons: string | null
      last_opportunity_created_date: string | null
      last_opportunity_last_stage_change_date: string | null
    }
  
    export interface CompanySearchResponse {
      data: CompanyResponse[]
      count: number
    }
  
    export interface CompanyProfileResponse {
      fec_domain_id: string;
      company: string;
      website: string;
      linkedin: string;
      company_description: string | null;
      year_founded: string;
      city: string;
      state_province: string;
      country: string;
      city_state: string;
      travel_city: string;
      database_status: DatabaseStatus;
      lisa_score: number;
      lisa_rank: ScaleScore;
      viability: Viability;
      pipeline_status: PipelineStatus;
      salesforce_stage_group: SFStageGroup;
      salesforce_ownership: SFOwnership;
      review_status: string;
      date_added_to_db: string;
      date_last_updated: string;
      staff_size: number;
      pct_2_year_employee_growth: number | null;
      staff_size_date: string;
      qa_status: QAStatus;
      last_qa_date: string | null;
      funding_status: FundingStatus;
      total_funding: number;
      last_funding_on: string | null;
      acquisition_detail: string | null;
      crunchbase_link: string | null;
      salesforce_bucket: string;
      salesforce_stage: string;
      organization_id: string;
      owner_name: string;
      owner_id: string;
      last_activity: string;
      key: boolean;
      do_not_contact: boolean;
      person_id: string;
      first_name: string;
      last_name: string;
      title: string;
      email: string;
      instances: number;
      instances_delivered: number;
      instances_w_email: number;
      instances_w_viewed_email: number;
      instances_w_reply: number;
      instances_w_call: number;
      instances_w_live_meeting: number;
      instances_w_opportunity: number;
      pct_instances_delivered: number;
      pct_instances_w_email: number;
      pct_instances_w_viewed_email: number;
      pct_instances_w_reply: number;
      pct_instances_w_call: number;
      pct_instances_w_live_meeting: number;
      pct_instances_w_opportunity: number;
      total_emails: number;
      total_viewed_emails: number;
      total_replies: number;
      total_calls: number;
      total_live_meetings: number;
      total_opportunities: number;
      first_email_date: string | null;
      first_reply_date: string | null;
      first_call_date: string | null;
      first_opportunity_date: string | null;
      last_email_date: string | null;
      last_reply_date: string | null;
      last_call_date: string | null;
      last_opportunity_date: string | null;
      unique_instance_owners: number;
      highest_instance_owner_seniority: string;
      total_sourcing_calls: number;
      total_company_calls: number;
      highest_lifetime_opportunity_stage: HighestLifetimeOppStage;
      total_opportunities_to_eval: string;
      first_instance_start_date: string;
      first_instance_attribution_bucket: string;
      first_instance_attribution_funnel: string;
      first_instance_owner: string;
      converting_instance_start_date: string | null;
      converting_instance_attribution_bucket: string | null;
      converting_instance_attribution_funnel: string | null;
      converting_instance_owner: string | null;
      converting_instance_type: string | null;
      last_instance_start_date: string;
      last_instance_attribution_bucket: string;
      last_instance_attribution_funnel: string;
      last_instance_owner: string;
      last_instance_type: string;
      last_instance_delivered: boolean;
      last_instance_contains_email: boolean;
      last_instance_contains_viewed_email: boolean;
      last_instance_contains_reply: boolean;
      last_instance_contains_call: boolean;
      last_instance_contains_live_meeting: boolean;
      last_instance_contains_opportunity: boolean;
      last_initial_call_type: string | null;
      last_quality_call: boolean | null;
      last_call_is_raising: boolean | null;
      last_opportunity_id: string | null;
      last_opportunity_creator_name: string | null;
      last_opportunity_owner_name: string | null;
      last_opportunity_current_stage: string | null;
      last_opportunity_highest_stage: string | null;
      last_opportunity_created_date: string | null;
      last_opportunity_last_stage_change_date: string | null;
    }
  
    export interface CompanyTaxonomyResponse {
      // Add specific fields based on the API response
      taxonomy: Record<string, unknown>;
    }
  
    export interface CompanySponsorResponse {
      // Add specific fields based on the API response
      sponsors: Record<string, unknown>;
    }
  
    export interface CompanyInstanceSummaryResponse {
      // Add specific fields based on the API response
      instances: Record<string, unknown>;
    }
  
    export interface CompanyStaffSizeHistoryResponse {
      // Add specific fields based on the API response
      history: Array<{
        date: string;
        size: number;
      }>;
    }
  
    export interface CompanyFitScoreHistoryResponse {
      // Add specific fields based on the API response
      history: Array<{
        date: string;
        score: number;
      }>;
    }
  
    export class FiveElmsAPIClient {
      constructor(config: {
        baseUrl: string | undefined
        token: string | undefined
        timeout: number
      })
  
      getCompanyProfile(domain: string): Promise<CompanyProfileResponse>
      getCompanyTaxonomy(domain: string): Promise<CompanyTaxonomyResponse>
      getCompanySponsors(domain: string): Promise<CompanySponsorResponse>
      getCompanyInstanceSummaries(domain: string): Promise<CompanyInstanceSummaryResponse>
      getCompanyStaffSizeHistory(domain: string): Promise<CompanyStaffSizeHistoryResponse>
      getCompanyFitScoreHistory(domain: string): Promise<CompanyFitScoreHistoryResponse>
      searchCompanies(
        params: CompanySearchRequest, 
        page?: number, 
        pageSize?: number
      ): Promise<CompanySearchResponse>
    }
  } 

