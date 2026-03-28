import { type SeedExercise, uuidv5 } from './types'

export const sqlAdvancedExercises: SeedExercise[] = [
  // ---------------------------------------------------------------------------
  // 082 — Running Monthly Totals (SQL, medium)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-082-running-monthly-totals'),
    title: 'Running Monthly Totals',
    description: `Write a SQL query that calculates a running total of monthly revenue — each row should show the revenue for that month AND the cumulative total up to and including that month.

Your query must return:
- \`month\` — the month (as \`YYYY-MM\`, e.g. \`'2024-01'\`)
- \`monthly_revenue\` — total revenue for that month
- \`running_total\` — cumulative revenue from the earliest month up to and including this month

Order by \`month\` ASC.

Write your query in the solution file.`,
    duration: 15,
    difficulty: 'medium',
    type: 'code',
    category: 'sql',
    languages: ['sql'],
    tags: ['window-functions', 'running-total', 'cumulative-sum'],
    topics: ['SUM-OVER', 'ROWS-UNBOUNDED-PRECEDING', 'cumulative-aggregates', 'window-functions'],
    testCode: `-- @SCHEMA
CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  order_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL
);

-- @SEED
INSERT INTO orders VALUES
  (1,  '2024-01-05', 100.00),
  (2,  '2024-01-20', 250.00),
  (3,  '2024-02-10', 180.00),
  (4,  '2024-02-28', 320.00),
  (5,  '2024-03-15', 90.00),
  (6,  '2024-03-22', 410.00),
  (7,  '2024-04-01', 150.00);

-- @SOLUTION_FILE

-- @VALIDATE
DO $$
DECLARE
  r RECORD;
  prev_running NUMERIC := 0;
  ok BOOLEAN := TRUE;
BEGIN
  FOR r IN (SELECT * FROM solution ORDER BY month ASC) LOOP
    prev_running := prev_running + r.monthly_revenue;
    IF r.running_total <> prev_running THEN
      RAISE EXCEPTION 'running_total mismatch at month %: expected %, got %',
        r.month, prev_running, r.running_total;
    END IF;
  END LOOP;

  IF (SELECT COUNT(*) FROM solution) <> 4 THEN
    RAISE EXCEPTION 'expected 4 rows (Jan-Apr), got %', (SELECT COUNT(*) FROM solution);
  END IF;

  IF (SELECT running_total FROM solution ORDER BY month DESC LIMIT 1) <> 1500.00 THEN
    RAISE EXCEPTION 'final running_total should be 1500.00';
  END IF;

  RAISE NOTICE 'PASS: Running totals are correct';
END $$;`,
    variations: [
      {
        ownerRole: 'Data engineer who builds financial reporting pipelines daily',
        ownerContext:
          'Evaluate whether the developer uses SUM() OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) or the equivalent without explicit frame clause (which defaults to RANGE UNBOUNDED PRECEDING for ORDER BY). Check that they aggregate monthly_revenue first (via CTE or subquery) before applying the window — applying the window directly on the raw rows is a common mistake that gives wrong results.',
      },
      {
        ownerRole: 'Analytics engineer who has migrated dozens of spreadsheet reports to SQL',
        ownerContext:
          "Running totals are the #1 use case for window functions in analytics. Evaluate whether the developer gets the frame clause right. A common mistake is using RANGE instead of ROWS with date/numeric columns — RANGE with a numeric order key can cause ties to accumulate differently. Also check: did they handle the month formatting correctly (to_char, date_trunc, or extract)? The output format 'YYYY-MM' matters for correct ordering.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 083 — Month-over-Month Revenue Change (SQL, medium)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-083-month-over-month-lag'),
    title: 'Month-over-Month Revenue Change',
    description: `Write a SQL query that shows each month's revenue and how it compares to the previous month.

Your query must return:
- \`month\` — the month (\`YYYY-MM\` format)
- \`revenue\` — total revenue for that month
- \`prev_month_revenue\` — revenue from the previous month (\`NULL\` for the first month)
- \`change_pct\` — percentage change from previous month, rounded to 2 decimal places (\`NULL\` for the first month)

A positive \`change_pct\` means growth, negative means decline.

Order by \`month\` ASC.

Write your query in the solution file.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'sql',
    languages: ['sql'],
    tags: ['window-functions', 'lag', 'month-over-month', 'growth-rate'],
    topics: ['LAG', 'LEAD', 'period-comparison', 'percentage-change', 'window-functions'],
    testCode: `-- @SCHEMA
CREATE TABLE sales (
  sale_id INTEGER PRIMARY KEY,
  sale_date DATE NOT NULL,
  revenue NUMERIC(10,2) NOT NULL
);

-- @SEED
INSERT INTO sales VALUES
  (1,  '2024-01-10', 1000.00),
  (2,  '2024-01-25', 500.00),
  (3,  '2024-02-05', 2000.00),
  (4,  '2024-02-20', 300.00),
  (5,  '2024-03-12', 1800.00),
  (6,  '2024-04-08', 900.00),
  (7,  '2024-04-22', 1100.00);

-- @SOLUTION_FILE

-- @VALIDATE
DO $$
DECLARE
  row1 RECORD;
  row2 RECORD;
  row3 RECORD;
  row4 RECORD;
BEGIN
  SELECT * INTO row1 FROM solution ORDER BY month ASC LIMIT 1;
  SELECT * INTO row4 FROM solution ORDER BY month DESC LIMIT 1;

  IF row1.prev_month_revenue IS NOT NULL THEN
    RAISE EXCEPTION 'first month prev_month_revenue should be NULL, got %', row1.prev_month_revenue;
  END IF;
  IF row1.change_pct IS NOT NULL THEN
    RAISE EXCEPTION 'first month change_pct should be NULL, got %', row1.change_pct;
  END IF;
  IF row1.revenue <> 1500.00 THEN
    RAISE EXCEPTION 'Jan revenue should be 1500.00, got %', row1.revenue;
  END IF;

  -- Feb: 2300, prev 1500, change = (2300-1500)/1500*100 = 53.33
  SELECT * INTO row2 FROM solution ORDER BY month ASC LIMIT 1 OFFSET 1;
  IF row2.revenue <> 2300.00 THEN
    RAISE EXCEPTION 'Feb revenue should be 2300.00, got %', row2.revenue;
  END IF;
  IF row2.change_pct <> 53.33 THEN
    RAISE EXCEPTION 'Feb change_pct should be 53.33, got %', row2.change_pct;
  END IF;

  IF (SELECT COUNT(*) FROM solution) <> 4 THEN
    RAISE EXCEPTION 'expected 4 months, got %', (SELECT COUNT(*) FROM solution);
  END IF;

  RAISE NOTICE 'PASS: Month-over-month calculation is correct';
END $$;`,
    variations: [
      {
        ownerRole: 'Business intelligence developer who builds executive dashboards',
        ownerContext:
          'The core challenge here is using LAG() correctly and computing a percentage change without division by zero. Evaluate: (1) correct use of LAG(revenue, 1) OVER (ORDER BY month), (2) the percentage formula: ROUND((revenue - prev) / prev * 100, 2), (3) handling NULL for the first month — LAG naturally returns NULL, and the division result will also be NULL, which is the correct behavior. Check that they aggregate by month first before applying LAG.',
      },
      {
        ownerRole: 'Data analyst who has built hundreds of MoM reports',
        ownerContext:
          "LAG/LEAD are underused by most developers who default to self-joins. Evaluate whether the developer uses the window function approach vs a self-join approach — both work but the window function is cleaner and more performant. If they use a self-join, acknowledge it works but explain why LAG is preferred. Also check: does their percentage formula handle the edge case where prev_revenue is 0? (It doesn't need to here, but a developer who thinks about it shows maturity.)",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 084 — Salary Percentile Buckets (SQL, hard)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-084-salary-percentile-buckets'),
    title: 'Salary Percentile Buckets',
    description: `Write a SQL query that assigns each employee to a salary quartile bucket (Q1 to Q4) and reports how many employees are in each bucket and what the min/max salary is within each bucket.

**Quartiles:** Q1 = bottom 25%, Q4 = top 25%. Use \`NTILE(4)\` to assign quartiles.

Your query must return:
- \`quartile\` — 1, 2, 3, or 4
- \`employee_count\` — number of employees in that quartile
- \`min_salary\` — minimum salary in that quartile
- \`max_salary\` — maximum salary in that quartile
- \`avg_salary\` — average salary in that quartile, rounded to 2 decimal places

Order by \`quartile\` ASC.

Write your query in the solution file.`,
    duration: 20,
    difficulty: 'hard',
    type: 'code',
    category: 'sql',
    languages: ['sql'],
    tags: ['window-functions', 'ntile', 'percentiles', 'quartiles'],
    topics: ['NTILE', 'percentile-functions', 'salary-analysis', 'aggregation-over-windows'],
    testCode: `-- @SCHEMA
CREATE TABLE employees (
  emp_id INTEGER PRIMARY KEY,
  emp_name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary NUMERIC(10,2) NOT NULL
);

-- @SEED
INSERT INTO employees VALUES
  (1,  'Alice',   'Engineering', 120000),
  (2,  'Bob',     'Engineering',  95000),
  (3,  'Carol',   'Marketing',    75000),
  (4,  'Dave',    'Marketing',    80000),
  (5,  'Eve',     'Engineering', 140000),
  (6,  'Frank',   'Sales',        65000),
  (7,  'Grace',   'Sales',        70000),
  (8,  'Heidi',   'Engineering', 110000);

-- @SOLUTION_FILE

-- @VALIDATE
DO $$
DECLARE
  total_count INTEGER;
  q1 RECORD;
  q4 RECORD;
BEGIN
  SELECT SUM(employee_count) INTO total_count FROM solution;
  IF total_count <> 8 THEN
    RAISE EXCEPTION 'total employees across quartiles should be 8, got %', total_count;
  END IF;

  IF (SELECT COUNT(*) FROM solution) <> 4 THEN
    RAISE EXCEPTION 'should have exactly 4 quartile rows, got %', (SELECT COUNT(*) FROM solution);
  END IF;

  SELECT * INTO q1 FROM solution WHERE quartile = 1;
  SELECT * INTO q4 FROM solution WHERE quartile = 4;

  IF q1.max_salary > q4.min_salary THEN
    RAISE EXCEPTION 'Q1 max salary should be <= Q4 min salary (Q1=%, Q4=%)',
      q1.max_salary, q4.min_salary;
  END IF;

  IF q4.avg_salary <= q1.avg_salary THEN
    RAISE EXCEPTION 'Q4 avg salary should be higher than Q1 avg salary';
  END IF;

  RAISE NOTICE 'PASS: Salary quartile buckets are correct';
END $$;`,
    variations: [
      {
        ownerRole: 'Compensation analytics engineer who builds salary band reports for HR teams',
        ownerContext:
          'The key challenge is using NTILE(4) in a CTE or subquery, then aggregating over the resulting quartile assignments. A common mistake is trying to use NTILE() directly in a GROUP BY — which does not work because window functions cannot be used in WHERE or GROUP BY directly. Evaluate whether the developer uses a CTE (WITH quartiled AS (...)) or a subquery to first assign the NTILE bucket, then aggregates in the outer query.',
      },
      {
        ownerRole: 'Data science infrastructure engineer who bridges SQL and statistical analysis',
        ownerContext:
          'NTILE is the least-known window function but one of the most useful for compensation analysis. Evaluate whether the developer knows that NTILE distributes rows as evenly as possible (some buckets may have one more row than others when count % n != 0). With 8 employees and NTILE(4), each bucket gets exactly 2 employees — but can they explain what would happen with 9 employees? Also check: do they order by salary within NTILE for the distribution to make sense?',
      },
    ],
  },
]
