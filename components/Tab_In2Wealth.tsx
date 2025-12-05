
import React, { useEffect, useState, useMemo } from 'react';
import { AppState } from '../types';
import Card from './common/Card';
import SliderInput from './common/SliderInput';
import { InfoIcon, UsersIcon } from './common/IconComponents';
import Tooltip from './common/Tooltip';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar, ReferenceArea } from 'recharts';

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

const CustomAreaTooltip: React.FC<{ active?: boolean, payload?: any[], label?: string, formatter: (value: number) => string }> = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
        const bankData = payload.find(p => p.dataKey === 'bank');
        const crownData = payload.find(p => p.dataKey === 'crown');
        const difference = (crownData?.value || 0) - (bankData?.value || 0);

        return (
            <div className="p-3 bg-[var(--tooltip-bg-color)] border border-[var(--border-color)] rounded-lg text-sm shadow-lg print:hidden space-y-1">
                <p className="label text-[var(--tooltip-text-color)] font-bold mb-1">{`Age: ${label}`}</p>
                
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: crownData?.stroke }}></div>
                    <p className="text-[var(--tooltip-text-color)]">
                        {crownData?.name}: <span className="font-semibold">{formatter(crownData?.value || 0)}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: bankData?.stroke }}></div>
                    <p className="text-[var(--tooltip-text-color)]">
                        {bankData?.name}: <span className="font-semibold">{formatter(bankData?.value || 0)}</span>
                    </p>
                </div>

                {difference > 0 && (
                    <>
                        <hr className="my-1 border-[var(--border-color)] opacity-50" />
                        <p className="text-[var(--tooltip-text-color-muted)]">
                            {`Advantage: `}
                            <span className="font-semibold" style={{ color: 'var(--tooltip-text-color-positive)' }}>
                                {formatter(difference)}
                            </span>
                        </p>
                    </>
                )}
            </div>
        );
    }
    return null;
};

const CustomBarTooltip: React.FC<{ active?: boolean, payload?: any[], formatter: (value: number) => string }> = ({ active, payload, formatter }) => {
    if (active && payload && payload.length) {
        const bankData = payload.find(p => p.dataKey === 'Bank');
        const crownData = payload.find(p => p.dataKey === 'Crown Money');
        const difference = (crownData?.value || 0) - (bankData?.value || 0);

        return (
            <div className="p-3 bg-[var(--tooltip-bg-color)] border border-[var(--border-color)] rounded-lg text-sm shadow-lg print:hidden space-y-1">
                {crownData && (
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: crownData.fill }}></div>
                        <p className="font-semibold" style={{ color: 'var(--tooltip-text-color)' }}>{`${crownData.name}: ${formatter(crownData.value)}`}</p>
                    </div>
                )}
                {bankData && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: bankData.fill }}></div>
                        <p className="font-semibold" style={{ color: 'var(--tooltip-text-color)' }}>{`${bankData.name}: ${formatter(bankData.value)}`}</p>
                    </div>
                )}
                 {difference > 0 && (
                     <>
                        <hr className="my-1 border-[var(--border-color)] opacity-50" />
                        <p className="text-[var(--tooltip-text-color-muted)]">
                            {`Advantage: `}
                            <span className="font-semibold" style={{color: 'var(--tooltip-text-color-positive)'}}>
                                {formatter(difference)}
                            </span>
                        </p>
                    </>
                )}
            </div>
        );
    }
    // Fallback logic for safety
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


const Tab_In2Wealth: React.FC<Props> = ({ appState, setAppState, calculations }) => {
  const { 
      bankLoanCalculation, 
      crownMoneyLoanCalculation, 
      wealthCalcs, // Ensure wealthCalcs is destructured
      netWorthProjection,
      surplus,
  } = calculations;
  
  const isBankLoanValid = bankLoanCalculation.termInYears !== Infinity;
  const isCrownLoanValid = crownMoneyLoanCalculation.termInYears !== Infinity;
  
  // Person Logic
  const sortedPeople = [...appState.people].sort((a, b) => a.age - b.age);
  const youngestPerson = sortedPeople[0] || { id: 0, name: 'Person 1', age: 30 };
  
  // State for toggling person view
  const [viewPersonId, setViewPersonId] = useState<number>(youngestPerson.id);

  // Determine current view context
  const viewingPerson = appState.people.find(p => p.id === viewPersonId) || youngestPerson;
  const ageOffset = viewingPerson.age - youngestPerson.age;
  const hasMultiplePeopleWithDifferentAges = appState.people.length > 1 && appState.people.some(p => p.age !== youngestPerson.age);

  const minRetirementAge = Math.ceil(viewingPerson.age + crownMoneyLoanCalculation.termInYears);

  // Auto-adjust global retirement age if it's impossible for the selected view
  useEffect(() => {
    // Only adjust if the *current global setting* is impossible for the youngest (base calculation)
    // The slider allows range, but we want to ensure data validity.
    const baseMinRetirement = Math.ceil(youngestPerson.age + crownMoneyLoanCalculation.termInYears);
    if (isCrownLoanValid && isFinite(baseMinRetirement) && appState.idealRetirementAge < baseMinRetirement) {
        setAppState(prev => ({ ...prev, idealRetirementAge: baseMinRetirement }));
    }
  }, [crownMoneyLoanCalculation.termInYears, youngestPerson.age, appState.idealRetirementAge, setAppState, isCrownLoanValid]);


  if (!isBankLoanValid || !isCrownLoanValid) {
    return (
      <Card>
        <div className="text-center text-yellow-400 p-4 bg-yellow-900/50 rounded-lg">
          <p className="font-bold text-lg">Calculations Not Available</p>
          <p>Please ensure both the Bank and Crown Money scenarios can be calculated on the 'OODC' tab to view wealth projections.</p>
        </div>
      </Card>
    );
  }

  const handleStateChange = (field: keyof AppState, value: any) => {
    setAppState(prev => ({ ...prev, [field]: value }));
  };

  const monthlySavings = surplus;
  const monthlyInvestment = monthlySavings * (appState.investmentAmountPercentage / 100);
  const monthlyCashInHand = monthlySavings - monthlyInvestment;
  
  const bankDebtFreeAge = Math.ceil(viewingPerson.age + bankLoanCalculation.termInYears);

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const quickPercentages = [25, 50, 75, 100];
  
  const yearsSaved = bankLoanCalculation.termInYears - crownMoneyLoanCalculation.termInYears;
  const weeklySavings = (monthlySavings * 12) / 52;
  const annualSavings = monthlySavings * 12;
  const totalPotentialInvestment = annualSavings * yearsSaved;

  // --- Transform Data for Selected Person ---
  
  // 1. Adjust Net Worth Graph Data
  const adjustedNetWorthProjection = useMemo(() => {
      return (netWorthProjection || []).map((d: any) => ({
          ...d,
          age: d.age + ageOffset
      }));
  }, [netWorthProjection, ageOffset]);

  // 2. Find Snapshot Data for Retirement Age
  const retirementSnapshot = useMemo(() => {
      const targetAge = appState.idealRetirementAge;
      // Find the data point where the adjusted age matches the target retirement age
      // If target is beyond our projection (e.g. user is older), take the last point
      const exactMatch = adjustedNetWorthProjection.find((d: any) => d.age === targetAge);
      const lastPoint = adjustedNetWorthProjection[adjustedNetWorthProjection.length - 1];
      
      // If we found an exact match, use it. 
      // If not, and the target is later than our data, use the last point.
      // If the target is earlier than our data (impossible via slider), use first point.
      const point = exactMatch || (targetAge > (lastPoint?.age || 0) ? lastPoint : adjustedNetWorthProjection[0]);
      
      if (!point) return { bank: 0, crown: 0 };
      
      return {
          bank: point.bank,
          crown: point.crown
      };
  }, [adjustedNetWorthProjection, appState.idealRetirementAge]);

  // 3. Re-calculate Breakdown Stats for Snapshot
  // We need to fetch the components (Home Equity, Investment Wealth, Cash) for the specific age
  // Since `wealthCalcs` is based on the youngest person's timeline (Year 0 = Youngest Age),
  // We need to convert SelectedPersonRetirementAge back to the YoungestPerson's equivalent age to query the calc.
  const equivalentBaseAge = appState.idealRetirementAge - ageOffset;
  const snapshotWealthDetails = wealthCalcs ? wealthCalcs(equivalentBaseAge) : { homeEquity: 0, wealth: 0, cashInHand: 0 };
  
  // We also need Bank components. 
  // Bank Equity = Home Value - Remaining Debt.
  // Bank Cash = Savings accumulated after debt free.
  // This logic is duplicated from hook but applied to specific age snapshot.
  const snapshotBankDetails = useMemo(() => {
      const retirementYearsElapsed = equivalentBaseAge - youngestPerson.age;
      const initialPropertyValue = appState.loan.propertyValue;
      const homeValue = initialPropertyValue * Math.pow(1 + (appState.propertyGrowthRate / 100), retirementYearsElapsed);
      
      // Find remaining debt from schedule
      const monthIndex = Math.max(0, Math.floor(retirementYearsElapsed * 12) - 1);
      const bankDebt = bankLoanCalculation.amortizationSchedule[monthIndex]?.remainingBalance ?? (retirementYearsElapsed * 12 > bankLoanCalculation.termInYears * 12 ? 0 : appState.loan.amount);
      const equity = homeValue - bankDebt;

      const bankPayoffYears = bankLoanCalculation.termInYears;
      let cash = 0;
      if (retirementYearsElapsed > bankPayoffYears) {
          // If years elapsed is greater than payoff, they have been saving
          const monthsSaving = (retirementYearsElapsed - bankPayoffYears) * 12;
          // Simple calc: monthly repayment * months saving
          const monthlyRepayment = bankLoanCalculation.amortizationSchedule[0]?.principalPaid + bankLoanCalculation.amortizationSchedule[0]?.interestPaid || 0;
          cash = monthsSaving * monthlyRepayment;
      }
      return { homeEquity: equity, cash: cash, total: equity + cash };
  }, [equivalentBaseAge, youngestPerson.age, appState.loan, appState.propertyGrowthRate, bankLoanCalculation]);


  const barChartData = [
      { 
        name: 'Net Worth', 
        'Bank': Math.max(0, snapshotBankDetails.total),
        'Crown Money': Math.max(0, retirementSnapshot.crown)
      },
  ];
  
  const sliderMin = isFinite(minRetirementAge) ? minRetirementAge : viewingPerson.age;
  const sliderMax = Math.max(sliderMin + 5, 85); 
  // Ensure slider value is valid for current view
  const sliderValue = Math.max(sliderMin, Math.min(appState.idealRetirementAge, sliderMax)); 
  
  // Graph Breakpoint Calculations
  const crownPayoffAge = minRetirementAge;

  return (
    <div className="animate-fade-in space-y-6">
      <Card title="Step 1: Plan Your Investment & Retirement">
         <div className="mb-8">
            <SliderInput 
                label={
                    <div className='flex items-center gap-2'>
                        <span>Ideal Retirement Age</span>
                        <Tooltip text={`Set your target retirement age. The calculator will project your potential wealth at this age (${sliderValue}) for ${viewingPerson.name}.`}>
                            <InfoIcon className="h-4 w-4 text-[var(--text-color-muted)]"/>
                        </Tooltip>
                    </div>
                }
                value={sliderValue}
                onChange={val => handleStateChange('idealRetirementAge', val)}
                min={sliderMin} 
                max={sliderMax} 
                step={1}
            />
         </div>
         <div className="mb-6 p-4 border border-dashed border-[var(--border-color)] rounded-lg">
            <div className="flex items-center justify-center gap-1">
                <h4 className="font-semibold text-[var(--title-color)] text-center mb-3">Your Investment Power</h4>
                 <Tooltip text="This is your total monthly surplus (Income - Expenses) that becomes available for investing once your home loan is paid off with the Crown Money strategy.">
                    <InfoIcon className="h-4 w-4 text-[var(--text-color-muted)] -translate-y-1.5"/>
                </Tooltip>
            </div>
            <p className="text-center text-sm text-[var(--text-color-muted)] mb-4">
                By paying off your loan {yearsSaved.toFixed(1)} years earlier, your entire monthly surplus becomes free cash. This is the amount you can now invest.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-2 bg-black/10 dark:bg-white/5 rounded-lg">
                    <p className="text-xs text-[var(--text-color-muted)]">Weekly Savings</p>
                    <p className="font-bold text-lg text-[var(--text-color)]">{formatCurrency(weeklySavings)}</p>
                </div>
                <div className="p-2 bg-black/10 dark:bg-white/5 rounded-lg">
                    <p className="text-xs text-[var(--text-color-muted)]">Monthly Savings</p>
                    <p className="font-bold text-lg text-[var(--text-color)]">{formatCurrency(monthlySavings)}</p>
                </div>
                <div className="p-2 bg-black/10 dark:bg-white/5 rounded-lg">
                    <p className="text-xs text-[var(--text-color-muted)]">Annual Savings</p>
                    <p className="font-bold text-lg text-[var(--text-color)]">{formatCurrency(annualSavings)}</p>
                </div>
                <div className="p-2 bg-black/10 dark:bg-white/5 rounded-lg">
                    <p className="text-xs text-[var(--text-color-muted)]">Total Over {yearsSaved.toFixed(1)} Yrs</p>
                    <p className="font-bold text-lg text-[var(--text-color)]">{formatCurrency(totalPotentialInvestment)}</p>
                </div>
            </div>
             <p className="text-xs text-center text-[var(--text-color-muted)] mt-3 italic print:hidden">*Your 'Investment Power' is your monthly surplus (Total Income - Living Expenses), which is available for investing once the loan is paid off.</p>
        </div>
        <div className="space-y-6">
            <div>
                <SliderInput 
                label="Percentage of Savings to Invest"
                value={appState.investmentAmountPercentage}
                onChange={val => handleStateChange('investmentAmountPercentage', val)}
                min={0} max={100} step={1} unit="%"
                />
                <p className="text-center text-xs text-[var(--text-color-muted)] mt-2">
                    Select what percentage of your freed-up monthly surplus ({formatCurrency(monthlySavings)}/month) you would like to invest.
                </p>
                <div className="flex gap-2 justify-center mt-2">
                    {quickPercentages.map(p => (
                        <button 
                            key={p} 
                            onClick={() => handleStateChange('investmentAmountPercentage', p)}
                            className={`px-3 py-1 text-sm rounded-full transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--card-bg-color)] focus:ring-[var(--input-border-focus-color)] ${appState.investmentAmountPercentage === p ? 'bg-[var(--title-color)] text-white' : 'bg-[var(--input-bg-color)] hover:bg-[var(--input-bg-color)]/80'}`}
                        >
                            {p}%
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center mt-4">
                <div className="p-3 bg-[var(--color-positive-bg)] rounded-lg">
                    <h4 className="text-sm text-[var(--color-positive-text)]">Monthly Investment</h4>
                    <p className="text-xl font-bold text-[var(--color-positive-text)]">{formatCurrency(monthlyInvestment)}</p>
                </div>
                 <div className="p-3 bg-[var(--color-surplus-bg)] rounded-lg">
                    <h4 className="text-sm text-[var(--color-surplus-text)]">Monthly Cash In Hand</h4>
                    <p className="text-xl font-bold text-[var(--color-surplus-text)]">{formatCurrency(monthlyCashInHand)}</p>
                </div>
            </div>
        </div>
        <div className="mt-8 pt-6 border-t border-dashed border-[var(--border-color)] space-y-6">
            <SliderInput 
                label={
                    <div className='flex items-center gap-2'>
                        <span>Average Annual Investment Growth Rate</span>
                        <Tooltip text="The estimated average annual return on your investments. A higher rate leads to faster wealth accumulation.">
                            <InfoIcon className="h-4 w-4 text-[var(--text-color-muted)]"/>
                        </Tooltip>
                    </div>
                }
                value={appState.investmentGrowthRate}
                onChange={val => handleStateChange('investmentGrowthRate', val)}
                min={0} max={20} step={0.25} unit="%"
            />
             <p className="text-center text-xs text-[var(--text-color-muted)] -mt-2 p-2 bg-black/10 dark:bg-white/5 rounded-md">
                Investing in a diversified portfolio of assets like property, the stock market, or index funds has historically produced average returns of 7% or more over the long term.
                <br/>
                <strong className="font-semibold">Disclaimer:</strong> This is for illustrative purposes only and does not include financial advice. Past performance is not indicative of future results.
            </p>
            <SliderInput 
                label={
                    <div className='flex items-center gap-2'>
                        <span>Annual Property Growth Rate</span>
                        <Tooltip text="The estimated annual increase in value for your primary residence. This is used for net worth projections.">
                            <InfoIcon className="h-4 w-4 text-[var(--text-color-muted)]"/>
                        </Tooltip>
                    </div>
                }
                value={appState.propertyGrowthRate}
                onChange={val => handleStateChange('propertyGrowthRate', val)}
                min={0} max={15} step={0.25} unit="%"
            />
        </div>
      </Card>

      <Card 
        title={
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <span>Step 2: Your Wealth Projections</span>
                {hasMultiplePeopleWithDifferentAges && (
                    <div className="flex items-center bg-[var(--input-bg-color)] rounded-full p-1 border border-[var(--border-color)]">
                        {sortedPeople.map(person => (
                            <button
                                key={person.id}
                                onClick={() => setViewPersonId(person.id)}
                                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                                    viewPersonId === person.id 
                                    ? 'bg-[var(--title-color)] text-white shadow-sm' 
                                    : 'text-[var(--text-color-muted)] hover:text-[var(--text-color)]'
                                }`}
                            >
                                {person.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        }
      >
         <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center space-y-4 p-4 rounded-lg bg-black/10 dark:bg-white/10">
                <h4 className="text-lg font-semibold text-[var(--text-color)]">Your Bank's Path</h4>
                <p className="text-sm text-[var(--text-color-muted)] -mt-3">At Retirement Age {sliderValue}</p>
                 <div className="border-t border-[var(--border-color)] pt-2">
                    <p className="text-sm text-[var(--text-color-muted)] flex items-center justify-center gap-1">
                        <span>Projected Home Equity</span>
                        <Tooltip text="CALCULATION: (Home Value at Retirement) - (Remaining Loan Balance). This is the portion of your home you own.">
                            <InfoIcon className="h-4 w-4" />
                        </Tooltip>
                    </p>
                    <p className="text-2xl font-bold" style={{color: 'var(--chart-color-bank)'}}>{formatCurrency(snapshotBankDetails.homeEquity)}</p>
                </div>
                <div>
                    <p className="text-sm text-[var(--text-color-muted)] flex items-center justify-center gap-1">
                        <span>Wealth from Investments</span>
                        <Tooltip text="In the bank's scenario, calculations assume no surplus cash is invested until the mortgage is fully paid off.">
                             <InfoIcon className="h-4 w-4" />
                        </Tooltip>
                    </p>
                    <p className="text-2xl font-bold" style={{color: 'var(--chart-color-bank)'}}>{formatCurrency(0)}</p>
                </div>
                 <div>
                    <p className="text-sm text-[var(--text-color-muted)] uppercase">CASH SPENT ON LIFESTYLE since being debt free</p>
                    <p className="text-2xl font-bold text-[var(--text-color-muted)]">{formatCurrency(snapshotBankDetails.cash)}</p>
                </div>
                <hr className="border-[var(--border-color)] border-dashed"/>
                 <div>
                    <p className="text-md font-semibold text-[var(--text-color)] flex items-center justify-center gap-1">
                        <span>Total Net Position</span>
                         <Tooltip text="CALCULATION: Home Equity + Investment Wealth + Cash. This is your total projected financial position at retirement with the bank's plan.">
                            <InfoIcon className="h-4 w-4" />
                        </Tooltip>
                    </p>
                    <p className="text-4xl font-extrabold" style={{color: 'var(--chart-color-bank)'}}>{formatCurrency(snapshotBankDetails.total)}</p>
                </div>
            </div>
             <div className="text-center space-y-4 p-4 rounded-lg bg-black/10 dark:bg-white/10">
                <h4 className="text-lg font-semibold text-[var(--text-color)]">The Crown Money Path 🏆</h4>
                <p className="text-sm text-[var(--text-color-muted)] -mt-3">At Retirement Age {sliderValue}</p>
                 <div className="border-t border-[var(--border-color)] pt-2">
                    <p className="text-sm text-[var(--text-color-muted)] flex items-center justify-center gap-1">
                        <span>Projected Home Equity</span>
                        <Tooltip text="CALCULATION: Initial Property Value compounded by the Property Growth Rate. As the loan is paid off, your equity is the home's full value.">
                            <InfoIcon className="h-4 w-4" />
                        </Tooltip>
                    </p>
                    <p className="text-2xl font-bold" style={{color: 'var(--chart-color-wealth)'}}>{formatCurrency(snapshotWealthDetails.homeEquity)}</p>
                </div>
                <div>
                    <p className="text-sm text-[var(--text-color-muted)] flex items-center justify-center gap-1">
                        <span>Wealth from Investments</span>
                        <Tooltip text="This is the projected value of your investment portfolio, calculated by compounding your 'Monthly Investment' amount at the 'Average Annual Investment Growth Rate' from the time your loan is paid off until retirement.">
                            <InfoIcon className="h-4 w-4" />
                        </Tooltip>
                    </p>
                    <p className="text-2xl font-bold" style={{color: 'var(--chart-color-wealth)'}}>{formatCurrency(snapshotWealthDetails.wealth)}</p>
                </div>
                <div>
                    <p className="text-sm text-[var(--text-color-muted)] uppercase">CASH SPENT ON LIFESTYLE since being debt free</p>
                    <p className="text-2xl font-bold text-[var(--text-color-muted)]">{formatCurrency(snapshotWealthDetails.cashInHand)}</p>
                </div>
                <hr className="border-[var(--border-color)] border-dashed"/>
                <div>
                    <p className="text-md font-semibold text-[var(--text-color)] flex items-center justify-center gap-1">
                        <span>Total Net Position</span>
                         <Tooltip text="CALCULATION: Home Equity + Investment Wealth + Cash. This is your total projected financial position with Crown Money at retirement.">
                            <InfoIcon className="h-4 w-4" />
                        </Tooltip>
                    </p>
                    <p className="text-4xl font-extrabold" style={{color: 'var(--chart-color-wealth)'}}>{formatCurrency(snapshotWealthDetails.wealth + snapshotWealthDetails.cashInHand + snapshotWealthDetails.homeEquity)}</p>
                </div>
            </div>
        </div>
        <p className="text-xs text-center text-[var(--text-color-muted)] -mt-4 italic print:hidden">*Total Net Position = Projected Home Equity + Wealth from Investments + Cash. Projections assume constant growth rates and investment amounts.</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center pt-6 border-t border-dashed border-[var(--border-color)]">
            <div className="lg:col-span-3">
                <h4 className="text-center font-semibold text-lg text-[var(--text-color)] mb-4">Net Worth Growth Comparison</h4>
                <div style={{ width: '100%', height: 400 }}>
                   <ResponsiveContainer minWidth={0} minHeight={0}>
                        <AreaChart data={adjustedNetWorthProjection} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="age" name="Age" stroke="var(--text-color)" tick={{ fontSize: 12 }} label={{ value: `Age (${viewingPerson.name})`, position: 'insideBottom', offset: -10, fill: 'var(--text-color-muted)' }}/>
                            <YAxis stroke="var(--text-color)" tickFormatter={formatChartCurrency} tick={{ fontSize: 12 }} />
                            <RechartsTooltip content={<CustomAreaTooltip formatter={formatCurrency} />} />
                            <Legend wrapperStyle={{fontSize: "14px", color: "var(--text-color-muted)"}} verticalAlign="top" />
                            <defs>
                                <linearGradient id="colorBankNetWorth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--chart-color-bank)" stopOpacity={0.7}/>
                                    <stop offset="95%" stopColor="var(--chart-color-bank)" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorCrownNetWorth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--chart-color-crown)" stopOpacity={0.7}/>
                                    <stop offset="95%" stopColor="var(--chart-color-crown)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            {isCrownLoanValid && isBankLoanValid && bankDebtFreeAge > crownPayoffAge && isFinite(bankDebtFreeAge) && isFinite(crownPayoffAge) && (
                                <ReferenceArea
                                    x1={crownPayoffAge}
                                    x2={bankDebtFreeAge}
                                    stroke="var(--chart-color-wealth)"
                                    strokeOpacity={0.3}
                                    fill="var(--chart-color-wealth)"
                                    fillOpacity={0.1}
                                    ifOverflow="extendDomain"
                                />
                            )}
                            <Area type="monotone" dataKey="bank" stroke="var(--chart-color-bank)" fill="url(#colorBankNetWorth)" fillOpacity={1} strokeWidth={2} name="Bank" />
                            <Area type="monotone" dataKey="crown" stroke="var(--chart-color-crown)" fill="url(#colorCrownNetWorth)" fillOpacity={1} strokeWidth={2} name="Crown Money" />
                        </AreaChart>
                   </ResponsiveContainer>
                </div>
                <p className="text-xs text-center text-[var(--text-color-muted)] mt-3 italic print:hidden">
                    *The shaded area represents the period where you are investing with Crown Money while still paying off your loan with the Bank.
                </p>
            </div>
            
            <div className="lg:col-span-2">
                <h4 className="text-center font-semibold text-lg text-[var(--text-color)] mb-4">Net Worth at Retirement</h4>
                <div className="h-80">
                    <ResponsiveContainer minWidth={0} minHeight={0}>
                        <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                            <XAxis dataKey="name" hide={true} />
                            <YAxis stroke="var(--text-color)" tickFormatter={formatChartCurrency} />
                            <RechartsTooltip cursor={{fill: 'rgba(128, 128, 128, 0.1)'}} content={<CustomBarTooltip formatter={formatCurrency} />} />
                            <Legend wrapperStyle={{color: "var(--text-color-muted)"}} />
                            <Bar dataKey="Bank" fill="var(--chart-color-bank)" barSize={60} />
                            <Bar dataKey="Crown Money" fill="var(--chart-color-crown)" barSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      </Card>
    </div>
  );
};

export default React.memo(Tab_In2Wealth);
