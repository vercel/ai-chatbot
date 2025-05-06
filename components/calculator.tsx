'use client';

import { useState } from 'react';
import { Calculator as CalculatorIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calc } from 'a-calc';
import { AnimatePresence, motion } from 'framer-motion';

const variants = {
  collapsed: {
    height: 0,
    opacity: 0,
  },
  expanded: {
    height: 'auto',
    opacity: 1,
  },
};

export function Calculator({ args }: { args?: any }) {
  const [display, setDisplay] = useState(calc(args.formula ?? '0'));

  const handleNumpadClick = (num: string) => {
    const isZeroOnly = display === '0' && display.length === 1;
    const isOp = (num: string) => /[\/\*\-\+]/.test(num);
    const isNum = (num: string) => /[0-9]/.test(num);

    const numbers = display.split(' ');
    const lastNum = numbers.at(-1) ?? '0';
    const restNum = `${lastNum.at(-1) === '.' ? '0' : ''}`;

    if (isZeroOnly && isNum(num)) {
      setDisplay(num);
    } else if (num === '=') {
      if (!isOp(lastNum)) {
        setDisplay(calc(`${numbers.join('')}${restNum}`));
      }
    } else if (isOp(num)) {
      if (!isZeroOnly) {
        setDisplay(
          `${isOp(lastNum) ? display.slice(0, -1) : `${display}${restNum}`} ${num}`,
        );
      }
    } else if (num === '.') {
      if (!lastNum.includes('.') && !isOp(lastNum)) {
        setDisplay(`${display}${num}`);
      }
    } else {
      setDisplay(`${display}${isOp(lastNum) ? ' ' : ''}${num}`);
    }
  };

  const handleClear = () => {
    setDisplay('0');
  };

  const numpads = [
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['=', '0', '.', '+'],
  ];

  const keypadButtonVariants = (key: string) => {
    switch (key) {
      case '=':
        return 'default';
      case '/':
      case '*':
      case '-':
      case '+':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const Numpads = () => {
    return numpads.map((row, index) =>
      row.map((key) => {
        if (key === undefined) {
          return null;
        }
        return (
          <Button
            key={key}
            variant={keypadButtonVariants(key)}
            size="sm"
            onClick={() => handleNumpadClick(key)}
          >
            {key}
          </Button>
        );
      }),
    );
  };
  return (
    <AnimatePresence>
      <motion.div
        key="content"
        initial="collapsed"
        animate="expanded"
        exit="collapsed"
        variants={variants}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        style={{ overflow: 'hidden' }}
      >
        <Card className="w-full overflow-hidden select-none">
          <CardHeader
            className={'flex flex-row items-center justify-between space-y-0'}
          >
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalculatorIcon className="size-4" />
              <span>Calculator</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row justify-between mb-2">
              <div className="flex align-middle pl-1 pr-2 justify-end items-center mr-2 flex-auto bg-muted rounded-md text-right font-mono">
                {display}
              </div>
              <Button variant="outline" size="sm" onClick={() => handleClear()}>
                C
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-2">{Numpads()}</div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
