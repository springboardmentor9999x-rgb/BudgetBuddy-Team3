from sqlalchemy import Column, Integer, String, Float, Date
from app.database import Base


class Income(Base):
    __tablename__ = "income"

    income_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    source = Column(String, nullable=False)
    description = Column(String, nullable=True)
    income_date = Column(Date, nullable=False)
    bank_name = Column(String, nullable=True)