"use client";

import React, { useRef } from 'react'
import { Button } from '../ui/button';
import jsPDF from 'jspdf';
import Roboto from "@/public/fonts/Roboto-Regular";
import RobotoBold from "@/public/fonts/Roboto-Bold";
import { z } from 'zod';
import { PDFSchema } from '@/lib/ai/tools/create-pdf';
import RemmarkPDFTemplate from '../pdf-templates/remmark-template';
import EmonaevPDFTemplate from '../pdf-templates/emonaev-template';

interface Props {
  content: z.infer<typeof PDFSchema>
}

const Test = ({ content }: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const sum = content.products.reduce((sum, product) => sum + (product.price * product.quantity),0)
  console.log(content, sum);

  function savePdf() {
    const doc = new jsPDF({ format: "a4" });

    doc.addFileToVFS('Roboto.ttf', Roboto)
    doc.addFileToVFS('Roboto-bold.ttf', RobotoBold);
    doc.addFont('Roboto.ttf', 'Roboto', 'normal');
    doc.addFont('Roboto-bold.ttf', 'Roboto', 'bold');
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
      <EmonaevPDFTemplate content={content} ref={ref} sum={sum} />
    </>
  )
}

export default Test;
