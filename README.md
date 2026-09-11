# BudgetBuddy

BudgetBuddy is a personal finance management web application that helps users manage income, expenses, budgets, savings goals, and financial analytics from a single platform.

## Features

### User Authentication
- User registration and login
- JWT-based authentication
- User-specific financial data
- Role-based access for users, premium users, and administrators

### Income Management
- Add income
- Edit income
- Delete income
- View income records
- Track income by month

### Expense Management
- Add expenses
- Edit expenses
- Delete expenses
- Categorize expenses
- View expense records
- Track spending by month

### Budget Management
- Create budgets
- Set spending limits
- Monitor budget usage
- Track spending against budgets

### Savings Goals
- Create savings goals
- Set target amounts
- Track saved amounts
- View goal completion percentage
- Monitor completed and ongoing goals

### Financial Analytics
The analytics dashboard provides:
- Total income
- Total expenses
- Net balance
- Savings rate
- Financial health
- Spending by category
- Income and expense comparison
- Savings goal progress
- Personalized financial insights

### Premium Analytics
Premium users can access:
- Current month analytics
- Last 6 months trends
- Last 12 months trends
- Custom date range analytics
- Daily income and expense trends
- Monthly income and expense trends
- Month-to-month comparison
- Income percentage changes
- Expense percentage changes
- Historical financial analysis

### Reports
Premium users can export financial reports in:
- PDF format
- Excel format

Reports include financial information such as income, expenses, spending categories, summaries, and comparisons.

### Notifications
The application provides notifications related to users' financial activities and account information.

### Admin Access
Administrators have access to administrative functionality and premium analytics features.

## Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- Axios
- Recharts
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- Alembic
- JWT Authentication

### Database
- PostgreSQL

### Development Tools
- Visual Studio Code
- Postman
- Git
- GitHub

## Analytics

BudgetBuddy provides visual financial analysis through interactive charts and dashboards.

Users can analyze:
- Spending distribution by category
- Income and expenses
- Savings progress
- Financial trends
- Monthly comparisons
- Financial health
- Historical financial performance

## Month Comparison

Premium analytics provides a comparison between the selected month and the previous month.

The comparison includes:
- Income
- Expenses
- Income percentage change
- Expense percentage change

The system also handles cases where the previous month has no financial records.

## Custom Date Range

Premium users can select a start date and end date to analyze their financial activity.

The selected range is validated before loading the financial trend data.

## Project Objective

The objective of BudgetBuddy is to provide an organized and user-friendly platform for personal financial management.

The application combines income tracking, expense tracking, budgeting, savings goals, analytics, notifications, and financial reporting in one system.

## Future Enhancements

- Advanced financial insights
- Improved budgeting recommendations
- Recurring transactions
- Additional analytics
- Enhanced notifications
- More detailed financial reports
- Mobile application support

## Author

Developed as a full-stack financial management application using React, FastAPI, PostgreSQL, and related technologies.
