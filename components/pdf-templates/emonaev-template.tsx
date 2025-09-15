import { PDFSchema } from '@/lib/ai/tools/create-pdf'
import { formatNumber } from '@/lib/utils'
import React, { ForwardedRef } from 'react'
import { z } from 'zod'

interface Props {
  ref: ForwardedRef<HTMLDivElement>
  content: z.infer<typeof PDFSchema>
  sum: number
}

const EmonaevPDFTemplate = ({ content, ref, sum }: Props) => {
  // НДС ~ 20% «внутри» цены: НДС = sum - sum/1.2
  const nds = sum > 0 ? sum - sum / 1.2 : 0

  return (
    <div
      ref={ref}
      style={{ fontFamily: 'Roboto' }}
      className="w-[850px] text-xs bg-white p-10 tracking-wide relative"
    >
      {/* Header */}
      <div className="font-bold uppercase">
        Индивидуальный предприниматель
        <br />
        Емонаев Виталий Сергеевич
      </div>

      <div className="flex justify-between items-start mt-1">
        <div>
          628426, Россия, Ханты-Мансийский Автономный округ – Югра,
          <br />
          г. Сургут, проспект Мира, д. 44, кв. 79
        </div>
        <div className="text-right">
          ИНН 860239103291
          <br />
          ОГРНИП 315861700013774
        </div>
      </div>

      <hr className="mt-4 border-t-2 border-black" />

      <div className="flex justify-between items-start">
        <div className="whitespace-pre-wrap">
          Директору МКУ «УИТС г. Сургута»
          <br />
          П.М. Зыкову
        </div>
        <div className="text-right">
          В ответ на Ваш запрос от 27.08.2025 № 11-11-1215/5
        </div>
      </div>

      <h1 className="text-center text-base mt-2">Коммерческое предложение</h1>
      <p className="mt-2">Уважаемый Павел Михайлович!</p>

      {/* Table */}
      <table className="min-w-full border border-black bg-white mt-3">
        <thead>
          <tr>
            <th className="border border-black px-2 py-1 align-middle font-medium text-gray-900">№ п/п</th>
            <th className="border border-black px-2 py-1 align-middle font-medium text-gray-900">
              Наименование товара
            </th>
            <th className="border border-black px-2 py-1 align-middle font-medium text-gray-900">
              Функциональные и качественные характеристики товара (неизменяемые показатели)
            </th>
            <th className="border border-black px-2 py-1 align-middle font-medium text-gray-900">Кол-во</th>
            <th className="border border-black px-2 py-1 align-middle font-medium text-gray-900">Ед.</th>
            <th className="border border-black px-2 py-1 font-medium text-gray-900">Цена с НДС (руб.)</th>
            <th className="border border-black px-2 py-1 font-medium text-gray-900">Сумма с НДС (руб.)</th>
          </tr>
        </thead>
        <tbody>
          {content.products.map((product, index) => (
            <tr key={`${product.name}-${index}`}>
              <td className="border border-black px-2 py-1 text-center">{index + 1}</td>
              <td className="border border-black px-2 py-1">{product.name}</td>
              <td className="border border-black px-2 py-1">{product.characteristics}</td>
              <td className="border border-black px-2 py-1 text-center">{product.quantity}</td>
              <td className="border border-black px-2 py-1 text-center">шт</td>
              <td className="border border-black px-2 py-1 text-right">{formatNumber(product.price)}</td>
              <td className="border border-black px-2 py-1 text-right">
                {formatNumber(product.price * product.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
      <div className="mt-3">
        <ol className="ml-6 list-none">
          <li>1. Срок действия предложения: до 31.12.2025.</li>
          <li>2. Срок поставки товара: в срок до 31.10.2025 (включительно).</li>
          <li>
            3. Место поставки товара: 628408, Российская Федерация, Ханты-Мансийский автономный округ – Югра,
            город Сургут, ул. 30 лет Победы, дом 17, склад МКУ «УИТС г. Сургута».
          </li>
          <li>
            4. Цена включает в себя: стоимость Товара, расходы, связанные с доставкой, разгрузкой-погрузкой,
            размещением в местах хранения Заказчика, стоимость упаковки (тары), маркировки, страхование, таможенные
            платежи (пошлины), НДС, другие установленные налоги, сборы и иные расходы, связанные с исполнением
            Контракта.
          </li>
          <li>
            5. Гарантийный срок исчисляется с момента подписания документа о приемке и составляет 12 (двенадцать)
            месяцев.
          </li>
        </ol>
      </div>

      {/* Signature */}
      <div className="mt-8 flex justify-between">
        <span>ИП Емонаев В.С.</span>
        <span className="text-right">действует без печати</span>
      </div>
    </div>
  )
}

export default EmonaevPDFTemplate
