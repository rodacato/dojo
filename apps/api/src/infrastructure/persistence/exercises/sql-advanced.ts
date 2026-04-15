import { type SeedExercise, uuidv5 } from './types'

// =============================================================================
// SQL advanced katas — SQLite (Piston runtime).
//
// testCode convention:
//   - schema + seed + `-- @SOLUTION_FILE` marker + assertions
//   - PistonAdapter.buildSqlScript() substitutes the marker with
//     `CREATE VIEW solution AS <user code>;`
//   - assertions: per-test printf lines + single CHECK(ok=1) for exit code
// =============================================================================

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

Order by \`month\` ASC.`,
    duration: 15,
    difficulty: 'medium',
    type: 'code',
    category: 'sql',
    languages: ['sql'],
    tags: ['window-functions', 'running-total', 'cumulative-sum'],
    topics: ['SUM-OVER', 'ROWS-UNBOUNDED-PRECEDING', 'cumulative-aggregates', 'window-functions'],
    starterCode: `WITH monthly AS (
  SELECT strftime('%Y-%m', order_date) AS month,
         SUM(amount) AS monthly_revenue
  FROM orders
  GROUP BY strftime('%Y-%m', order_date)
)
SELECT
  month,
  monthly_revenue
  -- TODO: add running_total via SUM(monthly_revenue) OVER (...)
FROM monthly
ORDER BY month ASC`,
    testCode: `CREATE TABLE orders (order_id INTEGER PRIMARY KEY, order_date DATE NOT NULL, amount NUMERIC NOT NULL);
INSERT INTO orders VALUES
  (1, '2024-01-05', 100),(2, '2024-01-20', 250),
  (3, '2024-02-10', 180),(4, '2024-02-28', 320),
  (5, '2024-03-15', 90), (6, '2024-03-22', 410),
  (7, '2024-04-01', 150);

-- @SOLUTION_FILE

SELECT CASE WHEN (SELECT running_total FROM solution WHERE month='2024-01')=350
  THEN '✓ Jan running_total is 350' ELSE '✗ Jan running_total should be 350, got '||COALESCE((SELECT running_total FROM solution WHERE month='2024-01'),-1) END;
SELECT CASE WHEN (SELECT running_total FROM solution WHERE month='2024-02')=850
  THEN '✓ Feb running_total is 850' ELSE '✗ Feb running_total should be 850, got '||COALESCE((SELECT running_total FROM solution WHERE month='2024-02'),-1) END;
SELECT CASE WHEN (SELECT running_total FROM solution ORDER BY month DESC LIMIT 1)=1500
  THEN '✓ final running_total is 1500' ELSE '✗ final running_total should be 1500, got '||COALESCE((SELECT running_total FROM solution ORDER BY month DESC LIMIT 1),-1) END;
SELECT CASE WHEN (SELECT COUNT(*) FROM solution)=4
  THEN '✓ returns 4 months' ELSE '✗ expected 4 rows, got '||(SELECT COUNT(*) FROM solution) END;

CREATE TABLE _ok (ok INT CHECK(ok=1));
INSERT INTO _ok VALUES ((SELECT CASE WHEN
  (SELECT running_total FROM solution WHERE month='2024-01')=350
  AND (SELECT running_total FROM solution WHERE month='2024-02')=850
  AND (SELECT running_total FROM solution ORDER BY month DESC LIMIT 1)=1500
  AND (SELECT COUNT(*) FROM solution)=4
  THEN 1 ELSE 0 END));`,
    variations: [
      {
        ownerRole: 'Data engineer who builds financial reporting pipelines daily',
        ownerContext:
          'Evaluate whether the developer aggregates monthly_revenue first (via CTE or subquery) before applying the window — applying the window directly on raw rows is a common mistake that gives wrong results. Check for correct frame clause: SUM(monthly_revenue) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING) or an equivalent.',
      },
      {
        ownerRole: 'Analytics engineer who has migrated dozens of spreadsheet reports to SQL',
        ownerContext:
          "Running totals are the #1 use case for window functions in analytics. Evaluate frame clause correctness. Also check: did they handle month formatting correctly (strftime('%Y-%m', ...))? The 'YYYY-MM' format matters for correct ordering.",
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

Order by \`month\` ASC.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'sql',
    languages: ['sql'],
    tags: ['window-functions', 'lag', 'month-over-month', 'growth-rate'],
    topics: ['LAG', 'LEAD', 'period-comparison', 'percentage-change', 'window-functions'],
    starterCode: `WITH monthly AS (
  SELECT strftime('%Y-%m', sale_date) AS month,
         SUM(revenue) AS revenue
  FROM sales
  GROUP BY strftime('%Y-%m', sale_date)
)
SELECT
  month,
  revenue
  -- TODO: add prev_month_revenue via LAG()
  -- TODO: add change_pct = ROUND((revenue - prev) * 100.0 / prev, 2)
FROM monthly
ORDER BY month ASC`,
    testCode: `CREATE TABLE sales (sale_id INTEGER PRIMARY KEY, sale_date DATE NOT NULL, revenue NUMERIC NOT NULL);
INSERT INTO sales VALUES
  (1, '2024-01-10', 1000),(2, '2024-01-25', 500),
  (3, '2024-02-05', 2000),(4, '2024-02-20', 300),
  (5, '2024-03-12', 1800),
  (6, '2024-04-08', 900), (7, '2024-04-22', 1100);

-- @SOLUTION_FILE

SELECT CASE WHEN (SELECT prev_month_revenue FROM solution WHERE month='2024-01') IS NULL
  THEN '✓ Jan prev_month_revenue is NULL' ELSE '✗ Jan prev_month_revenue should be NULL' END;
SELECT CASE WHEN (SELECT change_pct FROM solution WHERE month='2024-01') IS NULL
  THEN '✓ Jan change_pct is NULL' ELSE '✗ Jan change_pct should be NULL' END;
SELECT CASE WHEN (SELECT revenue FROM solution WHERE month='2024-01')=1500
  THEN '✓ Jan revenue is 1500' ELSE '✗ Jan revenue should be 1500, got '||COALESCE((SELECT revenue FROM solution WHERE month='2024-01'),-1) END;
SELECT CASE WHEN (SELECT revenue FROM solution WHERE month='2024-02')=2300
  THEN '✓ Feb revenue is 2300' ELSE '✗ Feb revenue should be 2300, got '||COALESCE((SELECT revenue FROM solution WHERE month='2024-02'),-1) END;
SELECT CASE WHEN (SELECT change_pct FROM solution WHERE month='2024-02')=53.33
  THEN '✓ Feb change_pct is 53.33' ELSE '✗ Feb change_pct should be 53.33, got '||COALESCE((SELECT change_pct FROM solution WHERE month='2024-02'),-1) END;
SELECT CASE WHEN (SELECT COUNT(*) FROM solution)=4
  THEN '✓ returns 4 months' ELSE '✗ expected 4 rows, got '||(SELECT COUNT(*) FROM solution) END;

CREATE TABLE _ok (ok INT CHECK(ok=1));
INSERT INTO _ok VALUES ((SELECT CASE WHEN
  (SELECT prev_month_revenue FROM solution WHERE month='2024-01') IS NULL
  AND (SELECT change_pct FROM solution WHERE month='2024-01') IS NULL
  AND (SELECT revenue FROM solution WHERE month='2024-01')=1500
  AND (SELECT revenue FROM solution WHERE month='2024-02')=2300
  AND (SELECT change_pct FROM solution WHERE month='2024-02')=53.33
  AND (SELECT COUNT(*) FROM solution)=4
  THEN 1 ELSE 0 END));`,
    variations: [
      {
        ownerRole: 'Business intelligence developer who builds executive dashboards',
        ownerContext:
          'Core challenge: using LAG() correctly and computing percentage change without division by zero. Evaluate: (1) correct use of LAG(revenue) OVER (ORDER BY month), (2) the percentage formula ROUND((revenue - prev) * 100.0 / prev, 2), (3) NULL handling for the first month — LAG naturally returns NULL and the division propagates NULL. Check that they aggregate by month first before applying LAG.',
      },
      {
        ownerRole: 'Data analyst who has built hundreds of MoM reports',
        ownerContext:
          "LAG/LEAD are underused by developers who default to self-joins. Evaluate whether the developer uses a window function vs a self-join — both work but the window function is cleaner and more performant. Also check: does their percentage formula handle the edge case where prev_revenue is 0? (Not needed here, but a developer who thinks about it shows maturity.)",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 084 — Salary Percentile Buckets (SQL, hard)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-084-salary-percentile-buckets'),
    title: 'Salary Percentile Buckets',
    description: `Write a SQL query that assigns each employee to a salary quartile bucket (Q1 to Q4) and reports how many employees are in each bucket and what the min/max/avg salary is within each bucket.

**Quartiles:** Q1 = bottom 25%, Q4 = top 25%. Use \`NTILE(4)\`.

Your query must return:
- \`quartile\` — 1, 2, 3, or 4
- \`employee_count\` — number of employees in that quartile
- \`min_salary\` — minimum salary in that quartile
- \`max_salary\` — maximum salary in that quartile
- \`avg_salary\` — average salary in that quartile, rounded to 2 decimal places

Order by \`quartile\` ASC.`,
    duration: 20,
    difficulty: 'hard',
    type: 'code',
    category: 'sql',
    languages: ['sql'],
    tags: ['window-functions', 'ntile', 'percentiles', 'quartiles'],
    topics: ['NTILE', 'percentile-functions', 'salary-analysis', 'aggregation-over-windows'],
    starterCode: `WITH quartiled AS (
  -- TODO: assign each employee a quartile via NTILE(4) OVER (ORDER BY salary)
)
SELECT
  quartile
  -- TODO: aggregate count / min / max / avg salary per quartile
FROM quartiled
GROUP BY quartile
ORDER BY quartile ASC`,
    testCode: `CREATE TABLE employees (emp_id INTEGER PRIMARY KEY, emp_name TEXT NOT NULL, department TEXT NOT NULL, salary NUMERIC NOT NULL);
INSERT INTO employees VALUES
  (1, 'Alice',   'Engineering', 120000),
  (2, 'Bob',     'Engineering',  95000),
  (3, 'Carol',   'Marketing',    75000),
  (4, 'Dave',    'Marketing',    80000),
  (5, 'Eve',     'Engineering', 140000),
  (6, 'Frank',   'Sales',        65000),
  (7, 'Grace',   'Sales',        70000),
  (8, 'Heidi',   'Engineering', 110000);

-- @SOLUTION_FILE

SELECT CASE WHEN (SELECT SUM(employee_count) FROM solution)=8
  THEN '✓ all 8 employees bucketed' ELSE '✗ total should be 8, got '||COALESCE((SELECT SUM(employee_count) FROM solution),-1) END;
SELECT CASE WHEN (SELECT COUNT(*) FROM solution)=4
  THEN '✓ 4 quartile rows' ELSE '✗ expected 4 rows, got '||(SELECT COUNT(*) FROM solution) END;
SELECT CASE WHEN (SELECT max_salary FROM solution WHERE quartile=1) <= (SELECT min_salary FROM solution WHERE quartile=4)
  THEN '✓ Q1 max <= Q4 min' ELSE '✗ Q1 max salary should be <= Q4 min salary' END;
SELECT CASE WHEN (SELECT avg_salary FROM solution WHERE quartile=4) > (SELECT avg_salary FROM solution WHERE quartile=1)
  THEN '✓ Q4 avg > Q1 avg' ELSE '✗ Q4 avg salary should be higher than Q1 avg' END;
SELECT CASE WHEN (SELECT employee_count FROM solution WHERE quartile=1)=2
  THEN '✓ Q1 has 2 employees' ELSE '✗ Q1 should have 2 employees (8/4), got '||COALESCE((SELECT employee_count FROM solution WHERE quartile=1),-1) END;

CREATE TABLE _ok (ok INT CHECK(ok=1));
INSERT INTO _ok VALUES ((SELECT CASE WHEN
  (SELECT SUM(employee_count) FROM solution)=8
  AND (SELECT COUNT(*) FROM solution)=4
  AND (SELECT max_salary FROM solution WHERE quartile=1) <= (SELECT min_salary FROM solution WHERE quartile=4)
  AND (SELECT avg_salary FROM solution WHERE quartile=4) > (SELECT avg_salary FROM solution WHERE quartile=1)
  AND (SELECT employee_count FROM solution WHERE quartile=1)=2
  THEN 1 ELSE 0 END));`,
    variations: [
      {
        ownerRole: 'Compensation analytics engineer who builds salary band reports for HR teams',
        ownerContext:
          'Key challenge: using NTILE(4) in a CTE, then aggregating over the resulting quartile assignments. A common mistake is trying to use NTILE() directly in GROUP BY — window functions cannot appear in WHERE or GROUP BY directly. Evaluate whether the developer uses a CTE (WITH quartiled AS (...)) or a subquery to first assign the NTILE bucket, then aggregates in the outer query.',
      },
      {
        ownerRole: 'Data science infrastructure engineer who bridges SQL and statistical analysis',
        ownerContext:
          'NTILE is the least-known window function but one of the most useful for compensation analysis. Evaluate whether the developer knows NTILE distributes rows as evenly as possible (some buckets may have one more row than others when count % n != 0). With 8 employees and NTILE(4), each bucket gets exactly 2 — but can they reason about what happens with 9? Also check: do they order by salary within NTILE for the distribution to make sense?',
      },
    ],
  },
]
