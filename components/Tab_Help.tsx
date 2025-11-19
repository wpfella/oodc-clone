import React, { useState, useEffect, useMemo } from 'react';
import { AppState } from '../types';
import Card from './common/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PrintIcon, EmailIcon, FacebookIcon, TwitterIcon, LinkedInIcon, InfoIcon } from './common/IconComponents';
import Tooltip from './common/Tooltip';
import { calculateAmortization } from '../hooks/useMortgageCalculations';

interface Props {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  calculations: any;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const EditableMetric: React.FC<{
    title: string;
    tooltipText?: string;
    value: number;
    onChange: (value: string) => void;
    colorClass?: string;
    isCurrency?: boolean;
}> = ({ title, tooltipText, value, onChange, colorClass = 'text-[var(--text-color)] print:text-black', isCurrency = true }) => {
    
    const [internalValue, setInternalValue] = useState(String(Math.round(value)));

    useEffect(() => {
        setInternalValue(String(Math.round(value)));
    }, [value]);

    const handleBlur = () => {
        onChange(internalValue);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cleanValue = e.target.value.replace(/[^0-9]/g, '');
        setInternalValue(cleanValue);
    };

    const formattedValue = new Intl.NumberFormat('en-AU').format(Number(internalValue) || 0);
    
    const titleContent = (
        <div className="flex items-center justify-center gap-1 h-5">
            <span className="text-sm text-[var(--text-color-muted)] print:text-gray-600">{title}</span>
            {tooltipText && (
                <Tooltip text={tooltipText}>
                    <InfoIcon className="h-4 w-4 text-[var(--text-color-muted)] cursor-help" />
                </Tooltip>
            )}
        </div>
    );

    return (
        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-lg text-center print:bg-gray-50">
            {titleContent}
            <div className="mt-1 flex justify-center items-center tabular-nums">
                {isCurrency && <span className={`text-2xl font-bold ${colorClass}`}>$</span>}
                <input
                    type="text"
                    value={formattedValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    className={`w-auto bg-transparent text-left text-2xl font-bold focus:outline-none focus:ring-1 focus:ring-[var(--title-color)] rounded-md ${colorClass} p-1 text-center`}
                    size={Math.max(4, formattedValue.length)}
                />
            </div>
        </div>
    );
};


const ReadOnlyMetric: React.FC<{
    title: string;
    tooltipText?: string;
    value: string;
    colorClass?: string;
}> = ({ title, tooltipText, value, colorClass = 'text-[var(--text-color)] print:text-black' }) => {
    const titleContent = (
        <div className="flex items-center justify-center gap-1 h-5">
            <span className="text-sm text-[var(--text-color-muted)] print:text-gray-600">{title}</span>
            {tooltipText && (
                <Tooltip text={tooltipText}>
                    <InfoIcon className="h-4 w-4 text-[var(--text-color-muted)] cursor-help" />
                </Tooltip>
            )}
        </div>
    );
    
    return (
        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-lg text-center print:bg-gray-50">
            {titleContent}
            <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</p>
        </div>
    );
};

const formatChartCurrency = (tick: number): string => {
    if (Math.abs(tick) >= 1000) {
        return `$${Math.round(tick / 1000)}k`;
    }
    return `$${tick}`;
};

const CustomBarTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const principal = payload.find((p: any) => p.dataKey === 'Principal')?.value || 0;
        const interest = payload.find((p: any) => p.dataKey === 'Interest')?.value || 0;
        const total = principal + interest;
        
        return (
            <div className="p-3 bg-[var(--tooltip-bg-color)] border border-[var(--border-color)] rounded-lg text-sm shadow-lg print:hidden space-y-1">
                <p className="label text-[var(--tooltip-text-color)] font-bold mb-1">{label}</p>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: 'var(--chart-color-principal)' }}></div>
                    <p className="text-[var(--tooltip-text-color)]">{`Principal: ${formatCurrency(principal)}`}</p>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: 'var(--chart-color-interest)' }}></div>
                    <p className="text-[var(--tooltip-text-color)]">{`Interest: ${formatCurrency(interest)}`}</p>
                </div>
                 <hr className="my-1 border-[var(--border-color)] opacity-50" />
                <p className="text-[var(--tooltip-text-color-muted)]">{`Total Paid: ${formatCurrency(total)}`}</p>
            </div>
        );
    }
    return null;
};

interface ReportData {
    startingBalance: number;
    principalPaid: number;
    interestPaid: number;
    endingBalance: number;
}
interface EditableReportState {
    bank: ReportData;
    crown: ReportData;
    actual: ReportData;
}

const Tab_Reports: React.FC<Props> = ({ appState, calculations }) => {
  const [period, setPeriod] = useState<3 | 6 | 12>(6);
  const [showActuals, setShowActuals] = useState(false);
  const [actualAdditionalRepayment, setActualAdditionalRepayment] = useState(0);

  const { reportCalculations, bankLoanCalculation, crownMoneyLoanCalculation, people, debtRecyclingCalculation } = calculations;
  const { clientEmail } = appState;

  const [editableData, setEditableData] = useState<EditableReportState | null>(null);
  
  const primaryBorrower = people[0] || { age: 0 };

  useEffect(() => {
    const bankData = reportCalculations.bankFuture[period];
    const crownData = reportCalculations.crownFuture[period];

    setEditableData({
        bank: { ...bankData },
        crown: { ...crownData },
        actual: {
            startingBalance: bankData.startingBalance,
            principalPaid: 0,
            interestPaid: 0,
            endingBalance: bankData.startingBalance,
        }
    });
    setActualAdditionalRepayment(0); // Reset additional repayment when period changes
  }, [period, reportCalculations]);

  const handleDataChange = (scenario: 'bank' | 'crown' | 'actual', field: keyof ReportData, value: string) => {
    const numericValue = parseFloat(value.replace(/,/g, '')) || 0;
    setEditableData(prev => {
        if (!prev) return null;
        const newState = JSON.parse(JSON.stringify(prev)); // Deep copy
        newState[scenario][field] = numericValue;
        
        // Auto-recalculate ending balance
        newState[scenario].endingBalance = newState[scenario].startingBalance - newState[scenario].principalPaid;
        
        return newState;
    });
  };

  const debtRecyclingOpportunity = useMemo(() => {
    if (!debtRecyclingCalculation || debtRecyclingCalculation.termInYears === Infinity) {
        return { availableToRecycle: 0, projectedEarnings: 0 };
    }

    const periodSchedule = debtRecyclingCalculation.amortizationSchedule.slice(0, period);
    const principalPaidInPeriod = periodSchedule.reduce((sum: number, item: any) => sum + item.principalPaid, 0);

    const availableToRecycle = principalPaidInPeriod * (appState.debtRecyclingPercentage / 100);
    
    const annualizedReturn = availableToRecycle * (appState.debtRecyclingInvestmentRate / 100);
    const annualizedInterestCost = availableToRecycle * (appState.debtRecyclingLoanInterestRate / 100);
    const profitBeforeTax = annualizedReturn - annualizedInterestCost;
    const tax = profitBeforeTax > 0 ? profitBeforeTax * (appState.marginalTaxRate / 100) : 0;
    const annualProfit = profitBeforeTax - tax;
    
    const projectedEarnings = annualProfit * (period / 12);

    return { availableToRecycle, projectedEarnings };

  }, [debtRecyclingCalculation, period, appState]);


  const getDebtFreeInfo = (termInYears: number, personAge: number) => {
    if (!isFinite(termInYears) || termInYears <= 0) {
        return { date: "N/A", age: "N/A" };
    }
    const today = new Date();
    const futureDate = new Date(new Date().setMonth(today.getMonth() + Math.round(termInYears * 12)));
    const date = futureDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const age = Math.ceil(personAge + termInYears);
    return { date, age };
  };

  const bankDebtFree = getDebtFreeInfo(bankLoanCalculation.termInYears, primaryBorrower.age);
  const crownDebtFree = getDebtFreeInfo(crownMoneyLoanCalculation.termInYears, primaryBorrower.age);
  
  const actualDebtFree = useMemo(() => {
    if (!editableData?.actual) return { date: "N/A", age: "N/A" };
    
    const { principalPaid, interestPaid, endingBalance } = editableData.actual;

    if (endingBalance <= 0) {
        const termInYears = period / 12;
        return getDebtFreeInfo(termInYears, primaryBorrower.age);
    }
    
    const avgMonthlyPayment = (principalPaid + interestPaid) / period;
    const projectedMonthlyRepayment = avgMonthlyPayment + actualAdditionalRepayment;

    const monthlyInterestOnEndingBalance = endingBalance * (appState.loan.interestRate / 100 / 12);
    if (projectedMonthlyRepayment <= monthlyInterestOnEndingBalance && projectedMonthlyRepayment > 0) {
        return { date: "Never", age: "∞" };
    }

    const remainingLoanCalc = calculateAmortization({
        amount: endingBalance,
        interestRate: appState.loan.interestRate,
        repayment: projectedMonthlyRepayment,
        frequency: 'monthly',
        offsetBalance: 0
    }, {});
    
    if (!isFinite(remainingLoanCalc.termInYears)) {
        return { date: "Never", age: "∞" };
    }
    
    const totalTermInYears = (period / 12) + remainingLoanCalc.termInYears;
    return getDebtFreeInfo(totalTermInYears, primaryBorrower.age);

  }, [editableData, period, actualAdditionalRepayment, appState.loan.interestRate, primaryBorrower.age]);

  const chartData = useMemo(() => {
      if (!editableData) return [];
      const data = [
          { name: `Bank (Next ${period}m)`, Principal: editableData.bank.principalPaid, Interest: editableData.bank.interestPaid },
          { name: `Crown (Next ${period}m)`, Principal: editableData.crown.principalPaid, Interest: editableData.crown.interestPaid },
      ];
      if (showActuals) {
          data.push({ name: `Actuals (Next ${period}m)`, Principal: editableData.actual.principalPaid, Interest: editableData.actual.interestPaid });
      }
      return data;
  }, [editableData, period, showActuals]);


  const acceleratedPrincipal = editableData ? editableData.crown.principalPaid - editableData.bank.principalPaid : 0;
  const interestSavings = editableData ? editableData.bank.interestPaid - editableData.crown.interestPaid : 0;

  const handlePrint = () => window.print();

  const getShareText = () => `Check out my projected savings with Crown Money! In the next ${period} months, I'm on track to pay off an extra ${formatCurrency(acceleratedPrincipal)} in principal and save ${formatCurrency(interestSavings)} in interest compared to staying with my current bank. #CrownMoney #DebtFree #FinancialFreedom`;

  const handleEmail = () => {
    if (!editableData) return;
    const subject = `My Crown Money ${period}-Month Report`;
    const body = `Hi,\n\nHere is a summary of my financial progress projection with Crown Money for the next ${period} months, compared to if I stayed with the bank:\n\nNEXT ${period} MONTHS (BANK):\n- Principal Paid: ${formatCurrency(editableData.bank.principalPaid)}\n- Interest Paid: ${formatCurrency(editableData.bank.interestPaid)}\n\nNEXT ${period} MONTHS (CROWN MONEY):\n- Principal Paid: ${formatCurrency(editableData.crown.principalPaid)}\n- Interest Paid: ${formatCurrency(editableData.crown.interestPaid)}\n\nIMPACT:\n- Accelerated Principal Reduction: ${formatCurrency(acceleratedPrincipal)}\n- Immediate Interest Savings: ${formatCurrency(interestSavings)}\n\nThis shows the powerful, immediate impact of the Crown Money strategy.\n\nRegards,`;
    window.location.href = `mailto:${clientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  
  const socialShareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://crownmoney.com.au')}&quote=${encodeURIComponent(getShareText())}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent('https://crownmoney.com.au')}&title=${encodeURIComponent(`My Crown Money Progress`)}&summary=${encodeURIComponent(getShareText())}`,
  };
  
  if (!editableData) {
      return <div>Loading report...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in print:space-y-4">
      <Card title="Performance Report">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 print:hidden">
          <p className="text-sm text-[var(--text-color-muted)] text-center sm:text-left">
            Compare projections for staying with the bank vs. switching to Crown, and track your actual progress. All numbers are editable.
          </p>
          <div className="flex-shrink-0 flex items-center gap-2 p-1 rounded-full bg-[var(--input-bg-color)] border border-[var(--border-color)]">
            {[3, 6, 12].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p as 3 | 6 | 12)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${period === p ? 'bg-[var(--title-color)] text-white' : 'text-[var(--text-color-muted)] hover:bg-white/5'}`}
              >
                {p} Months
              </button>
            ))}
          </div>
        </div>
        <div className="hidden print:block text-center mb-4">
            <h2 className="text-xl font-bold">Performance Report: Next {period} Months</h2>
        </div>
        
        <div className={`grid grid-cols-1 ${showActuals ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 print:grid-cols-3`}>
          {/* Bank Column */}
          <div className="p-4 rounded-lg bg-black/5 dark:bg-white/5 space-y-4 print:p-2 print:border print:border-gray-200">
            <h3 className="text-lg font-bold text-center text-[var(--chart-color-bank)] print:text-base print:text-black">Projection (Bank)</h3>
            <EditableMetric title="Starting Loan Balance" tooltipText="The loan balance at the start of the selected period." value={editableData.bank.startingBalance} onChange={(v) => handleDataChange('bank', 'startingBalance', v)} />
            <EditableMetric title="Principal Paid" tooltipText="The amount of your repayments that went towards reducing the loan balance." value={editableData.bank.principalPaid} onChange={(v) => handleDataChange('bank', 'principalPaid', v)} colorClass="text-[var(--chart-color-principal)] print:text-blue-600" />
            <EditableMetric title="Interest Paid" tooltipText="The amount of your repayments that went to the bank as interest." value={editableData.bank.interestPaid} onChange={(v) => handleDataChange('bank', 'interestPaid', v)} colorClass="text-[var(--chart-color-interest)] print:text-pink-600" />
            <ReadOnlyMetric title="Ending Loan Balance" tooltipText="The projected loan balance at the end of the period. Calculation: Starting Balance - Principal Paid." value={formatCurrency(editableData.bank.endingBalance)} />
            <ReadOnlyMetric title="Est. Debt Free Date" tooltipText="The estimated date when the loan will be fully paid off, based on this projection." value={`${bankDebtFree.date}`} />
            <ReadOnlyMetric title="Est. Debt Free Age" tooltipText="Your estimated age when the loan will be fully paid off." value={`${bankDebtFree.age}`} />
          </div>
          
          {/* Crown Column */}
          <div className="p-4 rounded-lg bg-[var(--chart-color-crown)]/10 space-y-4 print:p-2 print:border print:border-purple-200">
            <h3 className="text-lg font-bold text-center text-[var(--chart-color-crown)] print:text-base print:text-purple-700">Projection (Crown) 🏆</h3>
            <EditableMetric title="Starting Loan Balance" tooltipText="The total consolidated debt balance at the start of the period." value={editableData.crown.startingBalance} onChange={(v) => handleDataChange('crown', 'startingBalance', v)} />
            <EditableMetric title="Principal Paid" tooltipText="The amount of your surplus that went towards reducing the total debt balance." value={editableData.crown.principalPaid} onChange={(v) => handleDataChange('crown', 'principalPaid', v)} colorClass="text-[var(--chart-color-principal)] print:text-blue-600" />
            <EditableMetric title="Interest Paid" tooltipText="The amount of interest paid with the Crown Money strategy." value={editableData.crown.interestPaid} onChange={(v) => handleDataChange('crown', 'interestPaid', v)} colorClass="text-[var(--chart-color-interest)] print:text-pink-600" />
            <ReadOnlyMetric title="Ending Loan Balance" tooltipText="The projected total debt balance at the end of the period." value={formatCurrency(editableData.crown.endingBalance)} colorClass="text-[var(--chart-color-crown)] print:text-purple-700"/>
            <ReadOnlyMetric title="Est. Debt Free Date" tooltipText="The estimated date when all consolidated debt will be fully paid off." value={`${crownDebtFree.date}`} colorClass="text-[var(--chart-color-crown)] print:text-purple-700" />
            <ReadOnlyMetric title="Est. Debt Free Age" tooltipText="Your estimated age when all consolidated debt will be fully paid off." value={`${crownDebtFree.age}`} colorClass="text-[var(--chart-color-crown)] print:text-purple-700" />
          </div>

           {/* Actuals Column or Add Button */}
           {showActuals ? (
                <div className="p-4 rounded-lg bg-black/10 dark:bg-white/10 space-y-4 print:p-2 print:border print:border-gray-300">
                    <h3 className="text-lg font-bold text-center text-[var(--text-color)] print:text-base print:text-black">Your Actuals</h3>
                    <EditableMetric title="Starting Loan Balance" tooltipText="Enter your actual loan balance at the start of the period." value={editableData.actual.startingBalance} onChange={(v) => handleDataChange('actual', 'startingBalance', v)} />
                    <EditableMetric title="Principal Paid" tooltipText="Enter the total principal you actually paid off during this period." value={editableData.actual.principalPaid} onChange={(v) => handleDataChange('actual', 'principalPaid', v)} colorClass="text-[var(--chart-color-principal)] print:text-blue-600" />
                    <EditableMetric title="Interest Paid" tooltipText="Enter the total interest you actually paid during this period." value={editableData.actual.interestPaid} onChange={(v) => handleDataChange('actual', 'interestPaid', v)} colorClass="text-[var(--chart-color-interest)] print:text-pink-600" />
                    <EditableMetric title="Additional Repayment" tooltipText="What if you made an extra monthly payment going forward? Enter an amount to see its impact on your debt-free date." value={actualAdditionalRepayment} onChange={(v) => setActualAdditionalRepayment(parseFloat(v.replace(/,/g, '')) || 0)} />
                    <ReadOnlyMetric title="Ending Loan Balance" tooltipText="Your actual ending balance based on your inputs." value={formatCurrency(editableData.actual.endingBalance)} />
                    <ReadOnlyMetric title="Est. Debt Free Date" tooltipText="A new projection of your debt-free date based on your actual performance plus any additional repayment." value={`${actualDebtFree.date}`} />
                    <ReadOnlyMetric title="Est. Debt Free Age" tooltipText="Your new projected debt-free age based on actual performance." value={`${actualDebtFree.age}`} />
                    <div className="p-3 text-center !mt-8">
                        <h4 className="text-sm text-[var(--text-color-muted)] print:text-gray-600">Notes for this period</h4>
                        <textarea className="w-full h-24 mt-2 bg-transparent text-sm border border-dashed border-[var(--input-border-color)] rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-[var(--title-color)] print:border-gray-300" placeholder="e.g., Received a bonus in March, paid extra off the loan..."></textarea>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-[var(--border-color)] print:hidden">
                    <button onClick={() => setShowActuals(true)} className="flex flex-col items-center justify-center text-center text-[var(--text-color-muted)] hover:text-[var(--title-color)] transition-colors">
                        <span className="text-4xl font-light">+</span>
                        <span className="text-sm font-semibold">Add Actuals</span>
                        <span className="text-xs mt-1">Track your real performance.</span>
                    </button>
                </div>
            )}
        </div>
      </Card>
      
      <Card title="Visual Comparison: Principal vs Interest">
        <div className="w-full h-80">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color) print:stroke-gray-200" />
              <XAxis dataKey="name" stroke="var(--text-color) print:stroke-black" />
              <YAxis stroke="var(--text-color) print:stroke-black" tickFormatter={formatChartCurrency} />
              <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} />
              <Legend wrapperStyle={{ color: 'var(--text-color-muted)' }} />
              <Bar dataKey="Principal" stackId="a" fill="var(--chart-color-principal)" />
              <Bar dataKey="Interest" stackId="a" fill="var(--chart-color-interest)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Immediate Impact & Opportunity">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg text-center bg-[var(--color-positive-bg)] print:bg-green-100">
            <h4 className="font-semibold text-[var(--color-positive-text)] print:text-green-800">
                <Tooltip text="The extra amount of principal you pay down with Crown compared to the bank over this period.">
                    <span className="cursor-help">Accelerated Principal Reduction</span>
                </Tooltip>
            </h4>
            <p className="text-4xl font-extrabold my-2 text-[var(--color-positive-text)] print:text-green-800">{formatCurrency(acceleratedPrincipal)}</p>
            <p className="text-sm text-[var(--color-positive-text)] print:text-green-800">Extra paid off your loan in the next {period} months.</p>
          </div>
          <div className="p-4 rounded-lg text-center bg-[var(--color-positive-bg)] print:bg-green-100">
            <h4 className="font-semibold text-[var(--color-positive-text)] print:text-green-800">
                 <Tooltip text="The amount of interest you save with Crown compared to the bank over this period.">
                    <span className="cursor-help">Immediate Interest Savings</span>
                </Tooltip>
            </h4>
            <p className="text-4xl font-extrabold my-2 text-[var(--color-positive-text)] print:text-green-800">{formatCurrency(interestSavings)}</p>
            <p className="text-sm text-[var(--color-positive-text)] print:text-green-800">Less interest paid to the bank in the next {period} months.</p>
          </div>
        </div>
      </Card>

      <Card title="Debt Recycling Opportunity">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-black/5 dark:bg-white/5 space-y-3 print:border print:border-gray-200">
                <h3 className="text-lg font-bold text-center text-[var(--chart-color-bank)] print:text-black">Bank Scenario</h3>
                 <ReadOnlyMetric title="Available to Recycle" value={formatCurrency(0)} tooltipText="With a standard bank loan, principal paid down is not typically structured to be easily re-borrowed for investment purposes."/>
                 <ReadOnlyMetric title={`Est. Earnings (Next ${period}m)`} value={formatCurrency(0)} tooltipText="No funds are recycled, so no investment earnings are generated through this strategy."/>
            </div>
             <div className="p-4 rounded-lg bg-[var(--chart-color-crown)]/10 space-y-3 print:border print:border-purple-200">
                <h3 className="text-lg font-bold text-center text-[var(--chart-color-crown)] print:text-purple-700">Crown Money Scenario 🏆</h3>
                 <ReadOnlyMetric title="Available to Recycle" value={formatCurrency(debtRecyclingOpportunity.availableToRecycle)} colorClass="text-[var(--chart-color-crown)] print:text-purple-700" tooltipText={`This is the portion of the principal paid down that can be re-borrowed for investment, based on your '${appState.debtRecyclingPercentage}% Percentage of Principal to Recycle' setting on the Debt Recycling tab. Calculation: (Principal Paid × ${appState.debtRecyclingPercentage}%).`} />
                 <ReadOnlyMetric title={`Est. Earnings (Next ${period}m)`} value={formatCurrency(debtRecyclingOpportunity.projectedEarnings)} colorClass="text-[var(--color-positive-text)] print:text-green-700" tooltipText="The estimated after-tax profit from investing the 'Available to Recycle' amount for this period. This profit can be used to further accelerate your home loan payoff."/>
            </div>
        </div>
         <p className="text-xs text-center text-[var(--text-color-muted)] mt-4 italic print:hidden">
            *This shows the amount of principal paid down on the home loan (using the Debt Recycling strategy) that can be re-borrowed for investment, and the estimated after-tax profit from that investment for this period.
        </p>
      </Card>

      <Card title="Share Your Report" className="print:hidden">
        <div className="flex flex-wrap justify-center items-center gap-4">
            <button onClick={handlePrint} className="flex items-center gap-2 p-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors">
                <PrintIcon className="h-5 w-5" /> Print Report
            </button>
            <button onClick={handleEmail} className="flex items-center gap-2 p-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
                <EmailIcon className="h-5 w-5" /> Email Report
            </button>
            <a href={socialShareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-[#0077B5] hover:bg-[#005582] text-white font-semibold rounded-lg transition-colors">
                <LinkedInIcon className="h-5 w-5" /> Share
            </a>
            <a href={socialShareLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-[#1877F2] hover:bg-[#166eeb] text-white font-semibold rounded-lg transition-colors">
                <FacebookIcon className="h-5 w-5" /> Share
            </a>
            <a href={socialShareLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-semibold rounded-lg transition-colors">
                <TwitterIcon className="h-5 w-5" /> Tweet
            </a>
        </div>
      </Card>
    </div>
  );
};

export default Tab_Reports;