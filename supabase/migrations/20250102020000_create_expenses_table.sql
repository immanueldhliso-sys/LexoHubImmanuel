-- Create expenses table for tracking matter-related expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  category TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by matter_id
CREATE INDEX IF NOT EXISTS idx_expenses_matter_id ON expenses(matter_id);

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);

-- Create index for category-based queries
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category) WHERE category IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for advocates to view their own matter expenses
CREATE POLICY "Advocates can view their own matter expenses"
  ON expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matters
      WHERE matters.id = expenses.matter_id
      AND matters.advocate_id = auth.uid()
    )
  );

-- Create policy for advocates to insert expenses for their matters
CREATE POLICY "Advocates can insert expenses for their matters"
  ON expenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matters
      WHERE matters.id = expenses.matter_id
      AND matters.advocate_id = auth.uid()
    )
  );

-- Create policy for advocates to update their matter expenses
CREATE POLICY "Advocates can update their matter expenses"
  ON expenses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM matters
      WHERE matters.id = expenses.matter_id
      AND matters.advocate_id = auth.uid()
    )
  );

-- Create policy for advocates to delete their matter expenses
CREATE POLICY "Advocates can delete their matter expenses"
  ON expenses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM matters
      WHERE matters.id = expenses.matter_id
      AND matters.advocate_id = auth.uid()
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before update
CREATE TRIGGER expenses_updated_at_trigger
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

-- Add comment to table
COMMENT ON TABLE expenses IS 'Stores expenses related to legal matters for tracking and invoicing purposes';
COMMENT ON COLUMN expenses.matter_id IS 'Foreign key reference to the associated matter';
COMMENT ON COLUMN expenses.description IS 'Description of the expense';
COMMENT ON COLUMN expenses.amount IS 'Amount of the expense in the practice currency';
COMMENT ON COLUMN expenses.date IS 'Date when the expense was incurred';
COMMENT ON COLUMN expenses.category IS 'Optional category for expense classification (e.g., travel, filing fees, expert fees)';
COMMENT ON COLUMN expenses.receipt_url IS 'Optional URL to the receipt or supporting documentation';
