import { jsPDF } from "jspdf";
import { tool } from 'ai';
import { z } from 'zod';

export const createPdf = tool({
  description: 'Get the current weather at a location',
  inputSchema: z.object({
    title: z.string(),
  }),
  execute: async ({ title }) => {
    const doc = new jsPDF();

    doc.text("Hello world!", 10, 10);
    doc.save(`${title}.pdf`);
  },
});

// Default export is a4 paper, portrait, using millimeters for units
