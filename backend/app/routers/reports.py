import csv
import io
from datetime import date
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.account import Account
from app.models.budget import Budget
from app.models.category import Category
from app.models.expense import Expense
from app.models.financial_goal import FinancialGoal
from app.models.income import Income
from app.models.user import User
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/summary")
def get_report_summary(
    month: str | None = Query(None, description="Month in YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.user_id

    income_query = db.query(Income).filter(Income.user_id == user_id)
    expense_query = db.query(Expense).filter(Expense.user_id == user_id)

    filter_year = None
    filter_month = None

    if month:
        try:
            parts = month.split("-")
            filter_year = int(parts[0])
            filter_month = int(parts[1])

            income_query = income_query.filter(
                extract("year", Income.income_date) == filter_year,
                extract("month", Income.income_date) == filter_month
            )
            expense_query = expense_query.filter(
                extract("year", Expense.expense_date) == filter_year,
                extract("month", Expense.expense_date) == filter_month
            )
        except Exception:
            pass

    incomes = income_query.order_by(Income.income_date.desc()).all()
    expenses = expense_query.order_by(Expense.expense_date.desc()).all()
    accounts = db.query(Account).filter(Account.user_id == user_id).all()
    categories = db.query(Category).filter(Category.user_id == user_id).all()
    cat_map = {c.category_id: c.name for c in categories}

    total_income = sum(float(i.amount) for i in incomes)
    total_expenses = sum(float(e.amount) for e in expenses)
    savings = total_income - total_expenses

    # Category breakdown
    cat_totals = {}
    for exp in expenses:
        name = cat_map.get(exp.category_id, f"Category {exp.category_id}")
        cat_totals[name] = cat_totals.get(name, 0.0) + float(exp.amount)

    category_summary = [
        {
            "category_name": cat,
            "amount": amt,
            "percentage": round((amt / total_expenses * 100), 1) if total_expenses > 0 else 0.0
        }
        for cat, amt in cat_totals.items()
    ]
    category_summary.sort(key=lambda x: x["amount"], reverse=True)

    # Budget info
    budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
    selected_budget = None
    if filter_year and filter_month:
        for b in budgets:
            if b.month and b.month.year == filter_year and b.month.month == filter_month:
                selected_budget = b
                break

    budget_amt = float(selected_budget.amount) if selected_budget else 0.0

    return {
        "period": month if month else "All Time",
        "user": {
            "name": current_user.name,
            "email": current_user.email
        },
        "summary": {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_savings": savings,
            "savings_rate": round((savings / total_income * 100), 1) if total_income > 0 else 0.0,
            "budget_amount": budget_amt,
            "budget_utilization": round((total_expenses / budget_amt * 100), 1) if budget_amt > 0 else 0.0
        },
        "category_summary": category_summary,
        "accounts": [
            {
                "account_name": a.account_name,
                "account_type": a.account_type,
                "balance": float(a.balance)
            }
            for a in accounts
        ],
        "incomes": [
            {
                "income_id": i.income_id,
                "amount": float(i.amount),
                "source": i.source,
                "bank_name": i.bank_name,
                "description": i.description,
                "income_date": str(i.income_date)
            }
            for i in incomes
        ],
        "expenses": [
            {
                "expense_id": e.expense_id,
                "amount": float(e.amount),
                "category_name": cat_map.get(e.category_id, f"Category {e.category_id}"),
                "description": e.description,
                "expense_date": str(e.expense_date)
            }
            for e in expenses
        ]
    }


@router.get("/export/csv")
def export_csv(
    month: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.user_id

    income_query = db.query(Income).filter(Income.user_id == user_id)
    expense_query = db.query(Expense).filter(Expense.user_id == user_id)

    if month:
        try:
            parts = month.split("-")
            f_year = int(parts[0])
            f_month = int(parts[1])
            income_query = income_query.filter(
                extract("year", Income.income_date) == f_year,
                extract("month", Income.income_date) == f_month
            )
            expense_query = expense_query.filter(
                extract("year", Expense.expense_date) == f_year,
                extract("month", Expense.expense_date) == f_month
            )
        except Exception:
            pass

    incomes = income_query.order_by(Income.income_date.desc()).all()
    expenses = expense_query.order_by(Expense.expense_date.desc()).all()
    categories = db.query(Category).filter(Category.user_id == user_id).all()
    cat_map = {c.category_id: c.name for c in categories}

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["BudgetBuddy Financial Report"])
    writer.writerow(["User", current_user.name, "Email", current_user.email])
    writer.writerow(["Generated Date", str(date.today()), "Period", month if month else "All Time"])
    writer.writerow([])

    # Income section
    writer.writerow(["--- INCOME RECORDS ---"])
    writer.writerow(["Date", "Source", "Bank", "Amount (INR)", "Description"])
    for inc in incomes:
        writer.writerow([inc.income_date, inc.source, inc.bank_name or "-", f"{float(inc.amount):.2f}", inc.description or "-"])

    writer.writerow([])
    # Expense section
    writer.writerow(["--- EXPENSE RECORDS ---"])
    writer.writerow(["Date", "Category", "Amount (INR)", "Description"])
    for exp in expenses:
        cname = cat_map.get(exp.category_id, f"Category {exp.category_id}")
        writer.writerow([exp.expense_date, cname, f"{float(exp.amount):.2f}", exp.description or "-"])

    writer.writerow([])
    # Financial summary
    tot_inc = sum(float(i.amount) for i in incomes)
    tot_exp = sum(float(e.amount) for e in expenses)
    writer.writerow(["--- FINANCIAL SUMMARY ---"])
    writer.writerow(["Total Income (INR)", f"{tot_inc:.2f}"])
    writer.writerow(["Total Expenses (INR)", f"{tot_exp:.2f}"])
    writer.writerow(["Net Savings (INR)", f"{tot_inc - tot_exp:.2f}"])

    output.seek(0)
    filename = f"budgetbuddy_report_{month if month else 'all_time'}.csv"

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
