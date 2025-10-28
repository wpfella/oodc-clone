


import React, { useState, useMemo } from 'react';
import { AppState, AmortizationDataPoint, LoanDetails } from '../types';
import Card from './common/Card';
import SliderInput from './common/SliderInput';
import { ComposedChart, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, CartesianGrid, Area, Scatter, ReferenceDot, LineChart, Line, Label, PieChart, Pie, Cell, ReferenceArea } from 'recharts';
import Tooltip from './common/Tooltip';
import { InfoIcon, DownloadIcon } from './common/IconComponents';
import { calculateAmortization, getMonthlyAmount } from '../hooks/useMortgageCalculations';
import Accordion from './common/Accordion';

interface Props {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  calculations: any;
}

const formatChartCurrency = (tick: number): string => {
  if (Math.abs(tick) >= 1000000) {
    return `$${(tick / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(tick) >= 1000) {
    return `$${Math.round(tick / 1000)}k`;
  }
  return `$${tick}`;
};

const CustomBarTooltip: React.FC<{ active?: boolean, payload?: any[], formatter: (value: number) => string, unit?: string }> = ({ active, payload, formatter, unit }) => {
    if (active && payload && payload.length) {
        const bankData = payload.find(p => p.dataKey === 'Bank');
        const crownData = payload.find(p => p.dataKey === 'Crown Money');
        const difference = (bankData?.value || 0) - (crownData?.value || 0);
        
        return (
            <div className="p-3 bg-[var(--tooltip-bg-color)] border border-[var(--border-color)] rounded-lg text-sm shadow-lg print:hidden space-y-1">
                {bankData && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: bankData.fill }}></div>
                        <p className="font-semibold" style={{ color: 'var(--tooltip-text-color)' }}>{`Bank: ${formatter(bankData.value)}`}</p>
                    </div>
                )}
                {crownData && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: crownData.fill }}></div>
                        <p className="font-semibold" style={{ color: 'var(--tooltip-text-color)' }}>{`Crown Money: ${formatter(crownData.value)}`}</p>
                    </div>
                )}
                
                 {difference > 0 && (
                     <>
                        <hr className="my-1 border-[var(--border-color)] opacity-50" />
                        <p style={{ color: 'var(--tooltip-text-color-muted)' }}>
                            {`Savings: `}
                            <span className="font-semibold" style={{color: 'var(--tooltip-text-color-positive)'}}>
                                {unit === 'years' ? `${difference.toFixed(1)} years` : formatter(difference)}
                            </span>
                        </p>
                    </>
                )}
            </div>
        );
    }
    // Fallback logic
    if (active && payload && payload.length) {
         return (
            <div className="p-3 bg-[var(--tooltip-bg-color)] border border-[var(--border-color)] rounded-lg text-sm shadow-lg print:hidden space-y-1">
                {payload.map((pld: any) => (
                    <div key={pld.dataKey} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: pld.fill }}></div>
                        <p className="font-semibold" style={{ color: 'var(--tooltip-text-color)' }}>{`${pld.name}: ${formatter(pld.value)}`}</p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const CustomAreaTooltip: React.FC<{ active?: boolean, payload?: any[], label?: string, formatter: (value: number) => string }> = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
        const eventPayload = payload.find(p => p.payload.event);

        // If it's an event tooltip (from the Scatter plot)
        if (eventPayload && eventPayload.payload.event) {
            const { description, amount, type } = eventPayload.payload.event;
            return (
                <div className="p-2 bg-[var(--tooltip-bg-color)] border border-[var(--border-color)] rounded-md text-sm shadow-lg print:hidden">
                    <p className="label text-[var(--tooltip-text-color)] font-bold mb-1">{description}</p>
                    <p style={{ color: `var(--tooltip-text-color-${type === 'income' ? 'positive' : 'negative'})` }}>
                        {`${type === 'income' ? 'Income: +' : 'Expense: -'}${formatter(amount)}`}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--tooltip-text-color-muted)' }}>{`At Year ${parseFloat(label || '0').toFixed(1)}`}</p>
                </div>
            );
        }
        
        // Original tooltip logic for the Area chart lines
        const bankData = payload.find(p => p.dataKey === 'Bank');
        const crownData = payload.find(p => p.dataKey === 'Crown Money');
        const difference = (bankData?.value || 0) - (crownData?.value || 0);
        const age = payload[0].payload.age;

        return (
            <div className="p-3 bg-[var(--tooltip-bg-color)] border border-[var(--border-color)] rounded-lg text-sm shadow-lg print:hidden space-y-1">
                <p className="label text-[var(--tooltip-text-color)] font-bold mb-1">{`Year: ${label} (Age: ${Math.floor(age)})`}</p>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: 'var(--chart-color-bank)' }}></div>
                    <p className="font-semibold" style={{ color: 'var(--tooltip-text-color)' }}>{`Bank Balance: ${formatter(bankData?.value || 0)}`}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: 'var(--chart-color-crown)' }}></div>
                    <p className="font-semibold" style={{ color: 'var(--tooltip-text-color)' }}>{`Crown Balance: ${formatter(crownData?.value || 0)}`}</p>
                </div>
                {difference > 0 && (
                    <>
                        <hr className="my-1 border-[var(--border-color)] opacity-50" />
                        <p style={{ color: 'var(--tooltip-text-color-muted)' }}>
                            {`Ahead by: `}
                            <span className="font-semibold" style={{color: 'var(--tooltip-text-color-positive)'}}>
                                {`${formatter(difference)}`}
                            </span>
                        </p>
                    </>
                )}
            </div>
        );
    }
    return null;
};

const RenderDot = (props: any) => {
    const { cx, cy } = props;
    if (isNaN(cx) || isNaN(cy)) {
        return null;
    }
    // Render a larger, transparent circle for hovering
    return <circle cx={cx} cy={cy} r={8} fill="transparent" />;
};


const Tab4_OODC: React.FC<Props> = ({ appState, setAppState, calculations }) => {
  const [additionalMonthlyIncome, setAdditionalMonthlyIncome] = useState(0);
  const { 
      bankLoanCalculation, 
      crownMoneyLoanCalculation: initialCrownLoanCalculation,
      totalMonthlyIncome,
      totalMonthlyExpenses,
      people,
    } = calculations;
  
  const youngestPersonAge = Math.min(...people.map((p: any) => p.age));

  const { amount, offsetBalance } = appState.loan;
  const netLoanAmount = amount - (offsetBalance || 0);
  const yAxisMax = Math.ceil((netLoanAmount + 100000) / 50000) * 50000;

  const adjustedCrownLoanCalculation = useMemo(() => {
    if (additionalMonthlyIncome === 0) {
        return initialCrownLoanCalculation;
    }
    
    const { loan, futureChanges, futureLumpSums, crownMoneyInterestRate } = appState;
    
    const baseSurplus = totalMonthlyIncome - totalMonthlyExpenses;
    const monthlyPrimaryLoanRepayment = getMonthlyAmount(loan.repayment, loan.frequency);
    const extraMonthlyPaymentForCrown = Math.max(0, (baseSurplus + additionalMonthlyIncome) - monthlyPrimaryLoanRepayment);

    const netPrimaryLoanAmount = loan.amount - (loan.offsetBalance || 0);

    const crownLoanDetailsForPrimary: LoanDetails = {
        ...loan,
        amount: netPrimaryLoanAmount,
        offsetBalance: 0,
        interestRate: crownMoneyInterestRate,
    };
    
    return calculateAmortization(crownLoanDetailsForPrimary, {
        extraMonthlyPayment: extraMonthlyPaymentForCrown,
        futureChanges,
        futureLumpSums,
        strategy: 'crown'
    });

  }, [appState, additionalMonthlyIncome, initialCrownLoanCalculation, totalMonthlyIncome, totalMonthlyExpenses]);
  
  const crownMoneyLoanCalculation = adjustedCrownLoanCalculation;

  const debtReductionChartData = useMemo(() => {
    if (!bankLoanCalculation?.amortizationSchedule || !crownMoneyLoanCalculation?.amortizationSchedule) return [];

    const bankSchedule = bankLoanCalculation.amortizationSchedule.slice(0, 12);
    const crownSchedule = crownMoneyLoanCalculation.amortizationSchedule.slice(0, 12);
    
    let cumulativeBankPrincipal = 0;
    let cumulativeCrownPrincipal = 0;
    
    const data = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        
        if (bankSchedule[i]) {
            cumulativeBankPrincipal += bankSchedule[i].principalPaid;
        }
        if (crownSchedule[i]) {
            cumulativeCrownPrincipal += crownSchedule[i].principalPaid;
        }
        
        return {
            month: month,
            'Bank Plan': cumulativeBankPrincipal,
            'Crown Money': cumulativeCrownPrincipal,
        };
    });
    
    return data;
}, [bankLoanCalculation, crownMoneyLoanCalculation]);

const CustomDebtReductionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const bankData = payload.find((p: any) => p.dataKey === 'Bank Plan');
      const crownData = payload.find((p: any) => p.dataKey === 'Crown Money');
      return (
        <div className="p-3 bg-[var(--tooltip-bg-color)] border border-[var(--border-color)] rounded-lg text-sm shadow-lg print:hidden space-y-1">
          <p className="label text-[var(--tooltip-text-color)] font-bold mb-1">{`End of Month: ${label}`}</p>
          {bankData && (
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: bankData.stroke }}></div>
                <p style={{ color: 'var(--tooltip-text-color)' }}>{`Bank Debt Reduced: ${formatCurrency(bankData.value)}`}</p>
            </div>
          )}
          {crownData && (
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: crownData.stroke }}></div>
                <p style={{ color: 'var(--tooltip-text-color)' }}>{`Crown Debt Reduced: ${formatCurrency(crownData.value)}`}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
};


  const handleRateChange = (value: number) => {
    setAppState(prev => ({ ...prev, crownMoneyInterestRate: value }));
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  
  const isBankLoanValid = bankLoanCalculation.termInYears !== Infinity;
  const isCrownLoanValid = crownMoneyLoanCalculation.termInYears !== Infinity;

  const interestSaved = isBankLoanValid && isCrownLoanValid ? bankLoanCalculation.totalInterest - crownMoneyLoanCalculation.totalInterest : 0;
  
  const bankInterestPortion = isBankLoanValid && netLoanAmount > 0 ? (bankLoanCalculation.totalInterest / netLoanAmount) * 100 : 0;
  const crownInterestPortion = isCrownLoanValid && netLoanAmount > 0 ? (crownMoneyLoanCalculation.totalInterest / netLoanAmount) * 100 : 0;


  const bankDebtFreeAges = appState.people.reduce((acc, p) => {
    acc[p.id] = isBankLoanValid ? Math.ceil(p.age + bankLoanCalculation.termInYears) : "N/A";
    return acc;
  }, {} as Record<number, number | string>);

  const crownDebtFreeAges = appState.people.reduce((acc, p) => {
    acc[p.id] = isCrownLoanValid ? Math.ceil(p.age + crownMoneyLoanCalculation.termInYears) : "N/A";
    return acc;
  }, {} as Record<number, number | string>);

  const yearsChartData = [
    { 
      name: 'Payoff Time', 
      Bank: isBankLoanValid ? bankLoanCalculation.termInYears : 0, 
      'Crown Money': isCrownLoanValid ? crownMoneyLoanCalculation.termInYears : 0 
    },
  ];

  const interestChartData = [
    { 
      name: 'Interest Paid', 
      Bank: isBankLoanValid ? bankLoanCalculation.totalInterest : 0, 
      'Crown Money': isCrownLoanValid ? crownMoneyLoanCalculation.totalInterest : 0 
    },
  ];
  
  const loanBalanceChartData = React.useMemo(() => {
    if (!isBankLoanValid || !isCrownLoanValid) return [];
    
    const { amount, offsetBalance } = appState.loan;
    const netLoanAmount = amount - (offsetBalance || 0);
    const maxMonths = Math.ceil(Math.max(bankLoanCalculation.amortizationSchedule.length, crownMoneyLoanCalculation.amortizationSchedule.length, 1));
    
    const data = [{
        year: 0,
        age: youngestPersonAge,
        'Bank': netLoanAmount,
        'Crown Money': netLoanAmount
    }];

    for (let month = 1; month <= maxMonths; month++) {
        const year = month / 12;
        const currentAge = youngestPersonAge + year;

        const bankDataPoint = bankLoanCalculation.amortizationSchedule[month-1];
        const bankBalance = bankDataPoint ? bankDataPoint.remainingBalance - bankDataPoint.offsetBalance : 0;
        
        const crownBalance = crownMoneyLoanCalculation.amortizationSchedule[month-1]?.remainingBalance ?? 0;
        
        data.push({
            year: parseFloat(year.toFixed(2)),
            age: currentAge,
            'Bank': Math.max(0, bankBalance),
            'Crown Money': Math.max(0, crownBalance)
        });
    }
    return data;
  }, [appState.loan.amount, appState.loan.offsetBalance, bankLoanCalculation, crownMoneyLoanCalculation, isBankLoanValid, isCrownLoanValid, youngestPersonAge]);
  
  const lumpSumData = useMemo(() => {
    const { amount, offsetBalance } = appState.loan;
    const netLoanAmount = amount - (offsetBalance || 0);
    const data: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    appState.futureLumpSums.forEach(lump => {
        if (!lump.date) return;
        const eventDate = new Date(lump.date);
        if (isNaN(eventDate.getTime())) return;

        const monthsDiff = (eventDate.getFullYear() - today.getFullYear()) * 12 + (eventDate.getMonth() - today.getMonth());
        if (monthsDiff < 0) return; // Ignore past events
        
        const eventMonth = monthsDiff + 1;
        const eventYear = monthsDiff / 12;

        const bankSchedule = bankLoanCalculation.amortizationSchedule;
        const crownSchedule = crownMoneyLoanCalculation.amortizationSchedule;

        const bankDataPointBeforeEvent = bankSchedule[eventMonth - 2];
        const yBank = eventMonth <= 1 
            ? netLoanAmount 
            : (bankDataPointBeforeEvent ? bankDataPointBeforeEvent.remainingBalance - bankDataPointBeforeEvent.offsetBalance : undefined);
        const yCrown = eventMonth <= 1 ? netLoanAmount : crownSchedule[eventMonth - 2]?.remainingBalance;

        if (yBank !== undefined && yCrown !== undefined) {
            data.push({
                year: eventYear,
                Bank: yBank,
                'Crown Money': yCrown,
                event: lump,
            });
        }
    });
    return data;
  }, [appState.futureLumpSums, appState.loan, bankLoanCalculation.amortizationSchedule, crownMoneyLoanCalculation.amortizationSchedule]);

  const processAmortizationSchedule = (schedule: any[]) => {
    if (!schedule) return [];

    const yearlyData: { [year: number]: { Interest: number, Principal: number } } = {};
    schedule.forEach((d: any) => {
        const year = Math.ceil(d.month / 12);
        if (!yearlyData[year]) {
            yearlyData[year] = { Interest: 0, Principal: 0 };
        }
        yearlyData[year].Interest += d.interestPaid;
        yearlyData[year].Principal += d.principalPaid;
    });

    return Object.keys(yearlyData).map(yearStr => {
        const year = parseInt(yearStr, 10);
        return {
            year: year,
            Interest: yearlyData[year].Interest,
            Principal: yearlyData[year].Principal,
        }
    });
  };

  const annualBankChartData = React.useMemo(() => processAmortizationSchedule(bankLoanCalculation.amortizationSchedule), [bankLoanCalculation.amortizationSchedule]);
  const annualCrownChartData = React.useMemo(() => processAmortizationSchedule(crownMoneyLoanCalculation.amortizationSchedule), [crownMoneyLoanCalculation.amortizationSchedule]);

  const AmortizationTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = data.Principal + data.Interest;
      return (
        <div className="p-3 bg-[var(--tooltip-bg-color)] border border-[var(--border-color)] rounded-lg text-sm shadow-lg print:hidden space-y-1">
          <p className="label text-[var(--tooltip-text-color)] font-bold mb-1">{`Year: ${label}`}</p>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: 'var(--chart-color-principal)' }}></div>
              <p className="text-[var(--tooltip-text-color)]">{`Principal Paid: ${formatCurrency(data.Principal)}`}</p>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: 'var(--chart-color-interest)' }}></div>
              <p className="text-[var(--tooltip-text-color)]">{`Interest Paid: ${formatCurrency(data.Interest)}`}</p>
          </div>
          <hr className="my-1 border-[var(--border-color)] opacity-50" />
          <p className="text-[var(--tooltip-text-color-muted)]">{`Total Paid: ${formatCurrency(total)}`}</p>
        </div>
      );
    }
    return null;
  };

  const SliderLabel = () => (
    <div className='flex items-center justify-center gap-2'>
        <span className='text-sm font-medium text-[var(--text-color)] print:text-black'>Crown Money Interest Rate</span>
        <Tooltip text="Adjust this rate to match the current interest rate offered for the Crown Money facility. This will affect the speed of debt reduction.">
            <InfoIcon className="h-4 w-4 text-[var(--text-color-muted)]"/>
        </Tooltip>
    </div>
  );

  const handleExportCSV = () => {
    const { bankLoanCalculation, crownMoneyLoanCalculation } = calculations;

    if (!bankLoanCalculation.amortizationSchedule.length && !crownMoneyLoanCalculation.amortizationSchedule.length) {
        alert("No amortization data available to export.");
        return;
    }

    const headers = ["Year", "Month", "Scenario", "InterestPaid", "PrincipalPaid", "RemainingBalance"];
    
    const formatRow = (d: AmortizationDataPoint, scenario: 'Bank' | 'Crown Money') => {
        const year = Math.ceil(d.month / 12);
        const values = [
            year,
            d.month,
            scenario,
            d.interestPaid.toFixed(2),
            d.principalPaid.toFixed(2),
            d.remainingBalance.toFixed(2)
        ];
        return values.join(',');
    };

    const bankRows = bankLoanCalculation.amortizationSchedule.map((d: AmortizationDataPoint) => formatRow(d, 'Bank'));
    const crownRows = crownMoneyLoanCalculation.amortizationSchedule.map((d: AmortizationDataPoint) => formatRow(d, 'Crown Money'));

    const csvContent = [
        headers.join(','),
        ...bankRows,
        ...crownRows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "amortization_schedules.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
  };
  
  const surplusForDebtReduction = totalMonthlyIncome - totalMonthlyExpenses;
  
  const maxYear = loanBalanceChartData.length > 0 ? Math.ceil(loanBalanceChartData[loanBalanceChartData.length - 1].year) : 30;
  const xTickInterval = Math.max(1, Math.floor(maxYear / 6)); 
  const xTicks = Array.from({ length: Math.floor(maxYear / xTickInterval) + 1 }, (_, i) => i * xTickInterval);
  if (!xTicks.includes(maxYear) && maxYear > 0) xTicks.push(maxYear);

  const { bankYear1, crownYear1 } = useMemo(() => {
    const getYear1Data = (schedule: AmortizationDataPoint[]) => {
        if (!schedule) return { interest: 0, principal: 0 };
        const year1Schedule = schedule.slice(0, 12);
        const interest = year1Schedule.reduce((sum, item) => sum + item.interestPaid, 0);
        const principal = year1Schedule.reduce((sum, item) => sum + item.principalPaid, 0);
        return { interest, principal };
    };
    return {
        bankYear1: getYear1Data(bankLoanCalculation.amortizationSchedule),
        crownYear1: getYear1Data(crownMoneyLoanCalculation.amortizationSchedule)
    };
  }, [bankLoanCalculation, crownMoneyLoanCalculation]);

  const DonutChartCard: React.FC<{
      title: string;
      principal: number;
      interest: number;
      calculationMethod?: 'interestOfPrincipal' | 'interestOfTotal';
  }> = ({ title, principal, interest, calculationMethod = 'interestOfPrincipal' }) => {
      const data = [
          { name: 'Principal', value: principal },
          { name: 'Interest', value: interest },
      ];
      
      const total = principal + interest;
      let interestPercent = 0;

      if (calculationMethod === 'interestOfTotal') {
        interestPercent = total > 0 ? (interest / total) * 100 : 0;
      } else { // default to original 'interestOfPrincipal'
        interestPercent = principal > 0 ? (interest / principal) * 100 : 0;
      }

      return (
          <div className="text-center p-2 bg-black/5 dark:bg-white/5 rounded-lg flex flex-col justify-between">
              <h5 className={`font-semibold ${title.includes('Crown') ? 'text-lg' : 'text-sm'}`}>{title}</h5>
              <div className="w-full h-40 relative">
                  <ResponsiveContainer>
                      <PieChart>
                          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={2}>
                              <Cell fill="var(--chart-color-principal)" />
                              <Cell fill="var(--chart-color-interest)" />
                          </Pie>
                      </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold" style={{color: 'var(--chart-color-interest)'}}>{interestPercent.toFixed(0)}%</span>
                      <span className="text-xs text-[var(--text-color-muted)]">Interest</span>
                  </div>
              </div>
              <div className="text-xs text-left px-1 mt-1 space-y-1">
                <div className="flex justify-between items-center">
                    <span className="text-[var(--text-color-muted)] flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--chart-color-interest)'}}></div>Interest</span>
                    <span className="font-semibold text-[var(--text-color)]">{formatCurrency(interest)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[var(--text-color-muted)] flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--chart-color-principal)'}}></div>Principal</span>
                    <span className="font-semibold text-[var(--text-color)]">{formatCurrency(principal)}</span>
                </div>
              </div>
          </div>
      );
  };

  const maxTerm = isBankLoanValid ? Math.ceil(bankLoanCalculation.termInYears) : 30;

  const paddedAnnualCrownChartData = useMemo(() => {
    const data = annualCrownChartData;
    const lastYear = data.length > 0 ? data[data.length - 1].year : 0;
    if (lastYear < maxTerm) {
        const padding = Array.from({ length: maxTerm - lastYear }, (_, i) => ({
            year: lastYear + i + 1,
            Interest: 0,
            Principal: 0,
        }));
        return [...data, ...padding];
    }
    return data;
  }, [annualCrownChartData, maxTerm]);


  const accordionItems = [
      {
          title: "1. Setup & \"What If\" Scenario",
          content: (
            <div className="space-y-6">
                 <div className="w-full md:w-3/4 mx-auto">
                    <SliderInput label={<SliderLabel />} value={appState.crownMoneyInterestRate} onChange={handleRateChange} min={1} max={15} step={0.05} unit="%" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-4">
                    <div className="p-2 bg-black/10 dark:bg-white/5 rounded-lg">
                        <h4 className="text-xs text-[var(--color-positive-text)]">Total Monthly Income</h4>
                        <p className="text-lg font-bold">{formatCurrency(totalMonthlyIncome)}</p>
                    </div>
                    <div className="p-2 bg-black/10 dark:bg-white/5 rounded-lg">
                        <h4 className="text-xs text-[var(--color-negative-text)]">Total Monthly Expenses</h4>
                        <p className="text-lg font-bold">{formatCurrency(totalMonthlyExpenses)}</p>
                    </div>
                    <div className="p-2 bg-black/10 dark:bg-white/5 rounded-lg">
                        <h4 className="text-xs text-[var(--color-surplus-text)]">Current Surplus</h4>
                        <p className="text-lg font-bold">{formatCurrency(surplusForDebtReduction)}</p>
                    </div>
                </div>
                <p className="text-xs text-center text-[var(--text-color-muted)] -mt-2 italic print:hidden">*Surplus is calculated as Total Monthly Income minus Total Monthly Living Expenses from the budget tab.</p>
                <hr className="border-[var(--border-color)] border-dashed my-4" />
                <SliderInput 
                    label={
                        <div className="flex items-center gap-1">
                            <span>Simulate Additional Monthly Income</span>
                            <Tooltip text="Use this slider to see how extra income (e.g., from a pay rise or side hustle) would accelerate your Crown Money payoff time. All charts will update instantly.">
                                <InfoIcon className="h-4 w-4 text-[var(--text-color-muted)]"/>
                            </Tooltip>
                        </div>
                    }
                    value={additionalMonthlyIncome}
                    onChange={setAdditionalMonthlyIncome}
                    min={0}
                    max={5000}
                    step={50}
                    unit="$"
                />
                <div className="mt-4 text-center p-3 rounded-lg border" style={{ backgroundColor: 'var(--color-surplus-bg)', borderColor: 'var(--color-surplus-text)' }}>
                    <span className="font-bold" style={{ color: 'var(--color-surplus-text)' }}>Adjusted Surplus for Crown Plan: </span>
                    <span className="font-bold text-lg" style={{ color: 'var(--color-surplus-text)' }}>
                        {formatCurrency(surplusForDebtReduction + additionalMonthlyIncome)}
                    </span>
                </div>
            </div>
          )
      },
      {
          title: "2. Loan Balance Trajectory",
          content: (
            <>
                {isBankLoanValid && isCrownLoanValid ? (
                  <>
                    <p className="text-sm text-[var(--text-color-muted)] mb-4">
                        This chart shows how quickly your loan balance decreases with the Crown Money strategy compared to a traditional bank loan. Hover over the chart to see details of one-off income or expense events.
                    </p>
                    <div className="w-full h-[500px]">
                        <ResponsiveContainer>
                            <ComposedChart data={loanBalanceChartData} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="year" type="number" domain={[0, 'dataMax']} ticks={xTicks} stroke="var(--text-color)" tick={{ fontSize: 12 }} label={{ value: 'Years', position: 'insideBottom', offset: -10, fill: 'var(--text-color-muted)' }} />
                                <YAxis stroke="var(--text-color)" tickFormatter={formatChartCurrency} tick={{ fontSize: 12 }} domain={[0, yAxisMax]} />
                                <RechartsTooltip content={<CustomAreaTooltip formatter={formatCurrency} />} />
                                <Legend wrapperStyle={{fontSize: "14px", color: "var(--text-color-muted)"}} verticalAlign="top" />
                                <defs>
                                    <linearGradient id="colorBank" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--chart-color-bank)" stopOpacity={0.7}/><stop offset="95%" stopColor="var(--chart-color-bank)" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorCrown" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--chart-color-crown)" stopOpacity={0.7}/><stop offset="95%" stopColor="var(--chart-color-crown)" stopOpacity={0}/></linearGradient>
                                </defs>
                                {isCrownLoanValid && isBankLoanValid && bankLoanCalculation.termInYears > crownMoneyLoanCalculation.termInYears && (
                                    <ReferenceArea
                                        x1={crownMoneyLoanCalculation.termInYears}
                                        x2={bankLoanCalculation.termInYears}
                                        y1={0}
                                        y2={yAxisMax}
                                        stroke="var(--chart-color-wealth)"
                                        strokeOpacity={0.3}
                                        fill="var(--chart-color-wealth)"
                                        fillOpacity={0.1}
                                        ifOverflow="extendDomain"
                                    >
                                        <Label value="Savings & Investment Period" angle={90} position="insideTopLeft" fill="var(--chart-color-wealth)" offset={20} />
                                    </ReferenceArea>
                                )}
                                
                                <Area type="linear" dataKey="Bank" stroke="none" fillOpacity={1} fill="url(#colorBank)" legendType="none" />
                                <Line type="linear" name="Bank" dataKey="Bank" stroke="var(--chart-color-bank)" strokeWidth={2} dot={false} />

                                <Area type="linear" dataKey="Crown Money" stroke="none" fillOpacity={1} fill="url(#colorCrown)" legendType="none" />
                                <Line type="linear" name="Crown Money" dataKey="Crown Money" stroke="var(--chart-color-crown)" strokeWidth={3} dot={false} />

                                <Scatter legendType="none" data={lumpSumData} dataKey="Bank" fill="transparent" shape={<RenderDot />} />
                                <Scatter legendType="none" data={lumpSumData} dataKey="Crown Money" fill="transparent" shape={<RenderDot />} />
                                {isBankLoanValid && isFinite(bankLoanCalculation.termInYears) && bankLoanCalculation.termInYears > 0 && (
                                    <ReferenceDot x={bankLoanCalculation.termInYears} y={0} r={6} fill="var(--chart-color-bank)" stroke="var(--bg-color)" strokeWidth={2} ifOverflow="extendDomain" label={{ value: "Home Paid Off", position: 'top', fill: 'var(--chart-color-bank)', fontSize: 12, dy: -10 }} />
                                )}
                                 {isCrownLoanValid && isFinite(crownMoneyLoanCalculation.termInYears) && crownMoneyLoanCalculation.termInYears > 0 && (
                                    <ReferenceDot x={crownMoneyLoanCalculation.termInYears} y={0} r={6} fill="var(--chart-color-crown)" stroke="var(--bg-color)" strokeWidth={2} ifOverflow="extendDomain" label={{ value: "Home Paid Off 🏆", position: 'top', fill: 'var(--chart-color-crown)', fontSize: 12, dy: -10, fontWeight: 'bold' }} />
                                )}
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-center text-[var(--text-color-muted)] mt-3 italic print:hidden">*This chart tracks the remaining loan principal over time for both scenarios.</p>
                  </>
                ) : <p className="text-center text-[var(--text-color-muted)]">Data not available.</p>}
              </>
          )
      },
      {
          title: "3. Your Savings Snapshot",
          content: (
            <>
              {isBankLoanValid && isCrownLoanValid && interestSaved > 0 && (
                  <div className="space-y-6">
                      <div className="text-center">
                          <p className="text-lg text-[var(--text-color-muted)]">Total Interest Saved:</p>
                          <p className="text-5xl font-extrabold my-2 animate-pulse" style={{color: 'var(--chart-color-crown)'}}>{formatCurrency(interestSaved)}</p>
                          <p className="text-lg text-[var(--text-color-muted)]">Years saved:</p>
                          <p className="text-5xl font-extrabold my-2" style={{color: 'var(--chart-color-crown)'}}>{(bankLoanCalculation.termInYears - crownMoneyLoanCalculation.termInYears).toFixed(1)}</p>
                      </div>
                      <p className="text-xs text-center text-[var(--text-color-muted)] mt-2 italic print:hidden">*Interest Saved is the difference between the total interest paid in the Bank scenario and the Crown Money scenario.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          <div>
                              <h4 className="text-center text-[var(--text-color-muted)] mb-2">Payoff Time Comparison (Years)</h4>
                              <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <BarChart data={yearsChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)"/>
                                        <XAxis type="category" dataKey="name" hide={true} />
                                        <YAxis stroke="var(--text-color)" domain={[0, 'dataMax + 5']} tickFormatter={(tick) => tick.toFixed(0)} label={{ value: 'Years', angle: -90, position: 'insideLeft', fill: 'var(--text-color-muted)' }} />
                                        <RechartsTooltip content={<CustomBarTooltip formatter={(value: number) => `${value.toFixed(1)} years`} unit="years" />} cursor={{fill: 'var(--card-bg-color)'}} />
                                        <Legend verticalAlign="top" wrapperStyle={{color: "var(--text-color-muted)"}} />
                                        <Bar dataKey="Bank" fill="var(--chart-color-bank)" barSize={60} />
                                        <Bar dataKey="Crown Money" fill="var(--chart-color-crown)" barSize={60} />
                                    </BarChart>
                                </ResponsiveContainer>
                              </div>
                          </div>
                          <div>
                              <h4 className="text-center text-[var(--text-color-muted)] mb-2">Total Interest Comparison ($)</h4>
                              <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <BarChart data={interestChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)"/>
                                        <XAxis type="category" dataKey="name" hide={true} />
                                        <YAxis stroke="var(--text-color)" tickFormatter={formatChartCurrency} label={{ value: '$', angle: -90, position: 'insideLeft', fill: 'var(--text-color-muted)' }} />
                                        <RechartsTooltip content={<CustomBarTooltip formatter={(value: number) => formatCurrency(value)} unit="currency" />} cursor={{fill: 'var(--card-bg-color)'}} />
                                        <Legend verticalAlign="top" wrapperStyle={{color: "var(--text-color-muted)"}}/>
                                        <Bar dataKey="Bank" fill="var(--chart-color-bank)" barSize={60} />
                                        <Bar dataKey="Crown Money" fill="var(--chart-color-crown)" barSize={60} />
                                    </BarChart>
                                </ResponsiveContainer>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
            </>
          )
      },
      {
          title: "4. Interest vs. Principal Comparison",
          content: (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-semibold text-center mb-2">First Year Comparison</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <DonutChartCard title="Bank" principal={bankYear1.principal} interest={bankYear1.interest} calculationMethod="interestOfTotal" />
                            <DonutChartCard title="Crown Money 🏆" principal={crownYear1.principal} interest={crownYear1.interest} calculationMethod="interestOfTotal" />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-center mb-2">Lifetime Comparison</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <DonutChartCard title="Bank" principal={netLoanAmount} interest={bankLoanCalculation.totalInterest} />
                            <DonutChartCard title="Crown Money 🏆" principal={netLoanAmount} interest={crownMoneyLoanCalculation.totalInterest} />
                        </div>
                    </div>
                </div>
                <p className="text-xs text-center text-[var(--text-color-muted)] mt-3 italic print:hidden">*The donut charts show the interest paid as a percentage of the principal paid for the given timeframe (First Year vs. Lifetime of the loan).</p>
            </div>
          )
      },
      {
          title: "5. Debt Reduction Speed (First 12 Months)",
          content: (
             <>
                {isBankLoanValid && isCrownLoanValid && debtReductionChartData.length > 0 ? (
                  <>
                    <p className="text-sm text-[var(--text-color-muted)] mb-4">
                        This chart shows the cumulative principal paid off (debt reduction) over the first 12 months. The steeper the line, the faster you are paying down your debt.
                    </p>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <LineChart data={debtReductionChartData} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="month" stroke="var(--text-color)" tick={{ fontSize: 12 }}>
                                    <Label value="Month" position="insideBottom" offset={-10} fill="var(--text-color-muted)" />
                                </XAxis>
                                <YAxis stroke="var(--text-color)" tickFormatter={formatChartCurrency} tick={{ fontSize: 12 }}>
                                     <Label value="Debt Reduction" angle={-90} position="insideLeft" offset={-10} style={{ textAnchor: 'middle', fill: 'var(--text-color-muted)' }} />
                                </YAxis>
                                <RechartsTooltip content={<CustomDebtReductionTooltip />} cursor={{ stroke: 'var(--text-color-muted)', strokeDasharray: '3 3' }} />
                                <Legend wrapperStyle={{fontSize: "14px", color: "var(--text-color-muted)"}} verticalAlign="top" iconType="square" />
                                <Line type="monotone" name="Bank Plan" dataKey="Bank Plan" stroke="var(--chart-color-bank)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                <Line type="monotone" name="Crown Money" dataKey="Crown Money" stroke="var(--chart-color-crown)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                  </>
                ) : <p className="text-center text-[var(--text-color-muted)]">Data not available.</p>}
              </>
          )
      },
      {
          title: "6. Detailed Comparison Table",
          content: (
            <>
              {isCrownLoanValid ? (
                  <div className="space-y-6">
                      <div>
                        <div className='flex items-center justify-center gap-2 mb-2'>
                          <h4 className="text-center font-semibold text-base text-[var(--text-color-muted)]">Loan Payoff Time</h4>
                          <Tooltip text="The total time it will take to pay off the loan completely. The Crown Money strategy uses your budget surplus to make extra repayments and reduce this time.">
                              <InfoIcon className="h-4 w-4 text-[var(--text-color-muted)]"/>
                          </Tooltip>
                        </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-3 rounded-lg"><p className="text-xs font-medium text-[var(--chart-color-bank)]">BANK</p><p className="text-3xl font-bold text-[var(--text-color)]">{isBankLoanValid ? bankLoanCalculation.termInYears.toFixed(1) : 'N/A'}</p><p className="text-sm text-[var(--text-color-muted)]">Years</p></div>
                              <div className="text-center p-3 rounded-lg bg-[var(--chart-color-crown)]/10"><p className="text-xs font-medium text-[var(--chart-color-crown)]">CROWN MONEY 🏆</p><p className="text-3xl font-bold text-[var(--chart-color-crown)]">{isCrownLoanValid ? crownMoneyLoanCalculation.termInYears.toFixed(1) : 'N/A'}</p><p className="text-sm text-[var(--text-color-muted)]">Years</p></div>
                          </div>
                      </div>
                      <hr className="border-[var(--border-color)]" />
                      <div>
                          <h4 className="text-center font-semibold text-base text-[var(--text-color-muted)] mb-2">Debt Free By Age</h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="text-center space-y-1 p-3 rounded-lg"><p className="text-xs font-medium text-[var(--chart-color-bank)] mb-1">BANK</p>{appState.people.map(p => (<p key={p.id} className="text-lg font-bold text-[var(--text-color)]">{p.name}: {bankDebtFreeAges[p.id]}</p>))}</div>
                              <div className="text-center space-y-1 p-3 rounded-lg bg-[var(--chart-color-crown)]/10"><p className="text-xs font-medium text-[var(--chart-color-crown)] mb-1">CROWN MONEY 🏆</p>{appState.people.map(p => (<p key={p.id} className="text-lg font-bold text-[var(--chart-color-crown)]">{p.name}: {crownDebtFreeAges[p.id]}</p>))}</div>
                          </div>
                      </div>
                      <hr className="border-[var(--border-color)]" />
                      <div>
                         <div className='flex items-center justify-center gap-2 mb-2'><h4 className="text-center font-semibold text-base text-[var(--text-color-muted)]">Total Interest Paid</h4><Tooltip text="The total interest you will pay over the entire life of the loan. A lower number means more of your money stays in your pocket."><InfoIcon className="h-4 w-4 text-[var(--text-color-muted)]"/></Tooltip></div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-3 rounded-lg"><p className="text-xs font-medium text-[var(--chart-color-bank)] mb-1">BANK</p><p className="text-2xl font-bold text-[var(--text-color)]">{isBankLoanValid ? formatCurrency(bankLoanCalculation.totalInterest) : 'N/A'}</p></div>
                              <div className="text-center p-3 rounded-lg bg-[var(--chart-color-crown)]/10"><p className="text-xs font-medium text-[var(--chart-color-crown)] mb-1">CROWN MONEY 🏆</p><p className="text-2xl font-bold text-[var(--chart-color-crown)]">{isCrownLoanValid ? formatCurrency(crownMoneyLoanCalculation.totalInterest) : 'N/A'}</p></div>
                          </div>
                      </div>
                      <hr className="border-[var(--border-color)]" />
                      <div>
                         <div className='flex items-center justify-center gap-2 mb-2'><h4 className="text-center font-semibold text-base text-[var(--text-color-muted)]">Interest as % of Principal Paid</h4><Tooltip text="The total interest paid over the life of the loan, shown as a percentage of the original loan principal. A lower percentage is better."><InfoIcon className="h-4 w-4 text-[var(--text-color-muted)]"/></Tooltip></div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-3 rounded-lg"><p className="text-xs font-medium text-[var(--chart-color-bank)] mb-1">BANK</p><p className="text-2xl font-bold text-[var(--text-color)]">{isBankLoanValid ? bankInterestPortion.toFixed(0) : 'N/A'}<span className="text-xl">%</span></p></div>
                              <div className="text-center p-3 rounded-lg bg-[var(--chart-color-crown)]/10"><p className="text-xs font-medium text-[var(--chart-color-crown)] mb-1">CROWN MONEY 🏆</p><p className="text-2xl font-bold text-[var(--chart-color-crown)]">{isCrownLoanValid ? crownInterestPortion.toFixed(0) : 'N/A'}<span className="text-xl">%</span></p></div>
                          </div>
                      </div>
                  </div>
              ) : <p className="text-center text-[var(--text-color-muted)]">Data not available.</p>}
            </>
          )
      },
      {
          title: "7. Annual Amortization Charts",
          content: (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                  <h4 className="font-semibold text-center mb-2">Your Bank's Plan</h4>
                  <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                       <BarChart data={annualBankChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                          <XAxis dataKey="year" stroke="var(--text-color)" type="number" domain={[0, maxTerm]} allowDecimals={false} tick={{ fontSize: 12 }} label={{ value: 'Years', position: 'insideBottom', offset: -10, fill: 'var(--text-color-muted)' }} />
                          <YAxis stroke="var(--text-color)" tickFormatter={formatChartCurrency} tick={{ fontSize: 12 }} />
                          <RechartsTooltip content={<AmortizationTooltip />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} />
                          <Legend iconType="square" wrapperStyle={{fontSize: "14px", color: "var(--text-color-muted)", paddingTop: '20px' }} />
                          <Bar dataKey="Principal" name="Principal Paid" stackId="a" fill="var(--chart-color-principal)" />
                          <Bar dataKey="Interest" name="Interest Paid" stackId="a" fill="var(--chart-color-interest)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
              </div>
               <div>
                  <h4 className="font-semibold text-center mb-2">The Crown Money Plan</h4>
                  {crownMoneyLoanCalculation.termInYears === Infinity ? (
                      <div className="h-full flex items-center justify-center" style={{minHeight: '400px'}}><div className="text-center text-yellow-400 p-4 bg-yellow-900/50 rounded-lg"><p className="font-bold">Cannot calculate plan.</p></div></div>
                  ) : (
                      <div style={{ width: '100%', height: 400 }}>
                      <ResponsiveContainer>
                          <BarChart data={paddedAnnualCrownChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                              <XAxis dataKey="year" stroke="var(--text-color)" type="number" domain={[0, maxTerm]} allowDecimals={false} tick={{ fontSize: 12 }} label={{ value: 'Years', position: 'insideBottom', offset: -10, fill: 'var(--text-color-muted)' }} />
                              <YAxis stroke="var(--text-color)" tickFormatter={formatChartCurrency} tick={{ fontSize: 12 }} />
                              <RechartsTooltip content={<AmortizationTooltip />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} />
                              <Legend iconType="square" wrapperStyle={{fontSize: "14px", color: "var(--text-color-muted)", paddingTop: '20px' }} />
                              <Bar dataKey="Principal" name="Principal Paid" stackId="a" fill="var(--chart-color-principal)" />
                              <Bar dataKey="Interest" name="Interest Paid" stackId="a" fill="var(--chart-color-interest)" />
                          </BarChart>
                      </ResponsiveContainer>
                      </div>
                  )}
              </div>
            </div>
          )
      },
      {
          title: "8. Data Export",
          content: (
            <>
                <div className="flex justify-center">
                    <button onClick={handleExportCSV} className="flex items-center gap-2 p-2 px-4 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <DownloadIcon className="h-5 w-5" />
                        <span>Export Amortization Schedules (CSV)</span>
                    </button>
                </div>
                <p className="text-center text-xs text-[var(--text-color-muted)] mt-3">
                    Download a detailed month-by-month breakdown for both scenarios for your own analysis.
                </p>
            </>
          )
      }
  ];

  if (!isCrownLoanValid) {
    return (
      <Card>
        <div className="text-center text-yellow-400 p-4 bg-yellow-900/50 rounded-lg">
            <p className="font-bold text-lg">Unable to calculate Crown Money scenario.</p>
            <p>Monthly expenses exceed monthly income. Please review the budget on the 'Income & Expenses' tab.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Accordion items={accordionItems} />
    </div>
  );
};

export default React.memo(Tab4_OODC);