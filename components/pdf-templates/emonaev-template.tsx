import { formatNumber } from "@/lib/utils";
import React, { ForwardedRef } from "react";

interface Props {
  headerRef: ForwardedRef<HTMLDivElement>;
  footerRef: ForwardedRef<HTMLDivElement>;
  sum: number;
  children: React.ReactNode;
}

const EmonaevPDFTemplate = ({ headerRef, footerRef, sum, children }: Props) => {
  // НДС ~ 20% «внутри» цены: НДС = sum - sum/1.2
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
        className="tracking-wide text-xs p-10 w-[850px]"
      >
        <div className="font-bold text-center italic text-xl">
          Индивидуальный предприниматель
          <br />
          <span className="uppercase">Емонаев Виталий Сергеевич</span>
          <br />
          ИНН 860239103291 ОГРНИП 315861700013774
          <br />
          628426, Россия, Ханты-Мансийский Автономный округ – Югра,
          <br />
          г. Сургут, проспект Мира, д. 44, кв. 79
        </div>

        <hr className="mt-4 border-t border-black" />

        <div className="flex justify-end mt-4">
          <div className="whitespace-pre-wrap text-right max-w-[160px]">
            Директору МКУ «УИТС г. Сургута» П.М. Зыкову
          </div>
        </div>

        <p className="mt-4 text-center">Уважаемый Павел Михайлович!</p>

        <div className="text-left mt-4">
          В ответ на Ваш запрос от 27.08.2025 № 11-11-1215/5.
        </div>
      </div>

      {/* Table */}
      {children}

      {/* Totals */}
      <div className="flex justify-end mt-3">
        <div className="grid grid-cols-2 gap-x-6">
          <div className="text-right font-medium">Итого:</div>
          <div className="text-right">{formatNumber(sum)}</div>
          <div className="text-right font-medium">НДС:</div>
          <div className="text-right">{formatNumber(nds)}</div>
          <div className="text-right font-medium">Всего к оплате:</div>
          <div className="text-right">{formatNumber(sum)}</div>
        </div>
      </div>

      {/* Bottom text (условия) */}
      <div
        ref={footerRef}
        className="tracking-wide text-xs p-10 w-[850px]"
        style={{ fontFamily: "Roboto" }}
      >
        <div className="mt-3">
          <ol className="ml-6 list-none">
            <li>1. Срок действия предложения: до 31.12.2025.</li>
            <li>
              2. Срок поставки товара: в срок до 31.10.2025 (включительно).
            </li>
            <li>
              3. Место поставки товара: 628408, Российская Федерация,
              Ханты-Мансийский автономный округ – Югра, город Сургут, ул. 30 лет
              Победы, дом 17, склад МКУ «УИТС г. Сургута».
            </li>
            <li>
              4. Цена включает в себя: стоимость Товара, расходы, связанные с
              доставкой, разгрузкой-погрузкой, размещением в местах хранения
              Заказчика, стоимость упаковки (тары), маркировки, страхование,
              таможенные платежи (пошлины), НДС, другие установленные налоги,
              сборы и иные расходы, связанные с исполнением Контракта.
            </li>
            <li>
              5. Гарантийный срок исчисляется с момента подписания документа о
              приемке и составляет 12 (двенадцать) месяцев.
            </li>
          </ol>
        </div>

        {/* Signature */}
        <div className="mt-8 flex gap-4 relative">
          <span>ИП Емонаев В.С.</span>
          <div className="w-32 border-t border-black absolute top-4 left-[100px]" />
          <span className="text-right relative top-4">
            действует без печати
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmonaevPDFTemplate;
