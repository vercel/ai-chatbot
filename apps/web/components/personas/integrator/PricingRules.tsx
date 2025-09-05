import React from 'react';

export interface PricingRuleSet {
  /** percentage markup expressed as decimal (e.g. 0.2 for 20%) */
  markup: number;
  /** absolute logistics cost */
  logistics: number;
  /** contingency percentage expressed as decimal */
  contingency: number;
}

export interface PricingResult {
  base: number;
  markup: number;
  logistics: number;
  contingency: number;
  total: number;
}

/**
 * applyPricingRules provides an auditable calculation of final price
 * from a base cost and rule set consisting of markup, logistics and
 * contingency percentages.
 */
export function applyPricingRules(
  base: number,
  rules: PricingRuleSet,
): PricingResult {
  const markup = base * rules.markup;
  const contingency = base * rules.contingency;
  const total = base + markup + rules.logistics + contingency;
  return { base, markup, logistics: rules.logistics, contingency, total };
}

export interface BomItem {
  name: string;
  cost: number;
}

/**
 * priceFromBOM aggregates a bill of materials and applies pricing rules.
 * The result can be consumed by CostCard or similar components.
 */
export function priceFromBOM(
  items: BomItem[],
  rules: PricingRuleSet,
): PricingResult {
  const base = items.reduce((sum, item) => sum + item.cost, 0);
  return applyPricingRules(base, rules);
}

interface PricingRulesProps {
  items: BomItem[];
  rules: PricingRuleSet;
}

/**
 * PricingRules renders a CAPEX preview based on BOM items and pricing rules.
 */
export function PricingRules({ items, rules }: PricingRulesProps) {
  const result = priceFromBOM(items, rules);

  return (
    <div>
      <h3>CAPEX Preview</h3>
      <ul>
        <li>
          Base: ${'{'}result.base.toFixed(2){'}'}
        </li>
        <li>
          Markup ({'{'}(rules.markup * 100).toFixed(1){'}'}%): ${'{'}
          result.markup.toFixed(2)
          {'}'}
        </li>
        <li>
          Logistics: ${'{'}result.logistics.toFixed(2){'}'}
        </li>
        <li>
          Contingency ({'{'}(rules.contingency * 100).toFixed(1){'}'}%): ${'{'}
          result.contingency.toFixed(2)
          {'}'}
        </li>
        <li>
          Total: ${'{'}result.total.toFixed(2){'}'}
        </li>
      </ul>
    </div>
  );
}

export default PricingRules;
