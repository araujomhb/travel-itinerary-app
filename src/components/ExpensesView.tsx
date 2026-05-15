"use client";

import { format, differenceInDays } from "date-fns";
import { Utensils, Car, Home as HomeIcon, Activity, MoreHorizontal, TrendingUp, DollarSign, Calculator } from "lucide-react";
import { Expense } from "@/lib/db";

interface ExpensesViewProps {
  expenses: Expense[];
  baseCurrency: string;
  total: number;
  onAddClick: () => void;
  averageDailyExpense?: number;
  startDate?: Date;
  endDate?: Date;
}

export default function ExpensesView({ 
  expenses, 
  baseCurrency, 
  total, 
  onAddClick,
  averageDailyExpense,
  startDate,
  endDate
}: ExpensesViewProps) {
  const categoryIcons = {
    Food: Utensils,
    Transport: Car,
    Accommodation: HomeIcon,
    Activities: Activity,
    Other: MoreHorizontal,
  };

  const dayCount = (startDate && endDate) ? Math.max(1, differenceInDays(endDate, startDate) + 1) : 1;
  const manualTotal = averageDailyExpense ? averageDailyExpense * dayCount : 0;
  const finalTotal = total > 0 ? total : manualTotal;

  return (
    <div className="space-y-12">
      {/* Summary Card */}
      <div className="bg-stone-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-stone-400 text-xs font-black uppercase tracking-[0.3em] mb-2">
              {total > 0 ? "Itemized Total" : (averageDailyExpense ? "Manual Estimate" : "Total Expenses")}
            </p>
            <h2 className="text-5xl font-black tracking-tighter">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency }).format(finalTotal)}
            </h2>
            {averageDailyExpense && total > 0 && (
              <p className="text-stone-500 text-[10px] font-bold uppercase mt-2 tracking-widest italic">
                Manual Estimate: {new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency }).format(manualTotal)}
              </p>
            )}
          </div>
          <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl">
            <TrendingUp className="h-10 w-10 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Manual Expense Info if available and no itemized expenses */}
      {averageDailyExpense && expenses.length === 0 && (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-8 flex items-center gap-6">
          <div className="bg-emerald-100 p-4 rounded-2xl">
            <Calculator className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-black text-emerald-900">Average Daily Expense Active</h4>
            <p className="text-sm text-emerald-700 font-medium mt-1">
              Based on your entry of {new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency }).format(averageDailyExpense)}/day 
              over {dayCount} {dayCount === 1 ? 'day' : 'days'}.
            </p>
          </div>
        </div>
      )}
...

      {/* Expense List */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-stone-100 overflow-hidden">
        <div className="px-8 py-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <h3 className="text-lg font-black text-stone-900 tracking-tight uppercase tracking-widest">Transaction History</h3>
          <button onClick={onAddClick} className="text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline">Add New</button>
        </div>
        
        {expenses.length > 0 ? (
          <div className="divide-y divide-stone-50">
            {expenses.map((expense) => {
              const Icon = categoryIcons[expense.category] || MoreHorizontal;
              return (
                <div key={expense.id} className="p-8 flex items-center justify-between hover:bg-stone-50 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="bg-stone-100 p-4 rounded-2xl text-stone-600 transition-colors group-hover:bg-emerald-100 group-hover:text-emerald-600">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="font-black text-stone-900 text-lg">{expense.category}</h4>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-1">
                        {format(expense.date, "MMM d")} • {expense.notes || 'No notes'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-stone-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency }).format(expense.convertedAmount)}
                    </p>
                    {expense.currency !== baseCurrency && (
                      <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mt-1">
                        {expense.amount} {expense.currency}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center flex flex-col items-center">
            <div className="bg-stone-50 p-8 rounded-full mb-6">
              <DollarSign className="h-12 w-12 text-stone-200" />
            </div>
            <p className="text-stone-400 font-bold uppercase tracking-widest text-xs italic">No transactions tracked yet.</p>
            <button onClick={onAddClick} className="mt-6 bg-stone-900 text-stone-50 px-8 py-3 rounded-2xl font-black text-sm hover:bg-stone-800 transition-all shadow-lg active:scale-95">
              Log First Expense
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
