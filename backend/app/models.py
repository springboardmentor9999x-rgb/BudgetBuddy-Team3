from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey
from .database import Base


# 1. User Table
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password = Column(String(255), nullable=False)


# 2. Account Table
class Account(Base):
    __tablename__ = "accounts"

    account_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    account_name = Column(String(100), nullable=False)
    balance = Column(Numeric(10, 2), default=0)


# 3. Category Table
class Category(Base):
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)


# 4. Income Table
class Income(Base):
    __tablename__ = "income"

    income_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.category_id"))
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String(255))
    income_date = Column(Date, nullable=False)


# 5. Expense Table
class Expense(Base):
    __tablename__ = "expenses"

    expense_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.category_id"))
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String(255))
    expense_date = Column(Date, nullable=False)


# 6. Budget Table
class Budget(Base):
    __tablename__ = "budgets"

    budget_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.category_id"))
    limit_amount = Column(Numeric(10, 2), nullable=False)
    month = Column(String(20), nullable=False)


# 7. Financial Goal Table
class FinancialGoal(Base):
    __tablename__ = "financial_goals"

    goal_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    goal_name = Column(String(100), nullable=False)
    target_amount = Column(Numeric(10, 2), nullable=False)
    current_amount = Column(Numeric(10, 2), default=0)
    deadline = Column(Date)