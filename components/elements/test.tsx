"use client";

import React, { useRef } from 'react'
import { Button } from '../ui/button';
import jsPDF from 'jspdf';
import Roboto from "@/public/fonts/Roboto-Regular";
import RobotoBold from "@/public/fonts/Roboto-Bold";
import RobotoItalic from "@/public/fonts/Roboto-Italic";
import RobotoBoldItalic from "@/public/fonts/Roboto-BoldItalic";
import { z } from 'zod';
import { PDFSchema } from '@/lib/ai/tools/create-pdf';
import RemmarkPDFTemplate from '../pdf-templates/remmark-template';
import EmonaevPDFTemplate from '../pdf-templates/emonaev-template';
import SdkPDFTemplate from '../pdf-templates/sdk-template';

interface Props {
  content: z.infer<typeof PDFSchema>
}

const templateMap = {
  "emonaev": EmonaevPDFTemplate,
  "remmark": RemmarkPDFTemplate,
  "sdk": SdkPDFTemplate,
}

const Test = ({ content }: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const sum = content.products.reduce((sum, product) => sum + (product.price * product.quantity),0)
  const Template = templateMap[content.templateName];

  function savePdf() {
    const doc = new jsPDF({ format: "a4" });

    doc.addFileToVFS('Roboto.ttf', Roboto)
    doc.addFileToVFS('Roboto-bold.ttf', RobotoBold);
    doc.addFileToVFS('Roboto-italic.ttf', RobotoItalic);
    doc.addFileToVFS('Roboto-bold-italic.ttf', RobotoBoldItalic);
    doc.addFont('Roboto.ttf', 'Roboto', 'normal');
    doc.addFont('Roboto-bold.ttf', 'Roboto', 'bold');
    doc.addFont('Roboto-italic.ttf', 'Roboto', 'italic');
    doc.addFont('Roboto-bold-italic.ttf', 'Roboto', 'bolditalic');
    doc.setFont('Roboto');

    doc.html(ref.current!, {
      callback: function (doc) {
        doc.save(content.filename.split(".")[0]);
      },
      html2canvas: {
        scale: .25,
        letterRendering: true,
      },
      autoPaging: "text",
    });
  }

  return (
    <>
      <Button onClick={savePdf}>Скачать PDF</Button>
      <Template content={content} ref={ref} sum={sum} />
    </>
  )
}

export default Test;
