import React, { ForwardedRef } from "react";
import { formatNumber } from "@/lib/utils";

interface Props {
  sum: number;
  headerRef: ForwardedRef<HTMLDivElement>;
  footerRef: ForwardedRef<HTMLDivElement>;
  children: React.ReactNode;
}

const SdkPDFTemplate = ({ sum, headerRef, footerRef, children }: Props) => {
  const nds = sum > 0 ? sum - sum / 1.2 : 0;

  return (
    <div
      style={{ fontFamily: "Roboto" }}
      className="w-[850px] text-xs bg-white tracking-wide relative"
    >
      {/* Header */}
      <div
        ref={headerRef}
        style={{ fontFamily: "Roboto" }}
        className="w-[850px] text-xs bg-white tracking-wide relative font-bold p-10"
      >
        <div className="text-center">
          <div>Российская Федерация</div>
          <div>Тюменская область</div>
          <div>Ханты-Мансийский автономный округ - ЮГРА</div>
          <div className="text-3xl mt-2 tracking-[0.3em]">«Компания СДК»</div>
          <div className="flex justify-between mt-8">
            {"Общество с ограниченной ответственностью"
              .split("")
              .map((symbol, index) => (
                <span key={index}>{symbol}</span>
              ))}
          </div>
        </div>
        <hr className="border-t-2 border-black mt-2" />
        <div className="flex justify-between mt-3">
          <div>
            628400, г.Сургут, ул.Маяковского, 12а
            <br />
            Магазин «Техносфера»
            <br />
            Тел.: (3462) 22-01-22, 23-80-08
          </div>
          <div className="text-right">
            ИНН 8602109264, р/с 40702810767170101413
            <br />
            Западно-Сибирский банк ОАО «Сбербанк России» г.Тюмень
            <br />
            к/с 30101810800000000651 • БИК 047102651
            <br />
            ОГРН 102860579226
          </div>
        </div>
      </div>

      <hr className="border-t-4 border-black mt-2" />
      <hr className="border-t border-white" />
      <hr className="border-t-2 border-black" />

      {/* Intro line with outgoing number and recipient */}
      <div className="mt-1 flex justify-between">
        <div>Исх. № 108 от 01/09/2025г.</div>
        <div>МКУ «УИТС г. Сургута»</div>
      </div>

      <h1 className="text-center text-base mt-24 font-bold">
        Коммерческое предложение.
      </h1>

      {/* Table */}
      {children}

      {/* Totals line in words (adapt numbers as needed) */}
      <div
        ref={footerRef}
        style={{ fontFamily: "Roboto" }}
        className="w-[850px] text-xs bg-white tracking-wide relative p-10"
      >
        <div className="mt-3">
          Всего наименований, на сумму {formatNumber(sum)} (Сорок шесть тысяч
          шестьсот шестьдесят рублей 00 копеек), в том числе НДС{" "}
          {formatNumber(nds)}
        </div>

        {/* Conditions block */}
        <div className="mt-3">
          В ответ на Ваш запрос от 27.08.2025г. № 11-11-1215/5
        </div>
        <div>
          Срок действия предложения: до 31.12.2025. 2. Срок поставки товара: в
          срок до 31.10.2025 (включительно). 3. Место поставки товара: 628408,
          Российская Федерация, Ханты-Мансийский автономный округ – Югра, город
          Сургут, ул. 30 лет Победы, дом 17, склад МКУ «УИТС г. Сургута». 4.
          Цена включает в себя: стоимость Товара, расходы, связанные с
          доставкой, разгрузкой-погрузкой, размещением в местах хранения
          Заказчика, стоимость упаковки (тары), маркировки, страхование,
          таможенные платежи (пошлины), НДС, другие установленные налоги, сборы
          и иные расходы, связанные с исполнением Контракта. 5. Гарантийный срок
          исчисляется с момента подписания документа о приемке и составляет 12
          (двенадцать) месяцев.
        </div>
      </div>
    </div>
  );
};

export default SdkPDFTemplate;
