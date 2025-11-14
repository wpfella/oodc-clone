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
                <p className="label text-[var(--tooltip-text-color)] font-bold mb-1">{`Year: ${label}`}</p>
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


const DebtRecyclingVisualGuide: React.FC<{ appState: AppState, calculations: any }> = ({ appState, calculations }) => {
    const { surplus, crownMoneyLoanCalculation } = calculations;
    const { debtRecyclingInvestmentRate, debtRecyclingLoanInterestRate, marginalTaxRate, debtRecyclingPercentage } = appState;
    
    const { amountToRecycle, grossReturn, netProfit, interestCost, year1CrownPrincipalPaid } = useMemo(() => {
        const principalPaid = crownMoneyLoanCalculation.year1PrimaryOnlyPrincipalPaid;

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

    // --- Icon Components ---
    const IconStep1 = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full"><g stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M70 45a20 20 0 00-40 0h-10v50h60v-50z"/><path d="M85 55l-10-10m-5 15l-10-10m-5 15l-10-10m-5 15l-10-10m-5 15l-10-10"/></g><path d="M50 75a10 10 0 100-20 10 10 0 000 20z" fill="#4ade80"/><path d="M54 60h-8v2h8zm0 5h-8v2h8zm-8 5h8v2h-8z" fill="white"/></svg>
    );
    const IconStep2 = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full"><path d="M50 15L5 45h10v45h70v-45h10z" stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinejoin="round"/><path d="M40 90v-20h20v20" stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinejoin="round"/><path d="M25 55L50 75l25-20" stroke="#4ade80" strokeWidth="5" fill="none" strokeLinecap="round"/><path d="M42 75l8 8 8-8" stroke="#4ade80" strokeWidth="5" fill="none" strokeLinecap="round"/></svg>
    );
    const IconStep3 = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full"><path d="M50 15L5 45h10v45h70v-45h10z" stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinejoin="round"/><path d="M40 90v-20h20v20" stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinejoin="round"/><path d="M50 35L75 55 50 75 25 55z" fill="#4ade80"/><path d="M70 55h-40" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"/><path d="M38 47l-8 8 8 8" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"/></svg>
    );
    const IconStep4 = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full"><g fill="#4ade80"><rect x="15" y="70" width="14" height="20" rx="3"/><rect x="33" y="50" width="14" height="40" rx="3"/><rect x="51" y="30" width="14" height="60" rx="3"/><rect x="69" y="10" width="14" height="80" rx="3"/></g></svg>
    );
    const IconStep5 = () => (
        <svg viewBox="0 0 100 100" className="w-full h-full"><path d="M50 10a40 40 0 110 80 40 40 0 010-80" stroke="#4ade80" strokeWidth="8" fill="none" strokeDasharray="200 50" strokeLinecap="round" transform="rotate(-45 50 50)"/><path d="M40 20l-15 15 15 15" stroke="#4ade80" strokeWidth="8" fill="none" strokeLinecap="round"/><circle cx="50" cy="50" r="18" fill="#4ade80"/><text x="50" y="58" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white">$</text></svg>
    );

    const Step = ({ stepNum, icon, title, description }: { stepNum: number, icon: React.ReactNode, title: string, description: React.ReactNode }) => (
        <div className="flex flex-col items-center text-center w-48">
            <div className="relative w-24 h-24 mb-2">
                <div className="absolute -top-2 -left-2 w-8 h-8 bg-[var(--title-color)] text-white rounded-full flex items-center justify-center font-bold text-lg z-10">{stepNum}</div>
                {icon}
            </div>
            <h4 className="font-bold text-sm leading-tight">{title}</h4>
            <p className="text-xs text-[var(--text-color-muted)] mt-1">{description}</p>
        </div>
    );
    
    const Arrow = ({ rotation = 0 }: { rotation?: number }) => (
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-sky-400 mx-4" style={{ transform: `rotate(${rotation}deg)` }}>
            <path fill="currentColor" d="M14 18l-1.41-1.41L16.17 13H4v-2h12.17l-3.58-3.59L14 6l6 6-6 6z"/>
        </svg>
    );


    return (
        <div className="p-4 rounded-lg overflow-x-auto">
            <h3 className="text-xl font-bold text-center text-[var(--title-color)] mb-8">How Debt Recycling Works (5-Step Cycle)</h3>
            <div className="relative min-w-[1000px]">
                <div className="flex justify-between items-center mb-8">
                     <Step
                        stepNum={1}
                        icon={<IconStep1 />}
                        title="Your Income & Surplus"
                        description={<>Start with your budget surplus of <strong className="text-[var(--text-color)]">{formatCurrency(surplusPerYear, 0)}/yr</strong>.</>}
                    />
                    <Arrow />
                     <Step
                        stepNum={2}
                        icon={<IconStep2 />}
                        title="Flood the Loan Principal"
                        description="Use your surplus and reinvested profits to pay down your home loan faster."
                    />
                    <Arrow />
                     <Step
                        stepNum={3}
                        icon={<IconStep3 />}
                        title="Re-borrow from Equity"
                        description={<>Re-draw paid-down equity (e.g., <strong className="text-[var(--text-color)]">{formatCurrency(amountToRecycle, 0)}</strong>) as a new loan.</>}
                    />
                </div>

                <svg className="absolute top-40 left-0 w-full h-40 pointer-events-none">
                    {/* Down arrow from step 3 */}
                    <path d="M890 0 V 50" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowhead)"/>
                    {/* Left arrow from step 4 */}
                    <path d="M890 50 H 500" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
                    {/* Left arrow from step 5 */}
                    <path d="M350 50 H 130" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arrowhead)" />
                    {/* Up arrow to step 2 */}
                    <path d="M130 50 V 0" stroke="#4ade80" strokeWidth="5" strokeLinecap="round" markerEnd="url(#arrowhead-reinvest)"/>
                    <defs>
                        <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8"/></marker>
                        <marker id="arrowhead-reinvest" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#4ade80"/></marker>
                    </defs>
                </svg>

                <div className="flex justify-between items-center flex-row-reverse mt-32">
                     <Step
                        stepNum={4}
                        icon={<IconStep4 />}
                        title="Invest in Passive Income"
                        description={<>Generate returns, e.g., <strong className="text-[var(--color-positive-text)]">{formatCurrency(grossReturn, 0)}/yr</strong> at {debtRecyclingInvestmentRate}% p.a.</>}
                    />
                    <Step
                        stepNum={5}
                        icon={<IconStep5 />}
                        title="Generate & Reinvest Profits"
                        description={<>Use net profits (e.g., <strong className="text-[var(--color-positive-text)]">{formatCurrency(netProfit, 0)}/yr</strong>) to make more extra repayments (back to Step 2).</>}
                    />
                    <div className="w-48"></div> {/* Spacer to align Step 5 under Step 2 */}
                </div>
            </div>

             <div className="mt-12 pt-4 border-t border-dashed border-[var(--border-color)] text-center text-xs text-[var(--text-color-muted)] max-w-4xl mx-auto space-y-2">
                <h5 className="font-bold text-sm text-[var(--text-color)]">How are these example numbers calculated?</h5>
                <p><strong className="text-[var(--text-color-muted)]">Step 1 Surplus:</strong> Your total monthly income minus total monthly expenses from the budget tab.</p>
                <p><strong className="text-[var(--text-color-muted)]">Step 3 Re-borrow Amount:</strong> Based on an example of principal paid down in Year 1 of the standard Crown scenario (<strong className="text-[var(--text-color)]">{formatCurrency(year1CrownPrincipalPaid)}</strong>), multiplied by your chosen 'Percentage to Recycle'.</p>
                <p><strong className="text-[var(--text-color-muted)]">Step 4 Gross Return:</strong> Amount Re-borrowed (<strong className="text-[var(--text-color)]">{formatCurrency(amountToRecycle)}</strong>) × Assumed Investment Return (<strong className="text-[var(--text-color)]">{debtRecyclingInvestmentRate}%</strong>).</p>
                <p><strong className="text-[var(--text-color-muted)]">Step 5 Net Profit:</strong> (Gross Return - Interest Cost) - Tax on Profit. The investment loan interest (<strong className="text-[var(--text-color)]">{formatCurrency(interestCost)}</strong>) is tax-deductible against your marginal tax rate.</p>
            </div>
        </div>
    );
};


const Tab_DebtRecycling: React.FC<Props> = ({ appState, setAppState, calculations }) => {
    const { crownMoneyLoanCalculation, debtRecyclingCalculation, debtRecyclingWealthProjection } = calculations;

    if (crownMoneyLoanCalculation.termInYears === Infinity) {
        return (
            <Card>
                <div className="text-center text-yellow-400 p-4 bg-yellow-900/50 rounded-lg">
                    <p className="font-bold text-lg">Cannot Calculate Scenarios</p>
                    <p>Your primary home loan must be payable under the standard Crown Money strategy first. Check your budget on the 'Income & Expenses' tab.</p>
                </div>
            </Card>
        );
    }

    const handleStateChange = (field: keyof AppState, value: any) => {
        setAppState(prev => ({ ...prev, [field]: value }));
    };

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
            title: "1. Debt Recycling Setup & Assumptions",
            content: (
                <div className="space-y-6">
                    <p className="text-sm text-[var(--text-color-muted)]">
                        Debt recycling is a strategy where you use the equity in your home to invest. As you pay down your home loan principal, you can borrow back that same amount as a separate, tax-deductible investment loan. The goal is to generate investment returns that are higher than the cost of the investment loan interest. The net profit is then used to pay off your non-deductible home loan even faster.
                    </p>
                    <SliderInput
                        label={
                            <div className="flex items-center gap-1">
                                <span>Percentage of Principal to Recycle</span>
                                <Tooltip text="Controls what percentage of the paid-down home loan principal is re-borrowed and invested. 100% uses the full amount available, while a lower percentage represents a more conservative approach.">
                                    <InfoIcon className="h-4 w-4" />
                                </Tooltip>
                            </div>
                        }
                        value={appState.debtRecyclingPercentage}
                        onChange={val => handleStateChange('debtRecyclingPercentage', val)}
                        min={0} max={100} step={1} unit="%"
                    />
                    <SliderInput
                        label={
                            <div className="flex items-center gap-1">
                                <span>Assumed Annual Investment Return</span>
                                <Tooltip text="The average annual return you expect from the investment portfolio. Historically, diversified portfolios have returned 7-8% p.a. over the long term.">
                                    <InfoIcon className="h-4 w-4" />
                                </Tooltip>
                            </div>
                        }
                        value={appState.debtRecyclingInvestmentRate}
                        onChange={val => handleStateChange('debtRecyclingInvestmentRate', val)}
                        min={1} max={15} step={0.25} unit="%"
                    />
                    <SliderInput
                        label="Investment Loan Interest Rate"
                        value={appState.debtRecyclingLoanInterestRate}
                        onChange={val => handleStateChange('debtRecyclingLoanInterestRate', val)}
                        min={1} max={15} step={0.05} unit="%"
                    />
                    <SliderInput
                        label={
                            <div className="flex items-center gap-1">
                                <span>Marginal Tax Rate</span>
                                <Tooltip text="Your highest income tax rate. This is used to calculate both the tax payable on investment returns and the tax deduction benefit on the investment loan interest. The final *after-tax* profit/loss is then used to accelerate your home loan payoff. (e.g., $45k-$120k income is 32.5%)">
                                    <InfoIcon className="h-4 w-4" />
                                </Tooltip>
                            </div>
                        }
                        value={appState.marginalTaxRate}
                        onChange={val => handleStateChange('marginalTaxRate', val)}
                        min={0} max={45} step={0.5} unit="%"
                    />
                </div>
            ),
        },
        {
            title: "2. How Debt Recycling Works: A Visual Guide",
            content: <DebtRecyclingVisualGuide appState={appState} calculations={calculations} />
        },
        {
            title: "3. The Snowball Effect: Year-by-Year Growth",
            content: (
                <>
                    <p className="text-sm text-[var(--text-color-muted)] mb-4">
                        This chart shows the "snowball effect" of debt recycling. As you pay down your non-deductible Home Loan Balance (bad debt), you build up your wealth-generating Investment Portfolio (good debt). The number inside each bar shows the value of your investment portfolio at that year.
                    </p>
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer>
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
                            <p className="text-lg">In <strong className="text-3xl text-[var(--title-color)]">{endResult.termInYears.toFixed(1)} years</strong> your home is Debt Free.</p>
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
                        <p className="text-3xl font-bold text-[var(--chart-color-crown)]">{debtRecyclingCalculation.termInYears.toFixed(1)} Years</p>
                        <p className="text-xs text-[var(--color-positive-text)] font-semibold">
                            {(crownMoneyLoanCalculation.termInYears - debtRecyclingCalculation.termInYears).toFixed(1)} years sooner
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
                        <ResponsiveContainer>
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
                        <ResponsiveContainer>
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