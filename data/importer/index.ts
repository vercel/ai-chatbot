import { config } from 'dotenv';
import OpenAIClient from 'openai';
import { z } from 'zod';

import { Company } from '../companyData';

const companies = require('./config.json');

config(); // Load environment variables from .env.local file

const client = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEYg,
});

async function getCompanyReport(businessId: string, name: string) {
  const prompt = `
    Based on the TMT survey framework, generate a report about company well-being for prospective employees located in Finland. For companies located in multiple countries use data from Finland. Use the following structured categories, providing a score from 1 to 10 if information is available; otherwise, state no data is found. Focus on workplace well-being factors.

    Company details:
    - businessId: ${businessId}
    - name: ${name}

    Company summer;
    - Make sure it's a short summery of what the company does.

    Categories:
    1. Basic needs and security
    2. Recognition and career success
    3. Authenticity and agency
    4. Self-development and competence
    5. Belongingness and contribution within the work community
    6. Broader and everyday good deeds through work

    Categories should include a
    - summary of why this company scored this way on this category
    - score from 1 to 100
    - sources for the information

    Please answer in the following JSON structure (without Markdown or line breaks):
    
    {
        name: string,
        businessId: string,
        summary: string,
        categories: {
          categoryId: number,
          summary: string,
          score: number,
          sources: {url: string, title: string}[],
        }[],
    }
  `;

  console.log('Generating report for', name);
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
  console.log('Hi! Welcome to the importer script!');
  const parsedCompanies = ImporterConfig.parse(companies);
  console.log('We just pased the companies!');

  console.log('Fetching company reports...');
  const results: z.infer<typeof Company>[] = [];
  for await (const { name, id } of parsedCompanies) {
    const generatedReport = await getCompanyReport(id, name);
    console.log(`Generated report for report for ${name}!`);
    try {
      const comapny = Company.parse(JSON.parse(generatedReport));
      results.push(comapny);
      console.log(`Parsed report for ${name}!`);
    } catch (e) {
      console.error(`Failed to parse ${name}: ${e.message}`);
    }
  }

  await Bun.write(
    `${import.meta.dir}/data.json`,
    JSON.stringify({companies: results.filter(Boolean)}, null, 2)
  );
}

main();
