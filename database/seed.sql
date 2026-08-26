-- ============================================================================
-- BudgetBuddy Database Seed Data
-- ============================================================================

-- Standard Student Categories
INSERT INTO categories (user_id, name) VALUES
(NULL, 'Food'),
(NULL, 'Travel'),
(NULL, 'Shopping'),
(NULL, 'Education'),
(NULL, 'Entertainment'),
(NULL, 'Bills & Utilities'),
(NULL, 'Healthcare'),
(NULL, 'Miscellaneous')
ON CONFLICT DO NOTHING;
