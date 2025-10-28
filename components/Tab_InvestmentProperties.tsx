import React from 'react';
import { AppState, InvestmentProperty, InvestmentPropertyExpense } from '../types';
import Card from './common/Card';
import SliderInput from './common/SliderInput';
import EditableField from './common/EditableField';
import Tooltip from './common/Tooltip';
import { InfoIcon, CalendarIcon } from './common/IconComponents';
import { calculatePIPayment, calculateIOPayment } from '../hooks/useMortgageCalculations';

interface Props {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  calculations: any;
}

const getMonthlyFromAnyFrequency = (amount: number, frequency: 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'annually' ): number => {
    switch (frequency) {
      case 'weekly': return amount * (52/12);
      case 'fortnightly': return amount * (26/12);
      case 'quarterly': return amount / 3;
      case 'annually': return amount / 12;
      case 'monthly':
      default: return amount;
    }
};

const InvestmentPropertyCard: React.FC<{
    property: InvestmentProperty;
    onUpdate: (id: number, field: keyof InvestmentProperty, value: any) => void;
    onRemove: (id: number) => void;
    setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}> = React.memo(({ property, onUpdate, onRemove, setAppState }) => {
    const [isStartDateFocused, setIsStartDateFocused] = React.useState(false);
    const [isPurchaseDateFocused, setIsPurchaseDateFocused] = React.useState(false);

    const formatDateForDisplay = (isoDate: string | undefined): string => {
        if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
            return '';
        }
        const [year, month, day] = isoDate.split('-');
        return `${day}/${month}/${year}`;
    };

    const handleExpenseChange = (expId: number, field: keyof InvestmentPropertyExpense, value: any) => {
        const newExpenses = property.expenses.map(exp => 
            exp.id === expId ? { ...exp, [field]: value } : exp
        );
        onUpdate(property.id, 'expenses', newExpenses);
    };

    const addExpense = () => {
        const newExpense: InvestmentPropertyExpense = { id: Date.now(), name: 'New Expense', amount: 0, frequency: 'monthly' };
        onUpdate(property.id, 'expenses', [...property.expenses, newExpense]);
    };
    
    const removeExpense = (expId: number) => {
        const newExpenses = property.expenses.filter(exp => exp.id !== expId);
        onUpdate(property.id, 'expenses', newExpenses);
    };

    const getRemainingTerm = () => {
        const startDate = new Date(property.loanStartDate);
        const today = new Date();
         if (isNaN(startDate.getTime())) return property.loanTerm;

        const yearsElapsed = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        return Math.max(0.1, property.loanTerm - yearsElapsed);
    };
    
    const handleCalculatePI = () => {
        const remainingTerm = getRemainingTerm();
        const netLoanAmount = Math.max(0, property.loanAmount - (property.offsetBalance || 0));
        const newRepayment = calculatePIPayment(netLoanAmount, property.interestRate, remainingTerm, property.repaymentFrequency);
        onUpdate(property.id, 'repayment', Math.round(newRepayment));
        onUpdate(property.id, 'loanType', 'P&I');
        onUpdate(property.id, 'interestOnlyTerm', 0);
    };

    const handleCalculateIO = () => {
        const netLoanAmount = Math.max(0, property.loanAmount - (property.offsetBalance || 0));
        const newRepayment = calculateIOPayment(netLoanAmount, property.interestRate, property.repaymentFrequency);
        onUpdate(property.id, 'repayment', Math.round(newRepayment));
        onUpdate(property.id, 'loanType', 'IO');
    };

    const netLoanAmount = Math.max(0, property.loanAmount - (property.offsetBalance || 0));
    const remainingTerm = getRemainingTerm();

    const minRepayment = property.loanType === 'P&I' 
        ? calculatePIPayment(netLoanAmount, property.interestRate, remainingTerm, property.repaymentFrequency)
        : calculateIOPayment(netLoanAmount, property.interestRate, property.repaymentFrequency);
        
    const handleRepaymentBlur = () => {
        if (property.repayment < minRepayment) {
            onUpdate(property.id, 'repayment', Math.ceil(minRepayment));
        }
    };


    const monthlyRental = getMonthlyFromAnyFrequency(property.rentalIncome, property.rentalIncomeFrequency);
    const monthlyRepayment = getMonthlyFromAnyFrequency(property.repayment, property.repaymentFrequency);
    const monthlyExpenses = property.expenses.reduce((sum, exp) => sum + getMonthlyFromAnyFrequency(exp.amount, exp.frequency), 0);
    const netCashflow = monthlyRental - monthlyRepayment - monthlyExpenses;

    const formatCurrency = (value: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    
    const titleClasses = "text-lg font-bold text-[var(--title-color)]";
    const inputClasses = "w-full bg-[var(--input-bg-color)] p-2 rounded-md border border-[var(--input-border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus-color)]";
    const selectClasses = `custom-select ${inputClasses}`;

    return (
        <Card className="mb-6">
            <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-grow">
                     <EditableField 
                        label="Property Address" 
                        value={property.address} 
                        onSave={(val) => onUpdate(property.id, 'address', val)} 
                        inputClassName={titleClasses}
                        valueClassName={titleClasses}
                     />
                </div>
                <div className="flex-shrink-0 flex items-center gap-4 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer print:hidden">
                        <input
                            type="checkbox"
                            checked={property.isFuture || false}
                            onChange={e => onUpdate(property.id, 'isFuture', e.target.checked)}
                            className="h-4 w-4 rounded accent-[var(--input-border-focus-color)]"
                        />
                        <span className="text-sm font-medium text-[var(--text-color-muted)] whitespace-nowrap">Future Purchase?</span>
                    </label>
                    <button onClick={() => onRemove(property.id)} className="text-red-400 hover:text-red-600 text-2xl font-bold z-10 print:hidden leading-none -translate-y-1">×</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Left Column: Property & Loan */}
                <div className="space-y-6">
                    {property.isFuture && (
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-color)] mb-1">Target Purchase Date</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <CalendarIcon className="h-5 w-5 text-[var(--text-color-muted)]" />
                                </div>
                                <input
                                    type={isPurchaseDateFocused ? 'date' : 'text'}
                                    value={isPurchaseDateFocused ? property.purchaseDate : formatDateForDisplay(property.purchaseDate)}
                                    onFocus={() => setIsPurchaseDateFocused(true)}
                                    onBlur={() => setIsPurchaseDateFocused(false)}
                                    onChange={e => onUpdate(property.id, 'purchaseDate', e.target.value)}
                                    placeholder="DD/MM/YYYY"
                                    className={`${inputClasses} custom-date-input pl-10`}
                                />
                            </div>
                        </div>
                    )}
                    <SliderInput label="Property Value" value={property.propertyValue} onChange={val => onUpdate(property.id, 'propertyValue', val)} min={100000} max={3000000} step={10000} unit="$" />
                    <SliderInput label="Loan Amount" value={property.loanAmount} onChange={val => onUpdate(property.id, 'loanAmount', val)} min={0} max={3000000} step={10000} unit="$" />
                    <SliderInput label="Offset Account Balance" value={property.offsetBalance || 0} onChange={val => onUpdate(property.id, 'offsetBalance', val)} min={0} max={property.loanAmount} step={1000} unit="$" />
                    <div className="text-right -mt-4 text-sm text-[var(--text-color-muted)] print:hidden">
                        Net Loan Amount: <span className="font-bold text-[var(--text-color)]">{formatCurrency(netLoanAmount)}</span>
                    </div>
                    <SliderInput label="Interest Rate" value={property.interestRate} onChange={val => onUpdate(property.id, 'interestRate', val)} min={1} max={15} step={0.05} unit="%" />
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-color)] mb-1">Loan Term</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={property.loanTerm}
                                onChange={e => onUpdate(property.id, 'loanTerm', parseInt(e.target.value) || 0)}
                                className={`${inputClasses} pr-16`}
                            />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-color-muted)]">Years</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-color)] mb-1">Loan Start / Refinance Date</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <CalendarIcon className="h-5 w-5 text-[var(--text-color-muted)]" />
                            </div>
                            <input
                                type={isStartDateFocused ? 'date' : 'text'}
                                value={isStartDateFocused ? property.loanStartDate : formatDateForDisplay(property.loanStartDate)}
                                onFocus={() => setIsStartDateFocused(true)}
                                onBlur={() => setIsStartDateFocused(false)}
                                onChange={e => onUpdate(property.id, 'loanStartDate', e.target.value)}
                                placeholder="DD/MM/YYYY"
                                className={`${inputClasses} custom-date-input pl-10`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-color)] mb-1">Repayments</label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-grow">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-color-muted)]">$</span>
                                <input 
                                    type="number" 
                                    value={property.repayment} 
                                    onChange={e => onUpdate(property.id, 'repayment', parseFloat(e.target.value) || 0)} 
                                    onBlur={handleRepaymentBlur}
                                    min={Math.ceil(minRepayment)}
                                    className={`${inputClasses} pl-7`} 
                                />
                            </div>
                            <select value={property.repaymentFrequency} onChange={e => onUpdate(property.id, 'repaymentFrequency', e.target.value)} className={selectClasses}>
                                <option value="weekly">Weekly</option>
                                <option value="fortnightly">Fortnightly</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="annually">Annually</option>
                            </select>
                        </div>
                        {minRepayment > 0 && (
                            <p className="text-xs text-red-400 mt-1 print:hidden">
                                Min. {property.loanType} Repayment: {formatCurrency(Math.ceil(minRepayment))}
                            </p>
                        )}
                         <div className="mt-2 flex gap-2">
                            <button
                                onClick={handleCalculateIO}
                                className={`w-full p-2 text-sm rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--card-bg-color)] focus:ring-[var(--input-border-focus-color)] ${property.loanType === 'IO' ? 'bg-[var(--title-color)] text-white' : 'bg-[var(--input-bg-color)] hover:bg-opacity-80 border border-[var(--input-border-color)] text-[var(--title-color)]'}`}
                                aria-pressed={property.loanType === 'IO'}
                            >
                                Interest Only
                            </button>
                            <button
                                onClick={handleCalculatePI}
                                className={`w-full p-2 text-sm rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--card-bg-color)] focus:ring-[var(--input-border-focus-color)] ${property.loanType === 'P&I' ? 'bg-[var(--title-color)] text-white' : 'bg-[var(--input-bg-color)] hover:bg-opacity-80 border border-[var(--input-border-color)] text-[var(--title-color)]'}`}
                                aria-pressed={property.loanType === 'P&I'}
                            >
                                Principal & Interest
                            </button>
                        </div>
                    </div>
                     {property.loanType === 'IO' && (
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-color)] mb-1 flex items-center gap-1">
                                Interest Only Term
                                <Tooltip text="The number of years the loan will be interest-only before converting to P&I for the remaining term. Leave as 0 or equal to Loan Term if it is interest-only for the full duration.">
                                    <InfoIcon className="h-4 w-4 text-[var(--text-color-muted)]"/>
                                </Tooltip>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={property.interestOnlyTerm || 0}
                                    onChange={e => onUpdate(property.id, 'interestOnlyTerm', parseInt(e.target.value) || 0)}
                                    className={`${inputClasses} pr-16`}
                                    min={0}
                                    max={property.loanTerm}
                                />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-color-muted)]">Years</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Income & Expenses */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-color)] mb-1">Rental Income</label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-grow">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-color-muted)]">$</span>
                                <input type="number" value={property.rentalIncome} onChange={e => onUpdate(property.id, 'rentalIncome', parseFloat(e.target.value))} className={`${inputClasses} pl-7`} />
                            </div>
                            <select value={property.rentalIncomeFrequency} onChange={e => onUpdate(property.id, 'rentalIncomeFrequency', e.target.value)} className={selectClasses}>
                                <option value="weekly">Weekly</option>
                                <option value="fortnightly">Fortnightly</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="annually">Annually</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-color)] mb-1">Annual Rental Growth</label>
                        <div className="relative">
                             <input type="number" value={property.rentalGrowthRate || 0} onChange={e => onUpdate(property.id, 'rentalGrowthRate', parseFloat(e.target.value))} className={`${inputClasses} pr-8`} />
                             <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--text-color-muted)]">%</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="text-sm font-medium text-[var(--text-color)]">Expenses</label>
                            <Tooltip text="Enter all known expenses for this property.">
                                <InfoIcon className="h-4 w-4 text-[var(--text-color-muted)]"/>
                            </Tooltip>
                        </div>
                        <div className="space-y-2">
                            {property.expenses.map(exp => (
                                <div key={exp.id} className="flex items-center gap-2">
                                    <input type="text" value={exp.name} onChange={e => handleExpenseChange(exp.id, 'name', e.target.value)} className={`flex-grow ${inputClasses}`} placeholder="Expense Name"/>
                                    <div className="relative w-36">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-color-muted)]">$</span>
                                        <input type="number" value={exp.amount} onChange={e => handleExpenseChange(exp.id, 'amount', parseFloat(e.target.value) || 0)} className={`${inputClasses} w-full pl-7`} placeholder="Amount"/>
                                    </div>
                                    <select value={exp.frequency} onChange={e => handleExpenseChange(exp.id, 'frequency', e.target.value)} className={`${selectClasses} w-32`}>
                                        <option value="weekly">Weekly</option>
                                        <option value="fortnightly">Fortnightly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="annually">Annually</option>
                                    </select>
                                    <button onClick={() => removeExpense(exp.id)} className="text-red-400 hover:text-red-600 font-bold text-lg">×</button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addExpense} className="mt-2 text-sm text-[var(--title-color)] hover:opacity-80 transition-opacity font-semibold">+ Add Expense</button>
                    </div>

                    <div className={`p-4 rounded-lg border ${netCashflow >= 0 ? 'border-[var(--color-positive-text)]' : 'border-[var(--color-negative-text)]'}`} style={{ backgroundColor: netCashflow >= 0 ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)' }}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-lg" style={{ color: netCashflow >= 0 ? 'var(--color-positive-text)' : 'var(--color-negative-text)' }}>Net Monthly Cashflow</span>
                            <span className="font-extrabold text-2xl" style={{ color: netCashflow >= 0 ? 'var(--color-positive-text)' : 'var(--color-negative-text)' }}>{formatCurrency(netCashflow)}</span>
                        </div>
                    </div>

                </div>
            </div>
        </Card>
    );
});


const Tab_InvestmentProperties: React.FC<Props> = ({ appState, setAppState, calculations }) => {
    
    const handleAddProperty = () => {
        const today = new Date().toISOString().split('T')[0];
        
        const propDefaults = {
            propertyValue: 500000,
            loanAmount: 400000,
            offsetBalance: 0,
            loanType: 'IO' as 'P&I' | 'IO',
            interestRate: 6.5,
            loanTerm: 30,
            repaymentFrequency: 'monthly' as 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'annually',
        };
        
        const netLoanAmount = Math.max(0, propDefaults.loanAmount - (propDefaults.offsetBalance || 0));
        
        const minRepayment = propDefaults.loanType === 'P&I'
            ? calculatePIPayment(netLoanAmount, propDefaults.interestRate, propDefaults.loanTerm, propDefaults.repaymentFrequency)
            : calculateIOPayment(netLoanAmount, propDefaults.interestRate, propDefaults.repaymentFrequency);

        const newProperty: InvestmentProperty = {
            id: Date.now(),
            address: 'New Property',
            ...propDefaults,
            loanStartDate: today,
            repayment: Math.ceil(minRepayment),
            interestOnlyTerm: 5,
            rentalIncome: 500,
            rentalIncomeFrequency: 'weekly',
            isFuture: false,
            purchaseDate: today,
            rentalGrowthRate: 3.5,
            expenses: [
                { id: 1, name: 'Rates', amount: 500, frequency: 'quarterly' },
                { id: 2, name: 'Body Corp / Strata', amount: 600, frequency: 'quarterly' },
                { id: 3, name: 'Insurance', amount: 1200, frequency: 'annually' },
                { id: 4, name: 'Real Estate Fees', amount: 200, frequency: 'monthly' },
                { id: 5, name: 'Maintenance Expense', amount: 1000, frequency: 'annually' },
            ],
        };
        setAppState(prev => ({...prev, investmentProperties: [...prev.investmentProperties, newProperty]}));
    };

    const handleRemoveProperty = (id: number) => {
        setAppState(prev => ({
            ...prev,
            investmentProperties: prev.investmentProperties.filter(p => p.id !== id)
        }));
    };

    const handlePropertyUpdate = (id: number, field: keyof InvestmentProperty, value: any) => {
        setAppState(prev => ({
            ...prev,
            investmentProperties: prev.investmentProperties.map(p => 
                p.id === id ? { ...p, [field]: value } : p
            )
        }));
    };

    const { investmentPropertiesNetCashflow } = calculations;
    const formatCurrency = (value: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

    return (
        <div className="animate-fade-in space-y-4">
            {appState.investmentProperties.map(prop => (
                <InvestmentPropertyCard
                    key={prop.id}
                    property={prop}
                    onUpdate={handlePropertyUpdate}
                    onRemove={handleRemoveProperty}
                    setAppState={setAppState}
                />
            ))}

            <div className="flex flex-col items-center gap-6">
                <button onClick={handleAddProperty} className="w-full md:w-1/2 p-3 bg-[var(--button-bg-color)] text-white rounded-md font-semibold hover:bg-[var(--button-bg-hover-color)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-color)] focus:ring-[var(--button-bg-color)]">
                    + Add Investment Property
                </button>

                {appState.investmentProperties.length > 0 && (
                    <Card title="Total Investment Summary" className="w-full">
                        <div className={`p-4 rounded-lg border ${investmentPropertiesNetCashflow >= 0 ? 'border-[var(--color-positive-text)]' : 'border-[var(--color-negative-text)]'}`} style={{ backgroundColor: investmentPropertiesNetCashflow >= 0 ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)' }}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-xl" style={{ color: investmentPropertiesNetCashflow >= 0 ? 'var(--color-positive-text)' : 'var(--color-negative-text)' }}>Total Net Monthly Cashflow (Current)</span>
                                    <Tooltip text="This is the combined cashflow from all investment properties. This amount is automatically added to your income (if positive) or expenses (if negative) in the 'Income & Expenses' tab.">
                                        <InfoIcon className="h-5 w-5 text-[var(--text-color-muted)]"/>
                                    </Tooltip>
                                </div>
                                <span className="font-extrabold text-3xl" style={{ color: investmentPropertiesNetCashflow >= 0 ? 'var(--color-positive-text)' : 'var(--color-negative-text)' }}>{formatCurrency(investmentPropertiesNetCashflow)}</span>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default React.memo(Tab_InvestmentProperties);