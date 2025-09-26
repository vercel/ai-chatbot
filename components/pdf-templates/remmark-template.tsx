import { TemplateProps } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import React from "react";

const RemmarkPDFTemplate = ({
  headerRef,
  footerRef,
  sum,
  children,
  content,
}: TemplateProps) => {
  return (
    <div
      style={{ fontFamily: "Roboto" }}
      className="w-[850px] text-xs bg-white tracking-wide relative"
    >
      <div
        ref={headerRef}
        style={{ fontFamily: "Roboto" }}
        className="w-[850px] text-xs bg-white p-10 tracking-wide relative"
      >
        <img
          src="/images/remmark-logo.png"
          alt="Лого Реммарк"
          width={200}
          height={200}
          className="absolute right-10 top-5"
        />
        <div className="font-bold">
          Общество с ограниченной ответственностью
          <br />
          «РемМарк»
        </div>
        <div className="flex justify-between items-start">
          <div>
            628400, Россия,
            <br />
            Тюменская область, ХМАО-Югра,
            <br />
            г.Сургут, ул.Юности, 8, цоколь 1<br />
            тел.: (3462) 50-02-50
            <br />
            факс: (3462) 50-04-10
          </div>
          <div className="text-right">
            <div>Р/с 40702810500020028092</div>
            <div>Филиал «Центральный» Банка ВТБ (ПАО)</div>
            <div>к/с 30101810145250000411 • БИК 044525411</div>
            <div>ИНН/КПП 8602004423/860201001</div>
            <div>ОГРН 1058602150420 • ОКПО 79536531</div>
          </div>
        </div>
        <hr className="mt-4 border-t-2 border-black" />
        <div className="flex justify-between">
          <div>
            <span>Исх. № {content.offerNumber}</span>
            <span>От {content.offerDate}</span>
          </div>
          <div>Кому: {content.receiver}</div>
        </div>
        <h1 className="text-center text-base">Коммерческое предложение</h1>
      </div>

      {/* Table */}
      {children}

      <div
        ref={footerRef}
        style={{ fontFamily: "Roboto" }}
        className="w-[850px] text-xs bg-white tracking-wide relative p-10"
      >
        <div className="flex justify-end">
          <div className="grid grid-cols-2 gap-x-6">
            <div className="text-right font-medium">Итого:</div>
            <div className="text-right">{formatNumber(sum)}</div>
            <div className="text-right font-medium">НДС:</div>
            <div className="text-right">7 550,00</div>
            <div className="text-right font-medium">Всего к оплате:</div>
            <div className="text-right">{formatNumber(sum)}</div>
          </div>
        </div>

        {/* Bottom text */}
        <div>
          <p>
            Цены действительны на спецификацию в полном объеме. В случае ее
            изменения предложение может быть пересмотрено.
            <br />В ответ на Ваш запрос от {content.customerRequestDate}г. №{" "}
            {content.customerRequestNumber}
          </p>
          <ol className="mt-3 ml-6 list-none">
            <li>
              1. Срок действия предложения: до {content.offerValidityPeriod}.
            </li>
            <li>
              2. Срок поставки товара: в срок до {content.deliveryPeriod}{" "}
              (включительно).
            </li>
            <li>3. Место поставки товара: {content.deliveryAddress}</li>
            <li>
              4. Цена включает в себя: стоимость Товара, расходы, связанные с
              доставкой, разгрузкой-погрузкой, размещением в местах хранения
              Заказчика, стоимость упаковки (тары), маркировки, страхование,
              таможенные платежи (пошлины), НДС, другие установленные налоги,
              сборы и иные расходы, связанные с исполнением Контракта.
            </li>
            <li>
              5. Гарантийный срок исчисляется с момента подписания документа о
              приеме и составляет 12 (двенадцать) месяцев.
            </li>
          </ol>
        </div>
        <div className="flex justify-between relative">
          <img
            src="/images/remmark-seal.png"
            alt="Печать Реммарк"
            width={200}
            height={200}
            className="absolute right-40"
          />
          <span>Директор</span>
          <span>/ Аникеенко И. В.</span>
        </div>
      </div>
    </div>
  );
};

export default RemmarkPDFTemplate;
