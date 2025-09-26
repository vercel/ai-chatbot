"use client";

import React, { useRef } from "react";
import jsPDF from "jspdf";
import Roboto from "@/public/fonts/Roboto-Regular";
import RobotoBold from "@/public/fonts/Roboto-Bold";
import RobotoItalic from "@/public/fonts/Roboto-Italic";
import RobotoBoldItalic from "@/public/fonts/Roboto-BoldItalic";
import { z } from "zod";
import { PDFSchema } from "@/lib/ai/tools/create-pdf";
import { applyPlugin } from "jspdf-autotable";
import EmonaevPDFTemplate from "./pdf-templates/emonaev-template";
import RemmarkPDFTemplate from "./pdf-templates/remmark-template";
import SdkPDFTemplate from "./pdf-templates/sdk-template";
import { Button } from "./ui/button";
import TemplateTable from "./pdf-templates/template-table";
import { TemplateProps } from "@/lib/types";

interface Props {
  content: z.infer<typeof PDFSchema>;
}

const templateMap: Record<
  string,
  {
    component: React.ComponentType<TemplateProps>;
    tableOffset: number;
  }
> = {
  emonaev: { component: EmonaevPDFTemplate, tableOffset: 80 },
  remmark: { component: RemmarkPDFTemplate, tableOffset: 72 },
  sdk: { component: SdkPDFTemplate, tableOffset: 72 },
};

applyPlugin(jsPDF);

const CreatePDFToolResult = ({ content }: Props) => {
  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);

  const sum = content.products.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0,
  );
  const { component: Template, tableOffset } =
    templateMap[content.templateName];

  async function savePdf() {
    const doc = new jsPDF({ format: "a4" });

    doc.addFileToVFS("Roboto.ttf", Roboto);
    doc.addFileToVFS("Roboto-bold.ttf", RobotoBold);
    doc.addFileToVFS("Roboto-italic.ttf", RobotoItalic);
    doc.addFileToVFS("Roboto-bold-italic.ttf", RobotoBoldItalic);
    doc.addFont("Roboto.ttf", "Roboto", "normal");
    doc.addFont("Roboto-bold.ttf", "Roboto", "bold");
    doc.addFont("Roboto-italic.ttf", "Roboto", "italic");
    doc.addFont("Roboto-bold-italic.ttf", "Roboto", "bolditalic");
    doc.setFont("Roboto");

    await new Promise<void>((resolve) => {
      doc.html(headerRef.current!, {
        callback: function (doc) {
          doc.autoTable({
            theme: "grid",
            html: tableRef.current!,
            startY: tableOffset,
            styles: {
              font: "Roboto",
              fontStyle: "normal",
              fillColor: false,
              textColor: [0, 0, 0],
              lineColor: [0, 0, 0],
            },
            headStyles: {
              lineWidth: 0.25,
            },
            showHead: "firstPage",
          });

          console.log(doc.lastAutoTable);
          doc.html(footerRef.current!, {
            y:
              doc.lastAutoTable.finalY +
              (doc.lastAutoTable.pageNumber === 1
                ? 0
                : doc.lastAutoTable.pageNumber) *
                205 +
              tableOffset,
            callback: function (doc) {
              doc.save(content.filename.split(".")[0]);
            },
            html2canvas: {
              scale: 0.25,
              letterRendering: true,
            },
            autoPaging: "text",
          });
        },
        html2canvas: {
          scale: 0.25,
          letterRendering: true,
        },
        autoPaging: "text",
      });
    });
  }

  return (
    <>
      <Button onClick={savePdf}>Скачать PDF</Button>
      <Template
        headerRef={headerRef}
        footerRef={footerRef}
        sum={sum}
        content={content}
      >
        <TemplateTable products={content.products} ref={tableRef} />
      </Template>
    </>
  );
};

export default CreatePDFToolResult;
