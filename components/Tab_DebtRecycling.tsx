
import React, { useMemo } from 'react';
import { AppState } from '../types';
import Card from './common/Card';
import SliderInput from './common/SliderInput';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar, LabelList, ComposedChart, Line } from 'recharts';
import Tooltip from './common/Tooltip';
import { InfoIcon } from './common/IconComponents';
import Accordion from './common/Accordion';

interface Props {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  calculations: any;
}

const formatCurrency = (value: number, digits = 0) => {
    if (isNaN(value) || !isFinite(value)) return 'N/A';
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
};

const formatChartCurrency = (tick: number): string => {
  if (Math.abs(tick) >= 1000000) {
    return `$${(tick / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(tick) >= 1000) {
    return `$${Math.round(tick / 1000)}k`;
  }
  return `$${tick}`;
};

const CustomTooltip: React.FC<{ active?: boolean, payload?: any[], label?: string, formatter: (value: number) => string }> = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-[var(--tooltip-bg-color)] border border-[var(--border-color)] rounded-lg text-sm shadow-lg print:hidden space-y-1">
                <p className="label text-[var(--tooltip-text-color)] font-bold mb-1">{`Year: ${Number(label).toFixed(2)}`}</p>
                {payload.map((pld: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: pld.stroke || pld.fill }}></div>
                        <p className="font-semibold" style={{ color: 'var(--tooltip-text-color)' }}>{`${pld.name}: ${formatter(pld.value)}`}</p>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- Image Assets ---
const ICONS = {
    DEBT_RECYCLING_DIAGRAM: "https://storage.googleapis.com/crown_money/Images%20%26%20Icons/Images/Debt%20Recycling%20Works.png"
};

const DebtRecyclingVisualGuide: React.FC<{ appState: AppState, calculations: any }> = ({ appState, calculations }) => {
    const { surplus, crownMoneyLoanCalculation } = calculations;
    const { debtRecyclingInvestmentRate, debtRecyclingLoanInterestRate, marginalTaxRate, debtRecyclingPercentage } = appState;
    
    // We retain these calculations to display dynamic context in the text explanation below the image
    const { amountToRecycle, grossReturn, netProfit, interestCost, year1CrownPrincipalPaid } = useMemo(() => {
        const principalPaid = crownMoneyLoanCalculation.year1PrimaryOnlyPrincipalPaid || 0;

        const examplePrincipalPaid = principalPaid > 1000 ? principalPaid : 37055; // Fallback for initial load

        const amountToRecycle = examplePrincipalPaid * (debtRecyclingPercentage / 100);
        const grossReturn = amountToRecycle * (debtRecyclingInvestmentRate / 100);
        const interestCost = amountToRecycle * (debtRecyclingLoanInterestRate / 100);
        const netProfitBeforeTax = grossReturn - interestCost;
        const taxPayable = netProfitBeforeTax > 0 ? netProfitBeforeTax * (marginalTaxRate / 100) : 0;
        const netProfit = netProfitBeforeTax - taxPayable;

        return { amountToRecycle, grossReturn, interestCost, netProfit, year1CrownPrincipalPaid: examplePrincipalPaid };
    }, [crownMoneyLoanCalculation, debtRecyclingPercentage, debtRecyclingInvestmentRate, debtRecyclingLoanInterestRate, marginalTaxRate]);
    
    const surplusPerYear = surplus * 12;

    return (
        <div className="p-4 rounded-lg overflow-x-auto">
            <h3 className="text-xl font-bold text-center text-[var(--title-color)] mb-8">How Debt Recycling Works (5-Step Cycle)</h3>
            
            <div className="flex justify-center mb-8">
                <img 
                    src={ICONS.DEBT_RECYCLING_DIAGRAM} 
                    alt="Debt Recycling Process Diagram" 
                    className="max-w-4xl w-full object-contain"
                />
            </div>

             <div className="mt-4 pt-4 border-t border-dashed border-[var(--border-color)] text-center text-xs text-[var(--text-color-muted)] max-w-4xl mx-auto space-y-2">
                <h5 className="font-bold text-sm text-[var(--text-color)]">How are these example numbers calculated?</h5>
                <p><strong className="text-[var(--text-color-muted)]">Step 1 Surplus:</strong> Your total monthly income minus total monthly expenses from the budget tab (<strong className="text-[var(--text-color)]">{formatCurrency(surplusPerYear)}/yr</strong>).</p>
                <p><strong className="text-[var(--text-color-muted)]">Step 3 Re-borrow Amount:</strong> Based on an example of principal paid down in Year 1 of the standard Crown scenario (<strong className="text-[var(--text-color)]">{formatCurrency(year1CrownPrincipalPaid)}</strong>), multiplied by your chosen 'Percentage to Recycle'.</p>
                <p><strong className="text-[var(--text-color-muted)]">Step 4 Gross Return:</strong> Amount Re-borrowed (<strong className="text-[var(--text-color)]">{formatCurrency(amountToRecycle)}</strong>) × Assumed Investment Return (<strong className="text-[var(--text-color)]">{debtRecyclingInvestmentRate}%</strong>).</p>
                <p><strong className="text-[var(--text-color-muted)]">Step 5 Net Profit:</strong> (Gross Return - Interest Cost) - Tax on Profit. The investment loan interest (<strong className="text-[var(--text-color)]">{formatCurrency(interestCost)}</strong>) is tax-deductible against your marginal tax rate.</p>
            </div>
        </div>
    );
};


const Tab_DebtRecycling: React.FC<Props> = ({ appState, setAppState, calculations }) => {
    const { debtRecyclingCalculation, crownMoneyLoanCalculation, debtRecyclingWealthProjection } = calculations;
    const { loan, debtRecyclingEnabled, debtRecyclingInvestmentRate, debtRecyclingLoanInterestRate, marginalTaxRate, debtRecyclingPercentage } = appState;

    const handleStateChange = (field: keyof AppState, value: any) => {
        setAppState(prev => ({ ...prev, [field]: value }));
    };

    // Calculate chart data
    const chartData = useMemo(() => {
        if (!debtRecyclingCalculation || !debtRecyclingCalculation.investmentLoanSchedule || !debtRecyclingCalculation.investmentPortfolioSchedule) {
            return [];
        }
        
        const scheduleLength = debtRecyclingCalculation.investmentLoanSchedule.length;
        const data = [];
        
        for (let i = 0; i < scheduleLength; i+=12) { // sample yearly
             const year = i / 12;
             const loanBal = debtRecyclingCalculation.investmentLoanSchedule[i]?.balance || 0;
             const portVal = debtRecyclingCalculation.investmentPortfolioSchedule[i]?.value || 0;
             const homeLoanBal = debtRecyclingCalculation.amortizationSchedule[i]?.remainingBalance || 0;
             
             data.push({
                 year,
                 'Investment Loan': loanBal,
                 'Portfolio Value': portVal,
                 'Home Loan Balance': homeLoanBal,
                 'Net Wealth': portVal - loanBal - homeLoanBal // Rough estimate for chart
             });
        }
        return data;

    }, [debtRecyclingCalculation]);

    if (!debtRecyclingCalculation || debtRecyclingCalculation.termInYears === Infinity) {
        return (
            <div className="text-center p-8">
                <h3 className="text-xl font-bold text-[var(--text-color)]">Debt Recycling Unavailable</h3>
                <p className="text-[var(--text-color-muted)]">Your Crown Money loan calculation must be valid (payable) to enable Debt Recycling projections.</p>
            </div>
        );
    }

    const snowballChartData = useMemo(() => {
        const { loan } = appState;
        if (!debtRecyclingCalculation?.amortizationSchedule || !debtRecyclingCalculation?.investmentPortfolioSchedule) {
            return [];
        }
    
        const homeLoanSchedule = debtRecyclingCalculation.amortizationSchedule;
        const portfolioSchedule = debtRecyclingCalculation.investmentPortfolioSchedule;
        const termInYears = debtRecyclingCalculation.termInYears;
        
        const netLoanAmount = loan.amount - (loan.offsetBalance || 0);
        
        const data = [];
        // Show one year after payoff to illustrate the final zero-debt state
        const lastYear = Math.ceil(termInYears);

        for (let year = 0; year <= lastYear; year++) {
             if (year === 0) {
                data.push({
                    label: 'Start',
                    'Home Loan Balance': netLoanAmount,
                    'Investment Portfolio': 0,
                });
                continue;
            }
            
            const monthIndex = year * 12 - 1;
            // Handle case where loan pays off mid-year
            const isAfterPayoff = (monthIndex + 1) / 12 > termInYears;
            const homeLoan = isAfterPayoff ? 0 : (homeLoanSchedule[monthIndex]?.remainingBalance ?? 0);
            
            // Ensure portfolio value is the final value after payoff
            const portfolio = isAfterPayoff 
                ? portfolioSchedule[portfolioSchedule.length - 1]?.value ?? 0
                : (portfolioSchedule[monthIndex]?.value ?? 0);
            
            data.push({
                label: `Year ${year}`,
                'Home Loan Balance': homeLoan > 0 ? homeLoan : 0,
                'Investment Portfolio': portfolio,
            });
        }
    
        return data;
    }, [debtRecyclingCalculation, appState.loan]);

    const CustomSnowballTooltip: React.FC<any> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const homeLoanData = payload.find(p => p.dataKey === 'Home Loan Balance');
            const portfolioData = payload.find(p => p.dataKey === 'Investment Portfolio');
            const total = (homeLoanData?.value || 0) + (portfolioData?.value || 0);
    
            return (
                <div className="p-3 bg-[var(--tooltip-bg-color)] border border-[var(--border-color)] rounded-lg text-sm shadow-lg print:hidden space-y-1">
                    <p className="label text-[var(--tooltip-text-color)] font-bold mb-1">{label}</p>
                    {homeLoanData && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: homeLoanData.fill }}></div>
                            <p className="text-[var(--tooltip-text-color)]">{`${homeLoanData.name}: ${formatCurrency(homeLoanData.value)}`}</p>
                        </div>
                    )}
                    {portfolioData && portfolioData.value > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: portfolioData.fill }}></div>
                            <p className="text-[var(--tooltip-text-color)]">{`${portfolioData.name}: ${formatCurrency(portfolioData.value)}`}</p>
                        </div>
                    )}
                    <hr className="my-1 border-[var(--border-color)] opacity-50" />
                    <p className="text-[var(--tooltip-text-color-muted)]">{`Total Combined Debt: ${formatCurrency(total)}`}</p>
                </div>
            );
        }
        return null;
    };
    
    const formatBarLabel = (value: number) => {
        if (value < 1000) return '';
        return `$${Math.round(value / 1000)}k`;
    };

    const debtCompositionData = React.useMemo(() => {
        const homeLoanSchedule = debtRecyclingCalculation.amortizationSchedule || [];
        const invLoanSchedule = debtRecyclingCalculation.investmentLoanSchedule || [];
        const maxMonths = Math.max(homeLoanSchedule.length, invLoanSchedule.length);
        if (maxMonths === 0) return [];

        const data = [];
        for (let i = 0; i < maxMonths; i++) {
            const homeLoan = homeLoanSchedule[i]?.remainingBalance || 0;
            const invLoan = invLoanSchedule[i]?.balance || 0;
            data.push({
                year: (i + 1) / 12,
                'Home Loan': homeLoan,
                'Investment Loan': invLoan,
                'Total Debt': homeLoan + invLoan,
            });
        }
        return data;
    }, [debtRecyclingCalculation]);

    const netWorthData = React.useMemo(() => {
        const { bankLoanCalculation, crownMoneyLoanCalculation, debtRecyclingCalculation, people } = calculations;
        const { loan } = appState;
        const startAge = Math.min(...people.map((p: any) => p.age));
        const initialHomeValue = loan.propertyValue;

        const homeEquityOverTime = (schedule: any[], years: number) => {
            const homeValue = initialHomeValue * Math.pow(1 + appState.propertyGrowthRate / 100, years);
            const monthIndex = Math.floor(years * 12);
            const debt = schedule[monthIndex]?.remainingBalance ?? 0;
            return homeValue - debt;
        };

        const maxYears = Math.ceil(Math.max(bankLoanCalculation.termInYears, debtRecyclingCalculation.termInYears));
        const data = [];
        for (let i = 0; i <= maxYears; i++) {
            const currentAge = startAge + i;
            
            const bankNetWorth = homeEquityOverTime(bankLoanCalculation.amortizationSchedule, i);
            const crownNetWorth = homeEquityOverTime(crownMoneyLoanCalculation.amortizationSchedule, i);

            const homeEquityRecycling = homeEquityOverTime(debtRecyclingCalculation.amortizationSchedule, i);
            const monthIndex = Math.floor(i * 12);
            const portfolioValue = debtRecyclingCalculation.investmentPortfolioSchedule?.[monthIndex]?.value ?? 0;
            const investmentLoan = debtRecyclingCalculation.investmentLoanSchedule?.[monthIndex]?.balance ?? 0;
            const recyclingNetWorth = homeEquityRecycling + portfolioValue - investmentLoan;

            data.push({
                age: currentAge,
                'Bank': bankNetWorth > 0 ? bankNetWorth : 0,
                'Crown Money': crownNetWorth > 0 ? crownNetWorth : 0,
                'Crown + Recycling': recyclingNetWorth > 0 ? recyclingNetWorth : 0,
            });
        }
        return data;

    }, [calculations, appState.propertyGrowthRate, appState.loan]);

    const endResult = useMemo(() => {
        const { termInYears, finalInvestmentPortfolioValue, finalInvestmentLoanBalance } = debtRecyclingCalculation;
        const { debtRecyclingInvestmentRate, debtRecyclingLoanInterestRate, marginalTaxRate } = appState;

        if (!finalInvestmentPortfolioValue) return null;
        
        const grossReturn = finalInvestmentPortfolioValue * (debtRecyclingInvestmentRate / 100);
        const interestCost = finalInvestmentLoanBalance * (debtRecyclingLoanInterestRate / 100);
        const preTaxProfit = grossReturn - interestCost;
        const afterTaxProfit = preTaxProfit > 0 ? preTaxProfit * (1 - marginalTaxRate / 100) : preTaxProfit;

        return {
            termInYears,
            finalInvestmentPortfolioValue,
            grossReturn,
            debtRecyclingInvestmentRate,
            interestCost,
            debtRecyclingLoanInterestRate,
            preTaxProfit,
            afterTaxProfit
        };

    }, [debtRecyclingCalculation, appState]);

    const accordionItems = [
        {
            title: "1. How Debt Recycling Works",
            content: <DebtRecyclingVisualGuide appState={appState} calculations={calculations} />
        },
        {
            title: "2. Configuration & Assumptions",
            content: (
                <div className="space-y-6">
                    <SliderInput 
                        label="Percentage of Principal to Recycle" 
                        value={debtRecyclingPercentage} 
                        onChange={val => handleStateChange('debtRecyclingPercentage', val)} 
                        min={0} max={100} step={5} unit="%" 
                    />
                    <SliderInput 
                        label="Investment Growth Rate" 
                        value={debtRecyclingInvestmentRate} 
                        onChange={val => handleStateChange('debtRecyclingInvestmentRate', val)} 
                        min={0} max={15} step={0.1} unit="%" 
                    />
                    <SliderInput 
                        label="Investment Loan Interest Rate" 
                        value={debtRecyclingLoanInterestRate} 
                        onChange={val => handleStateChange('debtRecyclingLoanInterestRate', val)} 
                        min={0} max={15} step={0.1} unit="%" 
                    />
                    <SliderInput 
                        label="Marginal Tax Rate" 
                        value={marginalTaxRate} 
                        onChange={val => handleStateChange('marginalTaxRate', val)} 
                        min={0} max={50} step={0.5} unit="%" 
                    />
                </div>
            )
        },
        {
            title: "3. The Snowball Effect: Year-by-Year Growth",
            content: (
                <>
                    <p className="text-sm text-[var(--text-color-muted)] mb-4">
                        This chart shows the "snowball effect" of debt recycling. As you pay down your non-deductible Home Loan Balance (bad debt), you build up your wealth-generating Investment Portfolio (good debt). The number inside each bar shows the value of your investment portfolio at that year.
                    </p>
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer minWidth={0} minHeight={0}>
                            <BarChart data={snowballChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="label" stroke="var(--text-color)" tick={{ fontSize: 12 }} />
                                <YAxis stroke="var(--text-color)" tickFormatter={formatChartCurrency} tick={{ fontSize: 12 }} />
                                <RechartsTooltip cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} content={<CustomSnowballTooltip />} />
                                <Legend iconType="square" wrapperStyle={{ fontSize: "14px", color: "var(--text-color-muted)", paddingTop: '20px' }} />
                                <Bar dataKey="Home Loan Balance" name="Home Loan Balance" stackId="a" fill="#ec4899" />
                                <Bar dataKey="Investment Portfolio" name="Investment Portfolio" stackId="a" fill="#6d28d9">
                                    <LabelList dataKey="Investment Portfolio" position="center" formatter={formatBarLabel} style={{ fill: 'white', fontWeight: 'bold', fontSize: 14 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )
        },
        {
            title: "4. The End Result: Your Passive Income Machine",
            content: (
                 endResult ? (
                    <div className="p-4 bg-black/10 dark:bg-white/5 rounded-lg space-y-4">
                        <div className="text-center">
                            <p className="text-lg">In <strong className="text-3xl text-[var(--title-color)]">{endResult.termInYears.toFixed(2)} years</strong> your home is Debt Free.</p>
                            <p className="text-sm text-[var(--text-color-muted)]">At this point, you have built a passive income machine:</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left p-4 rounded-lg bg-[var(--card-bg-color)]">
                            <div className="space-y-1">
                                <span className="text-sm text-[var(--text-color-muted)]">Investment Portfolio Value</span>
                                <p className="text-2xl font-bold text-[var(--chart-color-wealth)]">{formatCurrency(endResult.finalInvestmentPortfolioValue)}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm text-[var(--text-color-muted)]">Annual Gross Return ({endResult.debtRecyclingInvestmentRate}%)</span>
                                <p className="text-2xl font-bold text-[var(--color-positive-text)]">{formatCurrency(endResult.grossReturn)}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm text-[var(--text-color-muted)]">Annual Interest Cost ({endResult.debtRecyclingLoanInterestRate}%)</span>
                                <p className="text-xl font-semibold text-[var(--color-negative-text)]">-{formatCurrency(endResult.interestCost)}</p>
                            </div>
                             <div className="space-y-1">
                                <span className="text-sm text-[var(--text-color-muted)]">Pre-Tax Passive Income</span>
                                <p className="text-xl font-semibold text-[var(--text-color)]">{formatCurrency(endResult.preTaxProfit)}</p>
                            </div>
                        </div>

                        <div className="text-center p-4 rounded-lg bg-[var(--color-positive-bg)]">
                             <p className="font-bold text-lg text-[var(--color-positive-text)]">
                                = {formatCurrency(endResult.afterTaxProfit)} p.a.
                            </p>
                            <p className="text-sm text-[var(--color-positive-text)]">After-Tax Passive Income</p>
                        </div>
                    </div>
                ) : <p className="text-center text-[var(--text-color-muted)]">Calculating end results...</p>
            )
        },
        {
            title: "5. Performance Snapshot: Crown vs Crown + Recycling",
            content: (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-black/10 dark:bg-white/5 rounded-lg space-y-1">
                        <h4 className="text-sm text-[var(--text-color-muted)]">Home Loan Payoff Time</h4>
                        <p className="text-3xl font-bold text-[var(--chart-color-crown)]">{debtRecyclingCalculation.termInYears.toFixed(2)} Years</p>
                        <p className="text-xs text-[var(--color-positive-text)] font-semibold">
                            {(crownMoneyLoanCalculation.termInYears - debtRecyclingCalculation.termInYears).toFixed(2)} years sooner
                        </p>
                    </div>
                    <div className="p-3 bg-black/10 dark:bg-white/5 rounded-lg space-y-1">
                        <h4 className="text-sm text-[var(--text-color-muted)]">Total Home Loan Interest Paid</h4>
                        <p className="text-3xl font-bold text-[var(--chart-color-crown)]">{formatCurrency(debtRecyclingCalculation.totalInterest)}</p>
                        <p className="text-xs text-[var(--color-positive-text)] font-semibold">
                            {formatCurrency(crownMoneyLoanCalculation.totalInterest - debtRecyclingCalculation.totalInterest)} saved
                        </p>
                    </div>
                    <div className="p-3 bg-black/10 dark:bg-white/5 rounded-lg space-y-1">
                        <h4 className="text-sm text-[var(--text-color-muted)]">Portfolio Value at Payoff</h4>
                        <p className="text-3xl font-bold text-[var(--chart-color-wealth)]">{formatCurrency(debtRecyclingCalculation.finalInvestmentPortfolioValue)}</p>
                    </div>
                     <div className="p-3 bg-black/10 dark:bg-white/5 rounded-lg space-y-1">
                        <div className="flex items-center justify-center gap-1 text-sm text-[var(--text-color-muted)]">
                           <h4>Net Position at Payoff</h4>
                           <Tooltip text="CALCULATION: Portfolio Value - Investment Loan Balance. This is your net gain from the investment strategy at the moment your home loan is paid off.">
                               <InfoIcon className="h-4 w-4" />
                           </Tooltip>
                        </div>
                        <p className="text-3xl font-bold text-[var(--chart-color-wealth)]">
                            {formatCurrency(debtRecyclingCalculation.finalInvestmentPortfolioValue - debtRecyclingCalculation.finalInvestmentLoanBalance)}
                        </p>
                    </div>
                    {endResult && (
                        <div className="p-3 bg-black/10 dark:bg-white/5 rounded-lg space-y-1">
                            <h4 className="text-sm text-[var(--text-color-muted)]">Passive Income at Payoff</h4>
                            <p className="text-3xl font-bold text-[var(--color-positive-text)]">{formatCurrency(endResult.afterTaxProfit)}</p>
                            <p className="text-xs text-[var(--text-color-muted)] font-semibold">Per Annum (After Tax)</p>
                        </div>
                    )}
                    {debtRecyclingWealthProjection && (
                        <div className="p-3 bg-black/10 dark:bg-white/5 rounded-lg space-y-1">
                             <div className="flex items-center justify-center gap-1 text-sm text-[var(--text-color-muted)]">
                                <h4>Portfolio at Retirement ({appState.idealRetirementAge})</h4>
                               <Tooltip text="This projects the value of your portfolio at your chosen retirement age, assuming you continue to invest your surplus after the home loan is paid off.">
                                   <InfoIcon className="h-4 w-4" />
                               </Tooltip>
                            </div>
                            <p className="text-3xl font-bold text-[var(--chart-color-wealth)]">{formatCurrency(debtRecyclingWealthProjection.totalPortfolioValue)}</p>
                        </div>
                    )}
                </div>
            )
        },
        {
            title: "6. Net Worth Trajectory Comparison",
            content: (
                <>
                    <p className="text-sm text-[var(--text-color-muted)] mb-4">
                        This chart projects your total net worth (Home Equity + Investments - Remaining Debts) over time, comparing all three scenarios. Note the significant acceleration in wealth creation with the Debt Recycling strategy.
                    </p>
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer minWidth={0} minHeight={0}>
                            <AreaChart data={netWorthData} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="age" name="Age" stroke="var(--text-color)" tick={{ fontSize: 12 }} label={{ value: 'Age', position: 'insideBottom', offset: -10, fill: 'var(--text-color-muted)' }}/>
                                <YAxis stroke="var(--text-color)" tickFormatter={formatChartCurrency} tick={{ fontSize: 12 }} />
                                <RechartsTooltip content={<CustomTooltip formatter={formatCurrency} />} />
                                <Legend wrapperStyle={{fontSize: "14px", color: "var(--text-color-muted)"}} verticalAlign="top" />
                                <Area type="monotone" dataKey="Bank" stroke="var(--chart-color-bank)" fill="var(--chart-color-bank)" fillOpacity={0.2} strokeWidth={2} dot={false}/>
                                <Area type="monotone" dataKey="Crown Money" stroke="var(--chart-color-crown)" fill="var(--chart-color-crown)" fillOpacity={0.2} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                <Area type="monotone" dataKey="Crown + Recycling" name="Crown + Recycling 🏆" stroke="var(--chart-color-wealth)" fill="var(--chart-color-wealth)" fillOpacity={0.3} strokeWidth={3} dot={false}/>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )
        },
        {
            title: "7. Debt Composition (Debt Recycling Strategy)",
            content: (
                <>
                    <p className="text-sm text-[var(--text-color-muted)] mb-4">
                        This chart shows how your debt is transformed. The non-deductible home loan (purple area) is paid down, while the tax-deductible investment loan (pink area) grows. The solid yellow line shows that your total debt level remains high initially, but its structure becomes much more efficient for wealth creation.
                    </p>
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer minWidth={0} minHeight={0}>
                            <ComposedChart data={debtCompositionData} stackOffset="none" margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="year" type="number" domain={[0, 'dataMax']} stroke="var(--text-color)" tick={{ fontSize: 12 }} label={{ value: 'Years', position: 'insideBottom', offset: -10, fill: 'var(--text-color-muted)' }}/>
                                <YAxis stroke="var(--text-color)" tickFormatter={formatChartCurrency} tick={{ fontSize: 12 }} />
                                <RechartsTooltip content={<CustomTooltip formatter={formatCurrency} />} />
                                <Legend wrapperStyle={{fontSize: "14px", color: "var(--text-color-muted)"}} verticalAlign="top" />
                                <Area type="monotone" dataKey="Home Loan" name="Home Loan (Bad Debt)" stackId="1" stroke="var(--chart-color-crown)" fill="var(--chart-color-crown)" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="Investment Loan" name="Investment Loan (Good Debt)" stackId="1" stroke="var(--chart-color-interest)" fill="var(--chart-color-interest)" fillOpacity={0.6} />
                                <Line type="monotone" dataKey="Total Debt" stroke="#facc15" strokeWidth={3} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )
        }
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <Accordion items={accordionItems} defaultOpenIndex={0} />
        </div>
    );
};

export default React.memo(Tab_DebtRecycling);
