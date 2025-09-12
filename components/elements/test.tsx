"use client";

import React from 'react'
import { Button } from '../ui/button';
import jsPDF from 'jspdf';
import { autoTable } from "jspdf-autotable";
import Roboto from "@/public/fonts/Roboto-Regular";

const Test = ({ content }) => {
  console.log(content.products.map((product) => Object.values(product)));
  function savePdf() {
    const doc = new jsPDF();
    doc.addFileToVFS('Roboto.ttf', Roboto)
    doc.addFont('Roboto.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');

    if (content.products?.length) {
      autoTable(doc, {
        head: [Object.keys(content.products[0])],
        body: content.products.map((product) => Object.values(product)),
        styles: {
          font: 'Roboto',
          fontStyle: 'normal',
        }
      })
    }

    doc.save(content.filename.split(".")[0]);
  }

  return (
    <Button onClick={savePdf}>Hello</Button>
  )
}

export default Test;
