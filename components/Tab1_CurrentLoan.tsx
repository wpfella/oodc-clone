
import React, { useState, useEffect } from 'react';
import { AppState, OtherDebt } from '../types';
import Card from './common/Card';
import SliderInput from './common/SliderInput';
import EditableField from './common/EditableField';
import { UsersIcon, BanknotesIcon, ChartBarIcon, InfoIcon, PercentIcon } from './common/IconComponents';
import Tooltip from './common/Tooltip';
import { calculatePIPayment, calculateIOPayment } from '../hooks/useMortgageCalculations';
import { useDebounce } from '../hooks/useDebounce';

interface Props {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  calculations: any;
  setWarningToast: (message: string) => void;
}

const DebtConsolidationSection: React.FC<Props> = ({ appState, setAppState }) => {
    const { otherDebts } = appState;

    const handleDebtChange = (id: number, field: keyof OtherDebt, value: any) => {
        setAppState(prev => ({
            ...prev,
            otherDebts: (prev.otherDebts || []).map(debt => debt.id === id ? { ...debt, [field]: value } : debt)
        }));
    };

    const addDebt = () => {
        const newDebt: OtherDebt = {
            id: Date.now(),
            name: 'Car Loan',
            amount: 25000,
            interestRate: 8.5,
            repayment: 500,
            frequency: 'monthly',
            remainingTerm: 5,
        };
        setAppState(prev => ({ ...prev, otherDebts: [...(prev.otherDebts || []), newDebt] }));
    };

    const removeDebt = (id: number) => {
        setAppState(prev => ({ ...prev, otherDebts: (prev.otherDebts || []).filter(debt => debt.id !== id) }));
    };

    const inputClasses = "w-full bg-[var(--input-bg-color)] p-2 rounded-md border border-[var(--input-border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus-color)]";
    const selectClasses = `custom-select ${inputClasses}`;

    return (
        <Card title={
            <div className="flex items-center gap-2">
                <span>Do you have any other debts you want to consolidate with Crown Money?</span>
                <Tooltip text="Add any other debts you wish to consolidate into the Crown Money scenario. This will have NO IMPACT on the Bank scenario or the Loan Summary on this page.">
                    <InfoIcon className="h-4 w-4 text-[var(--text-color-muted)]"/>
                </Tooltip>
            </div>
        }>
            <div className="space-y-4">
                {(otherDebts || []).map(debt => (
                    <div key={debt.id} className="p-4 bg-black/10 dark:bg-white/5 rounded-lg relative space-y-4">
                        <button onClick={() => removeDebt(debt.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-2xl font-bold z-10">×</button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-color-muted)] mb-1">Debt Name</label>
                                <input type="text" value={debt.name} onChange={e => handleDebtChange(debt.id, 'name', e.target.value)} className={inputClasses} placeholder="e.g., Car Loan"/>
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-[var(--text-color-muted)] mb-1">Amount Owing</label>
                                <input type="number" value={debt.amount} onChange={e => handleDebtChange(debt.id, 'amount', parseFloat(e.target.value) || 0)} className={inputClasses} placeholder="Amount"/>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-color-muted)] mb-1">Interest Rate (%)</label>
                                <input type="number" value={debt.interestRate} onChange={e => handleDebtChange(debt.id, 'interestRate', parseFloat(e.target.value) || 0)} className={inputClasses}/>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-color-muted)] mb-1">Remaining Term (Years)</label>
                                <input type="number" value={debt.remainingTerm} onChange={e => handleDebtChange(debt.id, 'remainingTerm', parseFloat(e.target.value) || 0)} className={inputClasses}/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                                <label className="block text-xs font-medium text-[var(--text-color-muted)] mb-1">Repayment</label>
                                <input type="number" value={debt.repayment} onChange={e => handleDebtChange(debt.id, 'repayment', parseFloat(e.target.value) || 0)} className={inputClasses}/>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-color-muted)] mb-1">Frequency</label>
                                <select value={debt.frequency} onChange={e => handleDebtChange(debt.id, 'frequency', e.target.value)} className={selectClasses}>
                                    <option value="weekly">Weekly</option>
                                    <option value="fortnightly">Fortnightly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="annually">Annually</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
                <button onClick={addDebt} className="mt-2 text-sm text-[var(--title-color)] hover:opacity-80 transition-opacity font-semibold">+ Add Debt</button>
            </div>
        </Card>
    );
};


const Tab1_CurrentLoan: React.FC<Props> = ({ appState, setAppState, calculations, setWarningToast }) => {
  const { loan, people } = appState;
  const { bankLoanCalculation } = calculations;

  const [repaymentInput, setRepaymentInput] = useState(String(loan.repayment));
  const debouncedLoan = useDebounce(loan, 500);

  const handleLoanChange = (field: keyof typeof loan, value: any) => {
    setAppState(prev => ({ ...prev, loan: { ...prev.loan, [field]: value } }));
  };

  const handlePersonChange = (index: number, field: keyof typeof people[0], value: any) => {
    const newPeople = [...people];
    const person = newPeople[index];
    
    let processedValue = value;
    if (field === 'age') {
        processedValue = parseInt(value, 10) || 0;
    }
    
    newPeople[index] = { ...person, [field]: processedValue };
    setAppState(prev => ({ ...prev, people: newPeople }));
  };

  const toggleBorrowers = () => {
    setAppState(prev => {
      if (prev.people.length > 1) {
        // Switch to one borrower
        return { ...prev, people: [prev.people[0]] };
      } else {
        // Switch to two borrowers
        const currentPeople = prev.people.length > 0 ? [...prev.people] : [{ id: 1, name: 'Person 1', age: 35 }];
        return {
          ...prev,
          people: [...currentPeople, { id: Date.now(), name: 'Person 2', age: 34 }]
        };
      }
    });
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const netLoanAmount = Math.max(0, loan.amount - (loan.offsetBalance || 0));
  const lvr = loan.propertyValue > 0 ? (loan.amount / loan.propertyValue) * 100 : 0;
  
  useEffect(() => {
    setRepaymentInput(String(loan.repayment));
  }, [loan.repayment]);

  const handleRepaymentBlur = () => {
    const numericValue = parseFloat(repaymentInput);
    
    if (repaymentInput.trim() === '' || isNaN(numericValue)) {
      setRepaymentInput(String(loan.repayment)); // Reset to last known good value
      return;
    }
    
    const netLoanAmount = Math.max(0, loan.amount - (loan.offsetBalance || 0));
    if (netLoanAmount <= 0) {
      handleLoanChange('repayment', numericValue);
      return;
    }
    
    // Check against Interest Only amount to allow for terms > 30 years
    const minRepayment = calculateIOPayment(netLoanAmount, loan.interestRate, loan.frequency);

    if (numericValue < minRepayment) {
      const newRepayment = Math.ceil(minRepayment);
      handleLoanChange('repayment', newRepayment); 
      setWarningToast(`Repayment was too low to cover interest. Adjusted to minimum of ${formatCurrency(newRepayment)}.`);
    } else {
      handleLoanChange('repayment', numericValue);
    }
  };

  useEffect(() => {
    const { amount, offsetBalance, interestRate, frequency, repayment } = debouncedLoan;
    const netLoanAmount = Math.max(0, amount - (offsetBalance || 0));
    if (netLoanAmount <= 0) return;

    // Check against Interest Only amount to allow for terms > 30 years
    const minRepayment = calculateIOPayment(netLoanAmount, interestRate, frequency);

    if (repayment < minRepayment) {
      const newRepayment = Math.ceil(minRepayment);
      setAppState(prev => {
          if (prev.loan.repayment === newRepayment) return prev; // Prevent unnecessary update loop
          return { ...prev, loan: { ...prev.loan, repayment: newRepayment } };
      });
      setWarningToast(`Repayment was too low to cover interest. Adjusted to minimum of ${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(newRepayment)}.`);
    }
  }, [debouncedLoan.amount, debouncedLoan.interestRate, debouncedLoan.offsetBalance, debouncedLoan.frequency, setAppState, setWarningToast]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Left Column: Inputs */}
      <div className="flex flex-col gap-6">
        <Card title="Loan Details">
          <div className="space-y-6">
            <SliderInput label="Property Value" value={loan.propertyValue} onChange={val => handleLoanChange('propertyValue', val)} min={100000} max={4000000} step={10000} unit="$" />
            <SliderInput label="Loan Amount" value={loan.amount} onChange={val => handleLoanChange('amount', val)} min={50000} max={2000000} step={1000} unit="$" />
            <SliderInput label="Offset Balance" value={loan.offsetBalance || 0} onChange={val => handleLoanChange('offsetBalance', val)} min={0} max={loan.amount} step={1000} unit="$" />
            <div className="text-right -mt-4 text-sm text-[var(--text-color-muted)] print:hidden flex items-center justify-end gap-1">
              <span>Net Loan Amount:</span>
              <span className="font-bold text-[var(--text-color)]">{formatCurrency(netLoanAmount)}</span>
              <Tooltip text="This is the actual amount you're paying interest on (Loan Amount - Offset Balance).">
                  <InfoIcon className="h-4 w-4"/>
              </Tooltip>
            </div>
            <SliderInput label="Interest Rate" value={loan.interestRate} onChange={val => handleLoanChange('interestRate', val)} min={1} max={15} step={0.05} unit="%" />
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-[var(--text-color)]">Repayments</label>
                <div className="hidden print:block text-sm text-black font-medium">
                    {formatCurrency(loan.repayment)} / {loan.frequency}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <div className="relative flex-grow">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-color-muted)]">$</span>
                  <input 
                    type="text" 
                    value={repaymentInput} 
                    onChange={e => setRepaymentInput(e.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={handleRepaymentBlur}
                    className="w-full bg-[var(--input-bg-color)] p-2 pl-7 rounded-md border border-[var(--input-border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus-color)]" 
                  />
                </div>
                <select value={loan.frequency} onChange={e => handleLoanChange('frequency', e.target.value)} className="custom-select bg-[var(--input-bg-color)] p-2 rounded-md border border-[var(--input-border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--input-border-focus-color)]">
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>
        </Card>
        
        <DebtConsolidationSection appState={appState} setAppState={setAppState} calculations={calculations} setWarningToast={setWarningToast} />
      </div>

      {/* Right Column: People & Summary */}
      <div className="flex flex-col gap-6">
        <Card title={
            <div className="flex justify-between items-center">
                <span>Borrowers</span>
                <button onClick={toggleBorrowers} className="text-xs px-2 py-1 bg-[var(--input-bg-color)] hover:bg-[var(--button-bg-color)] hover:text-white rounded border border-[var(--input-border-color)] transition-colors print:hidden">
                    {people.length > 1 ? 'Switch to Single' : 'Switch to Couple'}
                </button>
            </div>
        }>
          <div className="space-y-4">
            {people.map((person, index) => (
              <div key={person.id} className="flex gap-4 items-center">
                <div className="p-3 bg-[var(--input-bg-color)] rounded-full text-[var(--title-color)]">
                    <UsersIcon className="h-6 w-6"/>
                </div>
                <div className="flex-grow space-y-2">
                    <input 
                        type="text" 
                        value={person.name} 
                        onChange={e => handlePersonChange(index, 'name', e.target.value)}
                        className="w-full bg-transparent border-b border-[var(--input-border-color)] focus:border-[var(--input-border-focus-color)] focus:outline-none px-1 py-0.5 text-[var(--text-color)] font-medium placeholder-[var(--text-color-muted)]"
                        placeholder="Name"
                    />
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-[var(--text-color-muted)]">Age:</label>
                        <input 
                            type="number" 
                            value={person.age} 
                            onChange={e => handlePersonChange(index, 'age', e.target.value)}
                            className="w-16 bg-[var(--input-bg-color)] rounded px-2 py-1 text-sm border border-[var(--input-border-color)] focus:outline-none focus:ring-1 focus:ring-[var(--input-border-focus-color)]"
                        />
                    </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Loan Summary">
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-black/10 dark:bg-white/5 rounded-lg flex flex-col justify-center items-center">
                    <BanknotesIcon className="h-8 w-8 mb-2 text-[var(--chart-color-bank)]"/>
                    <h4 className="text-sm text-[var(--text-color-muted)]">Monthly Interest</h4>
                    <p className="text-xl font-bold text-[var(--text-color)]">
                        {formatCurrency(netLoanAmount * (loan.interestRate / 100 / 12))}
                    </p>
                </div>
                <div className="p-4 bg-black/10 dark:bg-white/5 rounded-lg flex flex-col justify-center items-center">
                    <ChartBarIcon className="h-8 w-8 mb-2 text-[var(--chart-color-interest)]"/>
                    <h4 className="text-sm text-[var(--text-color-muted)]">LVR</h4>
                    <p className={`text-xl font-bold ${lvr > 80 ? 'text-red-400' : 'text-[var(--text-color)]'}`}>
                        {lvr.toFixed(1)}%
                    </p>
                </div>
                <div className="col-span-2 p-4 bg-black/10 dark:bg-white/5 rounded-lg">
                    <h4 className="text-sm text-[var(--text-color-muted)] mb-1">Estimated Payoff Time (Bank Scenario)</h4>
                    <p className="text-3xl font-bold text-[var(--chart-color-bank)]">
                        {bankLoanCalculation.termInYears === Infinity ? 'Never' : `${bankLoanCalculation.termInYears.toFixed(1)} Years`}
                    </p>
                    {bankLoanCalculation.termInYears === Infinity && (
                        <p className="text-xs text-red-400 mt-1">Repayments do not cover interest.</p>
                    )}
                </div>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default Tab1_CurrentLoan;
