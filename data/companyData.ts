import { z } from 'zod';

import * as data from './data.json';

const Source = z.object({
  url: z.string(),
  title: z.string(),
});

const Rating = z.object({
  categoryId: z.number(),
  summary: z.string(),
  score: z.number(),
  sources: z.array(Source),
});

export const Company = z.object({
  name: z.string(),
  businessId: z.string(),
  summary: z.string(),
  categories: z.array(Rating),
});

const CompanyData = z.object({
  name: z.string(),
  businessId: z.string(),
  summary: z.string(),
  categories: z.array(Company),
});

export const getCompanyData = () => {
  return CompanyData.parse(data);
};

type RatingCategory = {
  id: number;
  title: string;
};

export const ratingCategories: RatingCategory[] = [
  {
    id: 1,
    title: 'Workplace Atmosphere and Community',
  },
  {
    id: 2,
    title: 'Job Content and Challenges',
  },
  {
    id: 3,
    title: 'Leadership and Management',
  },
  {
    id: 4,
    title: 'Work Facilities and Tools',
  },
  {
    id: 5,
    title: 'Compensation and Benefits',
  },
  {
    id: 6,
    title: 'Working Hours and Flexibility',
  },
  {
    id: 7,
    title: 'Training and Development Opportunities',
  },
  {
    id: 8,
    title: 'Occupational Health and Well-being',
  },
  {
    id: 9,
    title: 'Job Stability and Career Advancement',
  },
  {
    id: 10,
    title: 'Company Reputation and Values',
  },
];
