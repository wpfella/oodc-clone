import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AppState, AmortizationDataPoint } from '../types';
import { SparklesIcon, PaperAirplaneIcon, XMarkIcon } from './common/IconComponents';

interface AssistantProps {
  appState: AppState;
  calculations: any;
  activeTab: string;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const formatCurrency = (value: number, digits = 0) => {
    if (isNaN(value) || !isFinite(value)) return 'N/A';
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
};

const getYear1Data = (schedule: AmortizationDataPoint[]) => {
    if (!schedule) return { interest: 0, principal: 0 };
    const year1Schedule = schedule.slice(0, 12);
    const interest = year1Schedule.reduce((sum, item) => sum + item.interestPaid, 0);
    const principal = year1Schedule.reduce((sum, item) => sum + item.principalPaid, 0);
    return { interest, principal };
};


const generateAssistantContext = (appState: AppState, calculations: any, activeTab: string): string => {
    const { 
        loan, people, investmentProperties, idealRetirementAge, payoffStrategy, futureChanges, futureLumpSums,
        incomes, expenses, otherDebts, debtRecyclingInvestmentRate, debtRecyclingLoanInterestRate, marginalTaxRate, debtRecyclingPercentage
    } = appState;
    const { 
        bankLoanCalculation, 
        crownMoneyLoanCalculation, 
        debtRecyclingCalculation,
        investmentLoanCalculations,
        totalMonthlyIncome,
        totalMonthlyLivingExpenses,
        surplus,
        retirementWealthProjection,
        investmentPropertiesNetCashflow
    } = calculations;

    const bankYear1 = getYear1Data(bankLoanCalculation.amortizationSchedule);
    const crownYear1 = getYear1Data(crownMoneyLoanCalculation.amortizationSchedule);

    // Re-calculate the example numbers for the visual guide to pass to the AI
    const year1PrincipalPaid = (debtRecyclingCalculation.amortizationSchedule || [])
        .slice(0, 12)
        .reduce((sum, entry) => sum + entry.principalPaid, 0);
    const amountToRecycle = year1PrincipalPaid > 100 ? year1PrincipalPaid * (debtRecyclingPercentage / 100) : 10000;
    const grossReturn = amountToRecycle * (debtRecyclingInvestmentRate / 100);
    const interestCost = amountToRecycle * (debtRecyclingLoanInterestRate / 100);
    const netProfitBeforeTax = grossReturn - interestCost;
    const taxOnProfit = netProfitBeforeTax > 0 ? netProfitBeforeTax * (marginalTaxRate / 100) : 0;
    const netProfit = netProfitBeforeTax - taxOnProfit;

    const summary = {
        activeTab: activeTab,
        client: {
            borrowers: people.map(p => `${p.name} (Age ${p.age})`),
            email: appState.clientEmail || 'Not provided',
        },
        primaryLoan: {
            amount: formatCurrency(loan.amount),
            interestRate: `${loan.interestRate.toFixed(2)}%`,
            repayment: `${formatCurrency(loan.repayment)} / ${loan.frequency}`,
            offsetBalance: formatCurrency(loan.offsetBalance),
            netLoanAmount: formatCurrency(loan.amount - loan.offsetBalance),
        },
        budget: {
            totalMonthlyIncome: formatCurrency(totalMonthlyIncome),
            totalMonthlyLivingExpenses: formatCurrency(totalMonthlyLivingExpenses),
            monthlySurplus: formatCurrency(surplus),
            investmentNetCashflow: formatCurrency(investmentPropertiesNetCashflow),
        },
        formulas: {
            netLoanAmount: "Loan Amount - Offset Balance",
            monthlySurplus: "Total Monthly Income - Total Monthly Living Expenses",
            totalInterestSaved: "(Bank Total Interest - Crown Money Total Interest) for all loans combined.",
            yearsSaved: "Bank Payoff Years - Crown Money Payoff Years",
            debtRecyclingNetProfit: "(Gross Investment Return - Investment Loan Interest) - Tax on Profit. Tax is calculated using the Marginal Tax Rate.",
            netWorth: "Home Equity + Investment Portfolio Value - Remaining Debt",
            investmentPower: "This is your monthly surplus (Total Income - Total Monthly Expenses), which is available for investing once your home loan is paid off with the Crown Money strategy."
        },
        debtRecycling: {
            assumptions: {
                investmentRate: debtRecyclingInvestmentRate,
                loanInterestRate: debtRecyclingLoanInterestRate,
                marginalTaxRate: marginalTaxRate,
                percentageToRecycle: debtRecyclingPercentage
            },
            visualGuideExample: {
                step1_monthlySurplus: formatCurrency(surplus),
                step2_amountToRecycle: formatCurrency(amountToRecycle),
                step3_grossReturn: formatCurrency(grossReturn),
                step4_interestCost: formatCurrency(interestCost),
                step4_netProfit: formatCurrency(netProfit),
            },
            endResult: {
                homePayoffYears: debtRecyclingCalculation.termInYears.toFixed(1),
                finalPortfolioValue: formatCurrency(debtRecyclingCalculation.finalInvestmentPortfolioValue),
                passiveIncome: formatCurrency((debtRecyclingCalculation.finalInvestmentPortfolioValue * (debtRecyclingInvestmentRate / 100)) * (1 - marginalTaxRate/100) - (debtRecyclingCalculation.finalInvestmentLoanBalance * (debtRecyclingLoanInterestRate / 100))),
            }
        },
        futureEvents: {
            scheduledChanges: futureChanges.map(c => ({
                description: c.description,
                type: c.type,
                change: `${c.changeAmount >= 0 ? '+' : ''}${formatCurrency(c.changeAmount)} / ${c.frequency}`,
                timeline: `From ${c.startDate} to ${c.isPermanent ? 'Permanent' : c.endDate}`
            })),
            lumpSumEvents: futureLumpSums.map(l => ({
                description: l.description,
                type: l.type,
                amount: formatCurrency(l.amount),
                date: l.date
            })),
        },
        investments: {
            count: investmentProperties.length,
            totalDebt: formatCurrency(investmentLoanCalculations.totalInvestmentDebt),
            payoffStrategy: payoffStrategy,
        },
        comparison: {
            bank: {
                primaryLoanPayoffYears: bankLoanCalculation.termInYears.toFixed(1),
                primaryLoanTotalInterest: formatCurrency(bankLoanCalculation.totalInterest),
                totalInvestmentPayoffYears: investmentLoanCalculations.totalBankTerm.toFixed(1),
                firstYearPrincipalPaid: formatCurrency(bankYear1.principal),
                firstYearInterestPaid: formatCurrency(bankYear1.interest)
            },
            crownMoney: {
                primaryLoanPayoffYears: crownMoneyLoanCalculation.termInYears.toFixed(1),
                primaryLoanTotalInterest: formatCurrency(crownMoneyLoanCalculation.totalInterest),
                totalInvestmentPayoffYears: investmentLoanCalculations.totalCrownTerm.toFixed(1),
                firstYearPrincipalPaid: formatCurrency(crownYear1.principal),
                firstYearInterestPaid: formatCurrency(crownYear1.interest)
            },
            savings: {
                totalInterestSaved: formatCurrency(
                    (bankLoanCalculation.totalInterest - crownMoneyLoanCalculation.totalInterest) +
                    (investmentLoanCalculations.totalBankInterest - investmentLoanCalculations.totalCrownInterest)
                ),
                yearsSavedOnPrimaryLoan: (bankLoanCalculation.termInYears - crownMoneyLoanCalculation.termInYears).toFixed(1)
            }
        },
        wealthProjection: {
            retirementAge: idealRetirementAge,
            projectedNetWorthAtRetirement: formatCurrency(
                retirementWealthProjection.wealth + retirementWealthProjection.cashInHand + retirementWealthProjection.homeEquity
            ),
        },
        itemizedIncomes: incomes,
        itemizedExpenses: expenses,
        itemizedOtherDebts: otherDebts,
        detailedInvestmentProperties: investmentProperties,
    };
    
    return JSON.stringify(summary, null, 2);
};


const Assistant: React.FC<AssistantProps> = ({ appState, calculations, activeTab }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatBodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!userInput.trim() || isLoading) return;

        const newMessages: Message[] = [...messages, { sender: 'user', text: userInput }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const context = generateAssistantContext(appState, calculations, activeTab);

            const prompt = `
You are "Cody", an expert financial assistant for the Crown Money "Out of Debt Calculator". Your personality is helpful, knowledgeable, and slightly informal, using Australian-style language (e.g., "G'day", "no worries", "have a squiz"). 

Your primary role is to help the Crown Money sales agent explain the numbers, charts, and calculations to their client, using the provided JSON context. You should also encourage users to hover over the info icons on the app for quick tooltips.

**CRITICAL OUTPUT REQUIREMENTS:**
1.  **FORMAT:** Your entire response MUST be in well-structured, readable HTML. Use tags like <p>, <strong>, <em>, <ul>, and <li> for formatting. Do NOT use markdown or headings (h1, h2, etc.).
2.  **CLARITY:** Explain everything in plain English. Avoid technical financial jargon.
3.  **STYLE:** Use paragraphs to separate ideas. Use bold tags (<strong>) to highlight key figures and terms. Use lists (<ul><li>) for breaking down steps or points.
4.  **CONCISENESS:** Be concise but thorough.

**HOW TO EXPLAIN CALCULATIONS:**
When a user asks 'how' a number is calculated, you MUST break it down using simple math and the values from the JSON context. Refer to the 'formulas' object in the JSON for the correct calculation method. For example, for Monthly Surplus, explain it's 'Total Monthly Income - Total Monthly Living Expenses' and use the actual numbers from the context.

**DETAILED DATA:**
The JSON context includes itemized lists: 'itemizedIncomes', 'itemizedExpenses', 'itemizedOtherDebts', and 'detailedInvestmentProperties'. When a user asks about a *specific item* (e.g., "How much is my food budget?" or "What's the interest rate on my car loan?"), you MUST find that exact item in these lists and provide the specific details.

**LUMP SUM EVENTS:**
When asked about a lump sum event, explain the difference:
*   **Bank Scenario:** An INCOME goes to the offset, reducing interest paid over time. An EXPENSE is a redraw, increasing the loan balance if offset is depleted.
*   **Crown Money Scenario:** An INCOME immediately pays down the principal. An EXPENSE directly increases the loan balance.
Always use the specific event details (description, amount, date) from the context.

**DEBT RECYCLING EXPLANATIONS:**
If the user asks about the 'Debt Recycling' tab or its visual guide, you MUST explain the 5-step cycle using the numbers from the 'debtRecycling.visualGuideExample' object in the context.
*   **Step 1:** The surplus used is from 'budget.monthlySurplus'.
*   **Step 2:** The amount re-borrowed is 'step2_amountToRecycle'. Explain this is an example based on principal paid in the first year.
*   **Step 3:** The gross return is 'step3_grossReturn'. Explain it's calculated using the 'debtRecycling.assumptions.investmentRate'.
*   **Step 4:** The net profit is 'step4_netProfit'. This is CRITICAL. You must explain the full calculation: (Gross Return - Interest Cost) and then the reduction due to the 'debtRecycling.assumptions.marginalTaxRate'.
*   **Step 5:** Explain this repeats, creating a snowball effect.

**"EXPLAIN THIS TAB" / VOICE EXPLANATIONS:**
If the user asks a general question like 'explain this tab', 'how does this work for me', or 'can you explain this scenario', you MUST provide a full, conversational, step-by-step walkthrough of the active tab. If the active tab is 'Debt Recycling', give a detailed explanation of the 5-step cycle using the client's specific numbers from the context. Structure this response as if you are speaking directly to the client.

**CHART/GRAPH GENERATION:**
You CANNOT generate images. If a chart would be helpful, you MUST instead describe it in detail using HTML. For example: "<p>I can't draw a chart for you, but I can describe it. Imagine a bar chart with two bars for 'Net Worth at Retirement':</p><ul><li>The 'Bank' bar would be at <strong>${JSON.parse(context).comparison.bank.projectedNetWorthAtRetirement || formatCurrency(calculations.totalBankNetPositionAtRetirement)}</strong>.</li><li>The 'Crown Money' bar would be much higher at <strong>${JSON.parse(context).wealthProjection.projectedNetWorthAtRetirement}</strong>, showing a huge advantage!</li></ul>"

The user is currently on the "${activeTab}" tab.
Here is a JSON summary of their current financial data:
${context}

Based on this data, answer the user's question clearly.

User's Question: "${userInput}"
`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setMessages([...newMessages, { sender: 'ai', text: response.text }]);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setMessages([...newMessages, { sender: 'ai', text: "<p>Sorry, I'm having a bit of trouble connecting right now. Please try again in a moment.</p>" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-[var(--title-color)] text-white p-4 rounded-full shadow-lg hover:bg-[var(--button-bg-hover-color)] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-color)] focus:ring-[var(--title-color)] z-40 print:hidden"
                aria-label="Open AI Assistant"
            >
                <SparklesIcon className="h-8 w-8" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-end sm:items-center z-50 print:hidden">
                    <div className="bg-[var(--card-bg-color)] border border-[var(--border-color)] rounded-t-2xl sm:rounded-2xl w-full max-w-2xl h-[80vh] sm:h-[70vh] flex flex-col shadow-2xl animate-fade-in-up">
                        <header className="flex justify-between items-center p-4 border-b border-[var(--border-color)]">
                            <h3 className="text-lg font-bold text-[var(--title-color)]">AI Financial Assistant</h3>
                            <button onClick={() => setIsOpen(false)} className="text-[var(--text-color-muted)] hover:text-[var(--text-color)]">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </header>

                        <div ref={chatBodyRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-[var(--text-color-muted)] p-8">
                                    <p className="font-semibold text-lg">G'day!</p>
                                    <p>I can now explain your figures. Ask me anything about your data, like:</p>
                                    <ul className="text-sm mt-4 space-y-2">
                                        <li className="p-2 bg-black/10 dark:bg-white/5 rounded-md">"How is my total interest saving calculated?"</li>
                                        <li className="p-2 bg-black/10 dark:bg-white/5 rounded-md">"Why doesn't the Bank loan balance drop after an inheritance?"</li>
                                        <li className="p-2 bg-black/10 dark:bg-white/5 rounded-md">"Explain the debt recycling visual guide for my scenario."</li>
                                    </ul>
                                </div>
                            )}
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-[var(--button-bg-color)] text-white' : 'bg-[var(--input-bg-color)]'}`}>
                                        {msg.sender === 'ai' ? (
                                            <div 
                                                className="text-sm ai-response-content"
                                                dangerouslySetInnerHTML={{ __html: msg.text }}
                                            />
                                        ) : (
                                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                 <div className="flex justify-start">
                                    <div className="max-w-md p-3 rounded-lg bg-[var(--input-bg-color)]">
                                        <div className="flex items-center gap-2 text-sm text-[var(--text-color-muted)]">
                                            <div className="h-2 w-2 bg-[var(--title-color)] rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                            <div className="h-2 w-2 bg-[var(--title-color)] rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                            <div className="h-2 w-2 bg-[var(--title-color)] rounded-full animate-pulse"></div>
                                            <span>Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <footer className="p-4 border-t border-[var(--border-color)]">
                            <div className="flex items-center gap-2 bg-[var(--input-bg-color)] p-2 rounded-lg border border-[var(--input-border-color)] focus-within:ring-2 focus-within:ring-[var(--input-border-focus-color)]">
                                <textarea
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask a question about your data..."
                                    className="flex-1 bg-transparent focus:outline-none resize-none text-sm"
                                    rows={1}
                                    disabled={isLoading}
                                />
                                <button onClick={handleSend} disabled={isLoading || !userInput.trim()} className="bg-[var(--button-bg-color)] text-white p-2 rounded-md disabled:bg-opacity-50 disabled:cursor-not-allowed transition-colors">
                                    <PaperAirplaneIcon className="h-5 w-5"/>
                                </button>
                            </div>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
};

export default Assistant;