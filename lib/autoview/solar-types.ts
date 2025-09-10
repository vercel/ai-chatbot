import typia, { type tags } from "typia";

// Solar Panel and System Data
export interface ISolarPanel {
  id: string & tags.Format<"uuid">;
  model: string;
  manufacturer: string;
  wattage: number & tags.Minimum<1> & tags.Maximum<1000>;
  efficiency: number & tags.Minimum<0> & tags.Maximum<1>;
  dimensions: {
    length: number & tags.Minimum<0>;
    width: number & tags.Minimum<0>;
    thickness: number & tags.Minimum<0>;
  };
  price: number & tags.Minimum<0>;
  warranty: {
    productYears: number & tags.Minimum<0>;
    performanceYears: number & tags.Minimum<0>;
    performanceGuarantee: number & tags.Minimum<0> & tags.Maximum<1>;
  };
}

export interface ISolarSystem {
  id: string & tags.Format<"uuid">;
  customerId: string & tags.Format<"uuid">;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  roof: {
    area: number & tags.Minimum<0>; // in square meters
    orientation: "north" | "south" | "east" | "west" | "northeast" | "northwest" | "southeast" | "southwest";
    tilt: number & tags.Minimum<0> & tags.Maximum<90>; // degrees
    shading: "none" | "minimal" | "moderate" | "heavy";
  };
  panels: ISolarPanel[];
  totalCapacity: number & tags.Minimum<0>; // in kW
  estimatedProduction: number & tags.Minimum<0>; // kWh per year
  installationCost: number & tags.Minimum<0>;
  incentives: {
    federalTaxCredit: number & tags.Minimum<0>;
    stateRebates: number & tags.Minimum<0>;
    utilityRebates: number & tags.Minimum<0>;
    totalIncentives: number & tags.Minimum<0>;
  };
  netCost: number & tags.Minimum<0>;
}

// Lead Management Data
export interface ILead {
  id: string & tags.Format<"uuid">;
  createdAt: string & tags.Format<"date-time">;
  updatedAt: string & tags.Format<"date-time">;
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  priority: "low" | "medium" | "high" | "urgent";
  source: "website" | "referral" | "social_media" | "advertising" | "cold_call" | "trade_show" | "other";

  // Contact Information
  contact: {
    firstName: string;
    lastName: string;
    email: string & tags.Format<"email">;
    phone: string;
    preferredContactMethod: "email" | "phone" | "text";
  };

  // Property Information
  property: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    type: "single_family" | "multi_family" | "commercial" | "industrial";
    roofType: "asphalt" | "tile" | "metal" | "flat" | "other";
    age: number & tags.Minimum<0>; // years
    squareFootage: number & tags.Minimum<0>;
  };

  // Financial Information
  budget: {
    minBudget: number & tags.Minimum<0>;
    maxBudget: number & tags.Minimum<0>;
    financingInterest: boolean;
    timeline: "immediate" | "3_months" | "6_months" | "1_year" | "flexible";
  };

  // Solar Interest
  solarInterest: {
    currentElectricityBill: number & tags.Minimum<0>;
    motivation: string[];
    concerns: string[];
    previousSolarResearch: boolean;
  };

  // Journey Progress
  journeyPhase: "Investigation" | "Detection" | "Analysis" | "Dimensioning" | "Simulation" | "Installation" | "Monitoring" | "Recommendation" | "LeadMgmt";
  lastActivity: string & tags.Format<"date-time">;
  nextFollowUp?: string & tags.Format<"date-time">;

  // Assignment
  assignedTo?: string & tags.Format<"uuid">; // integrator ID
  tags: string[];
  notes: string;
}

// Financial Analysis Data
export interface IFinancialAnalysis {
  id: string & tags.Format<"uuid">;
  leadId: string & tags.Format<"uuid">;
  systemSize: number & tags.Minimum<0>; // kW
  estimatedCost: number & tags.Minimum<0>;
  incentives: {
    federalITC: number & tags.Minimum<0>;
    stateRebates: number & tags.Minimum<0>;
    utilityRebates: number & tags.Minimum<0>;
    totalIncentives: number & tags.Minimum<0>;
  };
  netCost: number & tags.Minimum<0>;
  financing: {
    downPayment: number & tags.Minimum<0>;
    loanAmount: number & tags.Minimum<0>;
    interestRate: number & tags.Minimum<0> & tags.Maximum<1>;
    termYears: number & tags.Minimum<1> & tags.Maximum<30>;
    monthlyPayment: number & tags.Minimum<0>;
  };
  savings: {
    currentBill: number & tags.Minimum<0>; // monthly
    estimatedBill: number & tags.Minimum<0>; // monthly after solar
    monthlySavings: number & tags.Minimum<0>;
    annualSavings: number & tags.Minimum<0>;
    paybackPeriod: number & tags.Minimum<0>; // years
    roi: number & tags.Minimum<0>; // percentage
    lifetimeSavings: number & tags.Minimum<0>;
  };
  environmental: {
    co2Offset: number & tags.Minimum<0>; // kg per year
    treesEquivalent: number & tags.Minimum<0>;
    carsEquivalent: number & tags.Minimum<0>;
  };
  createdAt: string & tags.Format<"date-time">;
}

// Monitoring Data
export interface IMonitoringData {
  id: string & tags.Format<"uuid">;
  systemId: string & tags.Format<"uuid">;
  timestamp: string & tags.Format<"date-time">;
  production: {
    daily: number & tags.Minimum<0>; // kWh
    monthly: number & tags.Minimum<0>; // kWh
    yearly: number & tags.Minimum<0>; // kWh
    lifetime: number & tags.Minimum<0>; // kWh
  };
  performance: {
    efficiency: number & tags.Minimum<0> & tags.Maximum<1>; // percentage
    performanceRatio: number & tags.Minimum<0> & tags.Maximum<1>; // PR
    expectedVsActual: number; // percentage difference
  };
  weather: {
    irradiance: number & tags.Minimum<0>; // W/m²
    temperature: number; // °C
    windSpeed: number & tags.Minimum<0>; // m/s
  };
  alerts: {
    type: "warning" | "error" | "info";
    message: string;
    severity: "low" | "medium" | "high" | "critical";
    timestamp: string & tags.Format<"date-time">;
  }[];
  maintenance: {
    lastInspection: string & tags.Format<"date-time">;
    nextScheduled: string & tags.Format<"date-time">;
    issues: string[];
  };
}

// Proposal Data
export interface IProposal {
  id: string & tags.Format<"uuid">;
  leadId: string & tags.Format<"uuid">;
  version: number & tags.Minimum<1>;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
  createdAt: string & tags.Format<"date-time">;
  validUntil: string & tags.Format<"date-time">;

  // System Details
  system: {
    size: number & tags.Minimum<0>; // kW
    panels: {
      model: string;
      quantity: number & tags.Minimum<1>;
      totalWattage: number & tags.Minimum<0>;
    };
    inverter: {
      model: string;
      quantity: number & tags.Minimum<1>;
      warranty: number & tags.Minimum<0>; // years
    };
    battery?: {
      model: string;
      capacity: number & tags.Minimum<0>; // kWh
      quantity: number & tags.Minimum<1>;
    };
  };

  // Pricing
  pricing: {
    equipmentCost: number & tags.Minimum<0>;
    installationCost: number & tags.Minimum<0>;
    permitsAndFees: number & tags.Minimum<0>;
    subtotal: number & tags.Minimum<0>;
    taxes: number & tags.Minimum<0>;
    totalBeforeIncentives: number & tags.Minimum<0>;
    incentives: number & tags.Minimum<0>;
    netTotal: number & tags.Minimum<0>;
  };

  // Terms
  terms: {
    warranty: {
      panels: number & tags.Minimum<0>; // years
      inverter: number & tags.Minimum<0>; // years
      workmanship: number & tags.Minimum<0>; // years
    };
    paymentTerms: string;
    financingAvailable: boolean;
    maintenancePlan: boolean;
  };

  // Performance Estimates
  estimates: {
    annualProduction: number & tags.Minimum<0>; // kWh
    monthlySavings: number & tags.Minimum<0>;
    paybackPeriod: number & tags.Minimum<0>; // years
    roi: number & tags.Minimum<0>; // percentage
  };
}