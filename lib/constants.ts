import { generateDummyPassword } from './db/utils';

export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
);

export const guestRegex = /^guest-\d+$/;

export const DUMMY_PASSWORD = generateDummyPassword();

export const COI_DISCLOSURE_TEMPLATE = `
# Conflict of Interest Disclosure Form

**Date of Submission:** [YYYY-MM-DD]  
**Submitted By (Employee Name):** [Full Name]  
**Employee ID / Number:** [Employee ID]  
**Position / Title:** [Job Title]  
**Department / Division:** [Department Name]  
**Supervisor Name:** [Supervisor Full Name]  

---

## 1. Nature of the Potential Conflict
**Type of Conflict (select all that apply):**  
- [ ] Financial Interest  
- [ ] Outside Employment or Activities  
- [ ] Family or Personal Relationships  
- [ ] Gifts, Hospitality, or Favoritism  
- [ ] Confidential Information Misuse  
- [ ] Post-Employment / Revolving Door  
- [ ] Other: [Specify]

**Description of the Situation:**  
[Provide a detailed account of the potential or actual conflict, including context, timing, and relevant facts.]

---

## 2. Parties Involved
**Other Individuals or Entities Involved (if any):**  
- Name: [Full Name or Entity]  
- Relationship: [e.g., Vendor, Family Member, Business Partner]  
- Role in the Conflict: [Description]  

---

## 3. Financial or Personal Interest
**Nature of Interest:**  
[Equity ownership, gifts received, outside business interest, close relationship, etc.]  

**Estimated Value (if applicable):**  
[Dollar amount or "Not Applicable"]  

---

## 4. Impact Assessment
**Potential Impact on Professional Duties:**  
[Explain how this situation could affect impartiality, decision-making, or organizational integrity.]  

**Has the conflict already influenced decisions or actions?**  
- [ ] Yes  
- [ ] No  
If yes, provide details: [Explain]  

---

## 5. Mitigation Measures Proposed
**Steps you suggest to eliminate, reduce, or manage the conflict:**  
[Examples: Recusal from certain decisions, divestment, external audit, disclosure to relevant parties, resignation from outside role, etc.]  

---

## 6. Supporting Documentation
**Attachments Provided:**  
[List or describe any documents provided as evidence or clarification, e.g., contracts, financial statements, correspondence.]  

---

## 7. Certification
I, [Employee Full Name], certify that the information provided above is true, complete, and accurate to the best of my knowledge. I understand that failure to disclose conflicts of interest may result in disciplinary action under company policy and applicable laws.

**Signature:** ___________________________  
**Date:** [YYYY-MM-DD]`;