// =============================================================================
// DRAFT — SQL Deep Cuts course seed data
// Sprint 017 implementation target
//
// To activate: uncomment, import in seed-courses.ts, pass to seedOneCourse()
// =============================================================================

/*
import type { NewCourse, NewLesson, NewStep } from './seed-courses'

// ---------------------------------------------------------------------------
// Course
// ---------------------------------------------------------------------------
const SQL_DEEP_CUTS_COURSE = {
  slug: 'sql-deep-cuts',
  title: 'SQL Deep Cuts',
  description: 'The queries nobody taught you. Window functions, CTEs, and real-world analysis patterns for developers who already know SELECT.',
  language: 'sql',
  accentColor: '#336791', // PostgreSQL blue
  status: 'published' as const,
}

// ---------------------------------------------------------------------------
// Lesson 1 — Window Functions
// ---------------------------------------------------------------------------
// SQL runner pattern for courses:
// - starterCode: partial query or schema setup
// - testCode: CREATE TABLE + INSERT + solution placeholder + DO $$ validation block
//
// Use the same @SCHEMA / @SEED / @SOLUTION_FILE / @VALIDATE convention
// already established in the kata exercises (sql-advanced.ts)
// ---------------------------------------------------------------------------
const SQL_DEEP_CUTS_LESSONS = [
  {
    title: 'Window Functions',
    description: 'Go beyond GROUP BY — learn to compute rankings, running totals, and moving averages without collapsing your rows.',
    order: 1,
  },
  {
    title: 'CTEs and Readable Queries',
    description: 'Replace nested subquery soup with clear, named CTEs. Your future self will thank you.',
    order: 2,
  },
  {
    title: 'Real-World Analysis Patterns',
    description: 'Cohort analysis, retention, churn detection — the queries that actually run in production.',
    order: 3,
  },
]

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------
const SQL_DEEP_CUTS_STEPS = [
  // --- Lesson 1: Window Functions ---
  {
    lessonOrder: 1,
    order: 1,
    type: 'explanation' as const,
    title: 'Beyond GROUP BY — what are window functions?',
    instructionMd: `
## Window functions

A window function computes a value across a set of rows **without collapsing them**.

Compare:

\`\`\`sql
-- GROUP BY collapses rows — you lose the individual employee rows
SELECT department, AVG(salary) FROM employees GROUP BY department;

-- Window function keeps all rows AND adds the average alongside
SELECT
  employee_name,
  department,
  salary,
  AVG(salary) OVER (PARTITION BY department) AS dept_avg
FROM employees;
\`\`\`

The key parts of a window function:
- **OVER()** — marks it as a window function
- **PARTITION BY** — like GROUP BY, but doesn't collapse rows
- **ORDER BY** — defines row order within the window (needed for RANK, LAG, running totals)
- **ROWS/RANGE frame** — which rows to include (e.g., ROWS UNBOUNDED PRECEDING = all previous rows)
`,
    testCode: null,
    starterCode: null,
  },
  {
    lessonOrder: 1,
    order: 2,
    type: 'exercise' as const,
    title: 'Rank employees by salary within their department',
    instructionMd: `
## Exercise: Department salary rankings

Write a query that returns every employee with their salary rank within their department.

**Return columns:**
- \`employee_name\`
- \`department\`
- \`salary\`
- \`dept_rank\` — rank within department, highest salary = 1 (use RANK())

Order by \`department\` ASC, \`dept_rank\` ASC.

**Hint:** \`RANK() OVER (PARTITION BY department ORDER BY salary DESC)\`
`,
    // testCode follows the same @SCHEMA / @SEED / @SOLUTION_FILE / @VALIDATE pattern
    testCode: `-- @SCHEMA
CREATE TABLE employees (id INT, employee_name TEXT, department TEXT, salary INT);

-- @SEED
INSERT INTO employees VALUES
  (1, 'Alice', 'Engineering', 120000),
  (2, 'Bob', 'Engineering', 95000),
  (3, 'Carol', 'Marketing', 75000),
  (4, 'Dave', 'Marketing', 80000),
  (5, 'Eve', 'Engineering', 140000);

-- @SOLUTION_FILE

-- @VALIDATE
DO $$
BEGIN
  IF (SELECT dept_rank FROM solution WHERE employee_name = 'Eve') <> 1 THEN
    RAISE EXCEPTION 'Eve (140k) should be rank 1 in Engineering';
  END IF;
  IF (SELECT dept_rank FROM solution WHERE employee_name = 'Dave') <> 1 THEN
    RAISE EXCEPTION 'Dave (80k) should be rank 1 in Marketing';
  END IF;
  IF (SELECT COUNT(*) FROM solution) <> 5 THEN
    RAISE EXCEPTION 'Should return all 5 employees';
  END IF;
  RAISE NOTICE 'PASS';
END $$;`,
    starterCode: `SELECT
  employee_name,
  department,
  salary,
  -- TODO: add dept_rank using RANK() window function
FROM employees
ORDER BY department ASC, dept_rank ASC;`,
  },
  {
    lessonOrder: 1,
    order: 3,
    type: 'exercise' as const,
    title: 'Calculate running sales totals',
    instructionMd: `
## Exercise: Running totals

Write a query that shows each month's sales and the cumulative total up to that month.

**Return columns:**
- \`month\` (YYYY-MM format)
- \`monthly_sales\`
- \`running_total\` — cumulative sum from earliest month to this month

Order by \`month\` ASC.

**Hint:** \`SUM(amount) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING)\`
`,
    testCode: `-- @SCHEMA
CREATE TABLE sales (sale_date DATE, amount NUMERIC);

-- @SEED
INSERT INTO sales VALUES
  ('2024-01-10', 100), ('2024-01-20', 200),
  ('2024-02-05', 150), ('2024-03-15', 300);

-- @SOLUTION_FILE

-- @VALIDATE
DO $$
BEGIN
  IF (SELECT running_total FROM solution ORDER BY month DESC LIMIT 1) <> 750 THEN
    RAISE EXCEPTION 'Final running_total should be 750';
  END IF;
  RAISE NOTICE 'PASS';
END $$;`,
    starterCode: `WITH monthly AS (
  SELECT
    to_char(sale_date, 'YYYY-MM') AS month,
    SUM(amount) AS monthly_sales
  FROM sales
  GROUP BY to_char(sale_date, 'YYYY-MM')
)
SELECT
  month,
  monthly_sales,
  -- TODO: add running_total using SUM() window function
FROM monthly
ORDER BY month ASC;`,
  },

  // --- Lesson 2: CTEs ---
  {
    lessonOrder: 2,
    order: 1,
    type: 'explanation' as const,
    title: 'When to use a CTE vs a subquery',
    instructionMd: `
## CTEs — Common Table Expressions

A CTE (\`WITH\` clause) gives a name to a subquery so you can reference it multiple times and keep your query readable.

\`\`\`sql
-- Hard to read nested subquery
SELECT * FROM (
  SELECT department, AVG(salary) AS avg_sal FROM (
    SELECT * FROM employees WHERE status = 'active'
  ) active GROUP BY department
) dept_avgs WHERE avg_sal > 90000;

-- Same logic as a CTE — much clearer
WITH active_employees AS (
  SELECT * FROM employees WHERE status = 'active'
),
dept_avgs AS (
  SELECT department, AVG(salary) AS avg_sal
  FROM active_employees
  GROUP BY department
)
SELECT * FROM dept_avgs WHERE avg_sal > 90000;
\`\`\`

**When to use a CTE:**
- When you need the same subquery result more than once
- When nesting is deeper than 2 levels
- When you want to name an intermediate result for clarity
- When you need recursion (recursive CTEs)

**When a subquery is fine:**
- Simple, single-use filter: \`WHERE id IN (SELECT id FROM ...)\`
- Correlated subquery in SELECT (scalar value per row)
`,
    testCode: null,
    starterCode: null,
  },
  {
    lessonOrder: 2,
    order: 2,
    type: 'exercise' as const,
    title: 'Refactor nested subquery into CTEs',
    instructionMd: `
## Exercise: Untangle the query

The query below works but is unreadable. Refactor it into CTEs that produce the **exact same result**.

\`\`\`sql
SELECT d.department, d.headcount, s.top_earner, s.top_salary
FROM (
  SELECT department, COUNT(*) AS headcount
  FROM (SELECT * FROM employees WHERE salary > 50000) AS well_paid
  GROUP BY department
) d
JOIN (
  SELECT department, employee_name AS top_earner, salary AS top_salary
  FROM (
    SELECT *, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk
    FROM employees WHERE salary > 50000
  ) ranked
  WHERE rnk = 1
) s ON d.department = s.department
ORDER BY d.headcount DESC;
\`\`\`
`,
    testCode: `-- @SCHEMA
CREATE TABLE employees (id INT, employee_name TEXT, department TEXT, salary INT);

-- @SEED
INSERT INTO employees VALUES
  (1,'Alice','Engineering',120000),(2,'Bob','Engineering',95000),
  (3,'Carol','Marketing',75000),(4,'Dave','Marketing',55000),
  (5,'Eve','Engineering',140000),(6,'Frank','Sales',45000);

-- @SOLUTION_FILE

-- @VALIDATE
DO $$
BEGIN
  -- Frank (45k) is below 50k and should not appear
  IF EXISTS (SELECT 1 FROM solution WHERE department = 'Sales') THEN
    RAISE EXCEPTION 'Sales dept should not appear (all below 50k threshold)';
  END IF;
  IF (SELECT top_earner FROM solution WHERE department = 'Engineering') <> 'Eve' THEN
    RAISE EXCEPTION 'Engineering top earner should be Eve';
  END IF;
  IF (SELECT COUNT(*) FROM solution) <> 2 THEN
    RAISE EXCEPTION 'Expected 2 rows (Engineering + Marketing)';
  END IF;
  RAISE NOTICE 'PASS';
END $$;`,
    starterCode: `WITH well_paid AS (
  -- TODO: filter employees with salary > 50000
),
-- TODO: add more CTEs
SELECT
  -- TODO: return department, headcount, top_earner, top_salary
ORDER BY headcount DESC;`,
  },
  {
    lessonOrder: 2,
    order: 3,
    type: 'exercise' as const,
    title: 'Chain CTEs to compute a department budget ratio',
    instructionMd: `
## Exercise: Chained CTEs

Write a query that computes, for each department:
- Total salary budget (\`dept_budget\`)
- Company-wide total salary (\`total_budget\`)
- The department's budget as a percentage of total (\`budget_pct\`, rounded to 1 decimal)

**Return columns:** \`department\`, \`dept_budget\`, \`total_budget\`, \`budget_pct\`

Order by \`budget_pct\` DESC.

**Hint:** Use two CTEs — one to compute per-department totals, one to compute the company total — then join them.
`,
    testCode: `-- @SCHEMA
CREATE TABLE employees (id INT, employee_name TEXT, department TEXT, salary INT);

-- @SEED
INSERT INTO employees VALUES
  (1,'Alice','Engineering',120000),(2,'Bob','Engineering',90000),
  (3,'Carol','Marketing',80000),(4,'Dave','HR',60000),(5,'Eve','HR',70000);

-- @SOLUTION_FILE

-- @VALIDATE
DO $$
DECLARE total NUMERIC;
BEGIN
  SELECT SUM(budget_pct) INTO total FROM solution;
  IF ABS(total - 100.0) > 0.5 THEN
    RAISE EXCEPTION 'budget_pct values should sum to ~100%%, got %%', total;
  END IF;
  IF (SELECT budget_pct FROM solution ORDER BY budget_pct DESC LIMIT 1) <>
     (SELECT budget_pct FROM solution WHERE department = 'Engineering') THEN
    RAISE EXCEPTION 'Engineering should have the highest budget_pct';
  END IF;
  RAISE NOTICE 'PASS';
END $$;`,
    starterCode: `WITH dept_budgets AS (
  -- TODO: compute total salary per department
),
company_total AS (
  -- TODO: compute total salary across all departments
)
SELECT
  -- TODO: join and compute budget_pct
ORDER BY budget_pct DESC;`,
  },

  // --- Lesson 3: Real-World Analysis ---
  {
    lessonOrder: 3,
    order: 1,
    type: 'explanation' as const,
    title: 'Retention, cohorts, and churn — the patterns behind every analytics report',
    instructionMd: `
## Real-world SQL analysis patterns

Three patterns that show up constantly in production analytics:

### 1. Cohort analysis
Group users by when they first appeared (signup month, first purchase) and track behavior over time.

\`\`\`sql
WITH cohorts AS (
  SELECT user_id, date_trunc('month', MIN(order_date)) AS cohort_month
  FROM orders GROUP BY user_id
)
SELECT cohort_month, COUNT(*) AS cohort_size
FROM cohorts GROUP BY cohort_month;
\`\`\`

### 2. Retention
Of users who joined in month X, how many are still active in month X+N?

### 3. Churn detection
Users who were active in a reference period but not in the current period.
The key pattern: \`users who EXIST in period A\` minus \`users who EXIST in period B\`.

\`\`\`sql
-- Churned: active last quarter, not this month
SELECT DISTINCT user_id FROM orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-03-31'
  AND user_id NOT IN (
    SELECT user_id FROM orders WHERE order_date >= '2024-04-01'
  );
\`\`\`

**Performance note:** NOT IN with NULLs is a footgun. Prefer NOT EXISTS or LEFT JOIN ... WHERE ... IS NULL.
`,
    testCode: null,
    starterCode: null,
  },
  {
    lessonOrder: 3,
    order: 2,
    type: 'exercise' as const,
    title: 'Build a signup cohort size report',
    instructionMd: `
## Exercise: Cohort sizes

Write a query that groups users by their signup month and shows how many users signed up each month.

**Return columns:**
- \`cohort_month\` — month of signup (\`YYYY-MM\` format)
- \`cohort_size\` — number of users who signed up that month

Order by \`cohort_month\` ASC.
`,
    testCode: `-- @SCHEMA
CREATE TABLE users (user_id INT, name TEXT, signup_date DATE);

-- @SEED
INSERT INTO users VALUES
  (1,'Alice','2024-01-10'),(2,'Bob','2024-01-25'),
  (3,'Carol','2024-02-05'),(4,'Dave','2024-02-14'),
  (5,'Eve','2024-02-28'),(6,'Frank','2024-03-01');

-- @SOLUTION_FILE

-- @VALIDATE
DO $$
BEGIN
  IF (SELECT cohort_size FROM solution WHERE cohort_month = '2024-01') <> 2 THEN
    RAISE EXCEPTION 'Jan cohort should have 2 users';
  END IF;
  IF (SELECT cohort_size FROM solution WHERE cohort_month = '2024-02') <> 3 THEN
    RAISE EXCEPTION 'Feb cohort should have 3 users';
  END IF;
  RAISE NOTICE 'PASS';
END $$;`,
    starterCode: `SELECT
  -- TODO: format signup_date as YYYY-MM and call it cohort_month
  -- TODO: count users per month
FROM users
-- TODO: group and order
;`,
  },
  {
    lessonOrder: 3,
    order: 3,
    type: 'exercise' as const,
    title: 'Challenge: Fix the slow churn report',
    instructionMd: `
## Challenge: Fix this query

This query finds churned users — active in Q1 but not in Q2. It works but runs in 8 seconds on a 1M-row table.

\`\`\`sql
SELECT u.user_id, u.name,
  (SELECT MAX(order_date) FROM orders WHERE user_id = u.user_id) AS last_order
FROM users u
WHERE u.user_id IN (
  SELECT DISTINCT user_id FROM orders
  WHERE order_date BETWEEN '2024-01-01' AND '2024-03-31'
)
AND u.user_id NOT IN (
  SELECT DISTINCT user_id FROM orders
  WHERE order_date >= '2024-04-01'
)
ORDER BY last_order DESC;
\`\`\`

**Rewrite it** using CTEs + window functions to produce the same result.
- Remove the correlated subquery in SELECT
- Replace NOT IN with NOT EXISTS or a LEFT JOIN
- Use MAX() OVER or a CTE to compute last_order without a correlated subquery
`,
    testCode: `-- @SCHEMA
CREATE TABLE users (user_id INT, name TEXT);
CREATE TABLE orders (order_id INT, user_id INT, order_date DATE);

-- @SEED
INSERT INTO users VALUES (1,'Alice'),(2,'Bob'),(3,'Carol'),(4,'Dave');
INSERT INTO orders VALUES
  (1,1,'2024-01-15'),(2,1,'2024-02-20'),(3,1,'2024-05-01'),
  (4,2,'2024-01-10'),(5,2,'2024-03-30'),
  (6,3,'2024-04-15'),
  (7,4,'2024-02-05');

-- @SOLUTION_FILE

-- @VALIDATE
DO $$
BEGIN
  -- Bob (orders in Q1, not in Q2) and Dave (Q1 only) should be churned
  -- Alice has Q2 activity, Carol has no Q1 activity
  IF NOT EXISTS (SELECT 1 FROM solution WHERE user_id = 2) THEN
    RAISE EXCEPTION 'Bob should appear as churned (Q1 active, no Q2 activity)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM solution WHERE user_id = 4) THEN
    RAISE EXCEPTION 'Dave should appear as churned (Q1 active, no Q2 activity)';
  END IF;
  IF EXISTS (SELECT 1 FROM solution WHERE user_id = 1) THEN
    RAISE EXCEPTION 'Alice should NOT appear (has Q2 activity)';
  END IF;
  IF EXISTS (SELECT 1 FROM solution WHERE user_id = 3) THEN
    RAISE EXCEPTION 'Carol should NOT appear (no Q1 activity)';
  END IF;
  RAISE NOTICE 'PASS';
END $$;`,
    starterCode: `-- Rewrite this query using CTEs — no correlated subqueries, no NOT IN
-- Use NOT EXISTS or LEFT JOIN ... WHERE ... IS NULL for the churn filter
WITH q1_users AS (
  -- TODO: users active in Q1 (Jan-Mar 2024)
),
-- TODO: more CTEs as needed
SELECT
  u.user_id,
  u.name,
  -- TODO: last_order without a correlated subquery
FROM users u
-- TODO: joins and filters
ORDER BY last_order DESC;`,
  },
]
*/
