import { config } from 'dotenv';
import OpenAIClient from 'openai';
import { z } from 'zod';

import { Company } from '../companyData';

const companies = require('./config.json');

config(); // Load environment variables from .env.local file

const client = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getCompanyReport(businessId: string, name: string) {
  const prompt = `
    Based on the TMT survey framework, generate a report about company well-being for prospective employees located in Finland. For companies located in multiple countries use data from Finland. Use the following structured categories, providing a score from 1 to 10 if information is available; otherwise, state no data is found. Focus on workplace well-being factors.

    Company details:
    - businessId: ${businessId}
    - name: ${name}

    Categories:
    1. Workplace Atmosphere and Community
    2. Job Content and Challenges
    3. Leadership and Management
    4. Work Facilities and Tools
    5. Compensation and Benefits
    6. Working Hours and Flexibility
    7. Training and Development Opportunities
    8. Occupational Health and Well-being
    9. Job Stability and Career Advancement
    10. Company Reputation and Values
    
    Please answer in the following JSON structure (without Markdown or line breaks):
    
    {
        name: string,
        businessId: string,
        summary: string,
        categories: {categoryId: number, summary: string, score: number, sources: {url: string, title: string}[],
    }
  `;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.choices[0]?.message.content;

  if (!content) {
    throw new Error('Content missing');
  }

  return content;
}

const ImporterConfig = z.array(
  z.object({
    name: z.string(),
    id: z.string(),
  })
);

async function main() {
  const parsedCompanies = ImporterConfig.parse(companies);

  const results = await Promise.all(
    parsedCompanies.map(async ({ name, id }) =>
      Company.parse(JSON.parse(await getCompanyReport(id, name)))
    )
  );

  await Bun.write(
    `${import.meta.dir}/data.json`,
    JSON.stringify(results, null, 2)
  );
}

main();
