import { ProductSchema } from '@/lib/ai/tools/create-pdf'
import { formatNumber } from '@/lib/utils'
import React from 'react'
import { z } from 'zod'

interface Props {
  products: z.infer<typeof ProductSchema>[]
}

const TemplateTable = ({ products }: Props) => {
  return (
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
        {products.map((product, index) => (
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
  )
}

export default TemplateTable;
