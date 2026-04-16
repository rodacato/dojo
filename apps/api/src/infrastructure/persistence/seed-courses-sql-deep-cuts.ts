// =============================================================================
// SQL Deep Cuts — course seed data
//
// Executed in SQLite (Piston's sql runtime). ExerciseCode pattern:
//   testCode defines schema + seed + assertions around a `-- @SOLUTION_FILE`
//   marker. PistonAdapter.buildSqlScript() substitutes the marker with
//   `CREATE VIEW solution AS <user code>;` so assertions can reference the
//   learner's query uniformly.
//
// Assertion pattern:
//   - Per test: print `✓ name` or `✗ name: reason` via SELECT CASE
//   - Enforce: insert into `CHECK(ok=1)` table — fails with exit 1 on miss
// =============================================================================

import { createHash } from 'node:crypto'

function seedUuid(name: string): string {
  const hash = createHash('sha256').update(`dojo-course-${name}`).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    '8' + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-')
}

const COURSE_ID = seedUuid('sql-deep-cuts')

const LESSON_1_ID = seedUuid('sql-lesson-1-window')
const LESSON_2_ID = seedUuid('sql-lesson-2-ctes')
const LESSON_3_ID = seedUuid('sql-lesson-3-realworld')

const STEP_1_1_ID = seedUuid('sql-step-1-1-window-intro')
const STEP_1_2_ID = seedUuid('sql-step-1-2-rankings')
const STEP_1_3_ID = seedUuid('sql-step-1-3-running-total')

const STEP_2_1_ID = seedUuid('sql-step-2-1-ctes-intro')
const STEP_2_2_ID = seedUuid('sql-step-2-2-refactor')
const STEP_2_3_ID = seedUuid('sql-step-2-3-ratio')

const STEP_3_1_ID = seedUuid('sql-step-3-1-realworld-intro')
const STEP_3_2_ID = seedUuid('sql-step-3-2-cohort')
const STEP_3_3_ID = seedUuid('sql-step-3-3-churn')

export const SQL_DEEP_CUTS_COURSE = {
  id: COURSE_ID,
  slug: 'sql-deep-cuts',
  title: 'SQL Deep Cuts',
  description:
    'The queries nobody taught you. Window functions, CTEs, and real-world analysis patterns for developers who already know SELECT.',
  language: 'sql',
  accentColor: '#336791',
  status: 'published' as const,
  isPublic: true,
}

export const SQL_DEEP_CUTS_LESSONS = [
  { id: LESSON_1_ID, courseId: COURSE_ID, order: 1, title: 'Window Functions' },
  { id: LESSON_2_ID, courseId: COURSE_ID, order: 2, title: 'CTEs and Readable Queries' },
  { id: LESSON_3_ID, courseId: COURSE_ID, order: 3, title: 'Real-World Analysis' },
]

// ---------------------------------------------------------------------------
// Lesson 1 — Window Functions
// ---------------------------------------------------------------------------

const STEP_1_1 = {
  id: STEP_1_1_ID,
  lessonId: LESSON_1_ID,
  order: 1,
  type: 'read' as const,
  title: 'Beyond GROUP BY — window functions',
  solution: null,
  instruction: `A window function computes a value across a set of rows **without collapsing them**.

\`\`\`sql
-- GROUP BY collapses rows — you lose the individual employee rows
SELECT department, AVG(salary) FROM employees GROUP BY department;

-- Window function keeps all rows AND adds the average alongside
SELECT
  employee_name, department, salary,
  AVG(salary) OVER (PARTITION BY department) AS dept_avg
FROM employees;
\`\`\`

Key parts:
- **\`OVER()\`** marks it as a window function
- **\`PARTITION BY\`** is like GROUP BY — but doesn't collapse rows
- **\`ORDER BY\`** defines row order within the window (needed for \`RANK\`, \`LAG\`, running totals)
- **Frame clause** (\`ROWS\` / \`RANGE\`) controls which rows the window sees (e.g. \`ROWS UNBOUNDED PRECEDING\` = all earlier rows)

You'll use these in every ranking, running total, and per-group analysis you write from now on.`,
  starterCode: null,
  testCode: null,
  hint: null,
}

const STEP_1_2 = {
  id: STEP_1_2_ID,
  lessonId: LESSON_1_ID,
  order: 2,
  type: 'exercise' as const,
  title: 'Rank employees by salary within their department',
  solution: `SELECT
  employee_name,
  department,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank
FROM employees
ORDER BY department ASC, dept_rank ASC`,
  instruction: `Return every employee with their salary rank **within their department**.

**Columns to return** (in order):
- \`employee_name\`
- \`department\`
- \`salary\`
- \`dept_rank\` — rank within the department, highest salary = 1

Order by \`department\` ASC, then \`dept_rank\` ASC.

**Hint:** \`RANK() OVER (PARTITION BY department ORDER BY salary DESC)\``,
  starterCode: `SELECT
  employee_name,
  department,
  salary,
  -- add dept_rank here
FROM employees
ORDER BY department ASC, dept_rank ASC`,
  testCode: `CREATE TABLE employees (id INT, employee_name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES
  (1,'Alice','Engineering',120000),
  (2,'Bob','Engineering',95000),
  (3,'Carol','Marketing',75000),
  (4,'Dave','Marketing',80000),
  (5,'Eve','Engineering',140000);

-- @SOLUTION_FILE

SELECT CASE WHEN (SELECT dept_rank FROM solution WHERE employee_name='Eve')=1
  THEN '✓ Eve (140k) is rank 1 in Engineering'
  ELSE '✗ Eve should be rank 1 in Engineering, got '||COALESCE((SELECT dept_rank FROM solution WHERE employee_name='Eve'),-1) END;
SELECT CASE WHEN (SELECT dept_rank FROM solution WHERE employee_name='Bob')=3
  THEN '✓ Bob (95k) is rank 3 in Engineering'
  ELSE '✗ Bob should be rank 3 in Engineering, got '||COALESCE((SELECT dept_rank FROM solution WHERE employee_name='Bob'),-1) END;
SELECT CASE WHEN (SELECT dept_rank FROM solution WHERE employee_name='Carol')=2
  THEN '✓ Carol (75k) is rank 2 in Marketing'
  ELSE '✗ Carol should be rank 2 in Marketing, got '||COALESCE((SELECT dept_rank FROM solution WHERE employee_name='Carol'),-1) END;
SELECT CASE WHEN (SELECT COUNT(*) FROM solution)=5
  THEN '✓ returns all 5 employees'
  ELSE '✗ expected 5 rows, got '||(SELECT COUNT(*) FROM solution) END;

CREATE TABLE _ok (ok INT CHECK(ok=1));
INSERT INTO _ok VALUES ((SELECT CASE WHEN
  (SELECT dept_rank FROM solution WHERE employee_name='Eve')=1
  AND (SELECT dept_rank FROM solution WHERE employee_name='Bob')=3
  AND (SELECT dept_rank FROM solution WHERE employee_name='Carol')=2
  AND (SELECT COUNT(*) FROM solution)=5
  THEN 1 ELSE 0 END));`,
  hint: "Use `RANK()` in a window with `PARTITION BY department ORDER BY salary DESC`, and alias it as `dept_rank`.",
}

const STEP_1_3 = {
  id: STEP_1_3_ID,
  lessonId: LESSON_1_ID,
  order: 3,
  type: 'exercise' as const,
  title: 'Running totals',
  solution: `WITH monthly AS (
  SELECT
    strftime('%Y-%m', sale_date) AS month,
    SUM(amount) AS monthly_sales
  FROM sales
  GROUP BY strftime('%Y-%m', sale_date)
)
SELECT
  month,
  monthly_sales,
  SUM(monthly_sales) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING) AS running_total
FROM monthly
ORDER BY month ASC`,
  instruction: `Show each month's sales **and** the cumulative total up to that month.

**Columns to return** (in order):
- \`month\` — \`YYYY-MM\` format
- \`monthly_sales\` — sum for that month
- \`running_total\` — cumulative sum from the earliest month up to and including this one

Order by \`month\` ASC.

**Hint:** \`SUM(monthly_sales) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING)\``,
  starterCode: `WITH monthly AS (
  SELECT
    strftime('%Y-%m', sale_date) AS month,
    SUM(amount) AS monthly_sales
  FROM sales
  GROUP BY strftime('%Y-%m', sale_date)
)
SELECT
  month,
  monthly_sales,
  -- add running_total here
FROM monthly
ORDER BY month ASC`,
  testCode: `CREATE TABLE sales (sale_date DATE, amount NUMERIC);
INSERT INTO sales VALUES
  ('2024-01-10', 100), ('2024-01-20', 200),
  ('2024-02-05', 150), ('2024-03-15', 300);

-- @SOLUTION_FILE

SELECT CASE WHEN (SELECT running_total FROM solution WHERE month='2024-01')=300
  THEN '✓ January running_total is 300'
  ELSE '✗ January running_total should be 300, got '||COALESCE((SELECT running_total FROM solution WHERE month='2024-01'),-1) END;
SELECT CASE WHEN (SELECT running_total FROM solution ORDER BY month DESC LIMIT 1)=750
  THEN '✓ final running_total is 750'
  ELSE '✗ final running_total should be 750, got '||COALESCE((SELECT running_total FROM solution ORDER BY month DESC LIMIT 1),-1) END;
SELECT CASE WHEN (SELECT COUNT(*) FROM solution)=3
  THEN '✓ returns one row per month (3 months)'
  ELSE '✗ expected 3 rows, got '||(SELECT COUNT(*) FROM solution) END;

CREATE TABLE _ok (ok INT CHECK(ok=1));
INSERT INTO _ok VALUES ((SELECT CASE WHEN
  (SELECT running_total FROM solution WHERE month='2024-01')=300
  AND (SELECT running_total FROM solution ORDER BY month DESC LIMIT 1)=750
  AND (SELECT COUNT(*) FROM solution)=3
  THEN 1 ELSE 0 END));`,
  hint: 'Use `SUM(monthly_sales) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING)` to accumulate.',
}

// ---------------------------------------------------------------------------
// Lesson 2 — CTEs
// ---------------------------------------------------------------------------

const STEP_2_1 = {
  id: STEP_2_1_ID,
  lessonId: LESSON_2_ID,
  order: 1,
  type: 'read' as const,
  title: 'CTEs — Common Table Expressions',
  solution: null,
  instruction: `A CTE (\`WITH\` clause) gives a name to a subquery so you can reference it multiple times and keep your query readable.

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
- When you need recursion (\`WITH RECURSIVE\`)

**When a subquery is fine:**
- Simple, single-use filter: \`WHERE id IN (SELECT id FROM ...)\`
- Correlated scalar in SELECT (one value per row)`,
  starterCode: null,
  testCode: null,
  hint: null,
}

const STEP_2_2 = {
  id: STEP_2_2_ID,
  lessonId: LESSON_2_ID,
  order: 2,
  type: 'exercise' as const,
  title: 'Refactor nested subqueries into CTEs',
  solution: `WITH well_paid AS (
  SELECT * FROM employees WHERE salary > 50000
),
head AS (
  SELECT department, COUNT(*) AS headcount
  FROM well_paid
  GROUP BY department
),
ranked AS (
  SELECT *, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk
  FROM well_paid
),
tops AS (
  SELECT department, employee_name AS top_earner, salary AS top_salary
  FROM ranked
  WHERE rnk = 1
)
SELECT h.department, h.headcount, t.top_earner, t.top_salary
FROM head h
JOIN tops t ON h.department = t.department
ORDER BY h.headcount DESC`,
  instruction: `The query below filters employees with salary > 50000, then for each department shows the headcount and the top earner. It works, but the nested subqueries hurt to read.

\`\`\`sql
SELECT d.department, d.headcount, s.top_earner, s.top_salary
FROM (
  SELECT department, COUNT(*) AS headcount
  FROM employees WHERE salary > 50000
  GROUP BY department
) d
JOIN (
  SELECT department, employee_name AS top_earner, salary AS top_salary,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk
  FROM employees WHERE salary > 50000
) s ON d.department = s.department AND s.rnk = 1
ORDER BY d.headcount DESC;
\`\`\`

Rewrite it as a chain of CTEs that produces the **same result**. One CTE per intermediate concept (filtered employees, headcounts, ranked employees, top earners), then one final \`SELECT\` that joins them.

**Columns to return** (in order): \`department\`, \`headcount\`, \`top_earner\`, \`top_salary\`. Order by \`headcount\` DESC.`,
  starterCode: `WITH well_paid AS (
  -- employees with salary > 50000
),
-- more CTEs: headcount per department, ranked employees, top earner per department
SELECT
  -- department, headcount, top_earner, top_salary from the joined CTEs
ORDER BY headcount DESC`,
  testCode: `CREATE TABLE employees (id INT, employee_name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES
  (1,'Alice','Engineering',120000),(2,'Bob','Engineering',95000),
  (3,'Carol','Marketing',75000),(4,'Dave','Marketing',55000),
  (5,'Eve','Engineering',140000),(6,'Frank','Sales',45000);

-- @SOLUTION_FILE

SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM solution WHERE department='Sales')
  THEN '✓ Sales is excluded (Frank 45k below 50k threshold)'
  ELSE '✗ Sales should not appear — Frank 45k is below 50k threshold' END;
SELECT CASE WHEN (SELECT top_earner FROM solution WHERE department='Engineering')='Eve'
  THEN '✓ Engineering top_earner is Eve'
  ELSE '✗ Engineering top_earner should be Eve, got '||COALESCE((SELECT top_earner FROM solution WHERE department='Engineering'),'null') END;
SELECT CASE WHEN (SELECT COUNT(*) FROM solution)=2
  THEN '✓ returns 2 departments (Engineering, Marketing)'
  ELSE '✗ expected 2 rows, got '||(SELECT COUNT(*) FROM solution) END;

CREATE TABLE _ok (ok INT CHECK(ok=1));
INSERT INTO _ok VALUES ((SELECT CASE WHEN
  NOT EXISTS (SELECT 1 FROM solution WHERE department='Sales')
  AND (SELECT top_earner FROM solution WHERE department='Engineering')='Eve'
  AND (SELECT COUNT(*) FROM solution)=2
  THEN 1 ELSE 0 END));`,
  hint: 'Start with `well_paid` (filter). Then a CTE that computes `headcount` per department. Then one that ranks employees. Then join them.',
}

const STEP_2_3 = {
  id: STEP_2_3_ID,
  lessonId: LESSON_2_ID,
  order: 3,
  type: 'exercise' as const,
  title: 'Chain CTEs — department budget ratio',
  solution: `WITH dept_budgets AS (
  SELECT department, SUM(salary) AS dept_budget
  FROM employees
  GROUP BY department
),
company_total AS (
  SELECT SUM(salary) AS total_budget FROM employees
)
SELECT
  d.department,
  d.dept_budget,
  c.total_budget,
  ROUND(d.dept_budget * 100.0 / c.total_budget, 1) AS budget_pct
FROM dept_budgets d
CROSS JOIN company_total c
ORDER BY budget_pct DESC`,
  instruction: `For each department, compute:
- \`dept_budget\` — total salary for that department
- \`total_budget\` — total salary for the whole company
- \`budget_pct\` — \`dept_budget\` as a percentage of \`total_budget\`, rounded to 1 decimal

**Columns to return** (in order): \`department\`, \`dept_budget\`, \`total_budget\`, \`budget_pct\`.

Order by \`budget_pct\` DESC.

**Hint:** Two CTEs — one for per-department totals, one for the company total. Then join.`,
  starterCode: `WITH dept_budgets AS (
  -- total salary per department
),
company_total AS (
  -- total salary across the company
)
SELECT
  -- department, dept_budget, total_budget, budget_pct
ORDER BY budget_pct DESC`,
  testCode: `CREATE TABLE employees (id INT, employee_name TEXT, department TEXT, salary INT);
INSERT INTO employees VALUES
  (1,'Alice','Engineering',120000),(2,'Bob','Engineering',90000),
  (3,'Carol','Marketing',80000),(4,'Dave','HR',60000),(5,'Eve','HR',70000);

-- @SOLUTION_FILE

SELECT CASE WHEN ABS((SELECT SUM(budget_pct) FROM solution) - 100.0) < 0.5
  THEN '✓ budget_pct values sum to ~100'
  ELSE '✗ budget_pct should sum to ~100, got '||(SELECT ROUND(SUM(budget_pct),2) FROM solution) END;
SELECT CASE WHEN (SELECT department FROM solution ORDER BY budget_pct DESC LIMIT 1)='Engineering'
  THEN '✓ Engineering has the highest budget_pct'
  ELSE '✗ Engineering should have highest budget_pct, got '||COALESCE((SELECT department FROM solution ORDER BY budget_pct DESC LIMIT 1),'null') END;
SELECT CASE WHEN (SELECT total_budget FROM solution LIMIT 1)=420000
  THEN '✓ total_budget is 420000'
  ELSE '✗ total_budget should be 420000, got '||COALESCE((SELECT total_budget FROM solution LIMIT 1),-1) END;

CREATE TABLE _ok (ok INT CHECK(ok=1));
INSERT INTO _ok VALUES ((SELECT CASE WHEN
  ABS((SELECT SUM(budget_pct) FROM solution) - 100.0) < 0.5
  AND (SELECT department FROM solution ORDER BY budget_pct DESC LIMIT 1)='Engineering'
  AND (SELECT total_budget FROM solution LIMIT 1)=420000
  THEN 1 ELSE 0 END));`,
  hint: 'In the final SELECT, CROSS JOIN the two CTEs (company_total has a single row) and compute `ROUND(dept_budget * 100.0 / total_budget, 1)`.',
}

// ---------------------------------------------------------------------------
// Lesson 3 — Real-World Analysis
// ---------------------------------------------------------------------------

const STEP_3_1 = {
  id: STEP_3_1_ID,
  lessonId: LESSON_3_ID,
  order: 1,
  type: 'read' as const,
  title: 'Retention, cohorts, churn — patterns behind analytics reports',
  solution: null,
  instruction: `Three patterns that show up in every production analytics query:

### 1. Cohort analysis
Group users by when they first appeared (signup month, first order, etc.) and track behavior over time.

\`\`\`sql
WITH cohorts AS (
  SELECT user_id, strftime('%Y-%m', MIN(order_date)) AS cohort_month
  FROM orders GROUP BY user_id
)
SELECT cohort_month, COUNT(*) AS cohort_size
FROM cohorts GROUP BY cohort_month;
\`\`\`

### 2. Retention
Of users who joined in month X, how many are still active in month X+N?

### 3. Churn detection
Users active in a reference period but **not** in the current period.
Pattern: users who exist in period A, minus users who exist in period B.

\`\`\`sql
-- Active last quarter, not this month
SELECT DISTINCT user_id FROM orders
WHERE order_date BETWEEN '2024-01-01' AND '2024-03-31'
  AND NOT EXISTS (
    SELECT 1 FROM orders o2
    WHERE o2.user_id = orders.user_id AND o2.order_date >= '2024-04-01'
  );
\`\`\`

**Footgun:** \`NOT IN (subquery)\` returns no rows if the subquery contains a NULL. Prefer \`NOT EXISTS\` or \`LEFT JOIN ... WHERE ... IS NULL\`.`,
  starterCode: null,
  testCode: null,
  hint: null,
}

const STEP_3_2 = {
  id: STEP_3_2_ID,
  lessonId: LESSON_3_ID,
  order: 2,
  type: 'exercise' as const,
  title: 'Signup cohort sizes',
  solution: `SELECT
  strftime('%Y-%m', signup_date) AS cohort_month,
  COUNT(*) AS cohort_size
FROM users
GROUP BY strftime('%Y-%m', signup_date)
ORDER BY cohort_month ASC`,
  instruction: `Group users by signup month and count how many signed up each month.

**Columns to return** (in order):
- \`cohort_month\` — \`YYYY-MM\` format
- \`cohort_size\` — number of users who signed up that month

Order by \`cohort_month\` ASC.`,
  starterCode: `SELECT
  -- cohort_month from signup_date (use strftime)
  -- cohort_size
FROM users
-- group and order`,
  testCode: `CREATE TABLE users (user_id INT, name TEXT, signup_date DATE);
INSERT INTO users VALUES
  (1,'Alice','2024-01-10'),(2,'Bob','2024-01-25'),
  (3,'Carol','2024-02-05'),(4,'Dave','2024-02-14'),
  (5,'Eve','2024-02-28'),(6,'Frank','2024-03-01');

-- @SOLUTION_FILE

SELECT CASE WHEN (SELECT cohort_size FROM solution WHERE cohort_month='2024-01')=2
  THEN '✓ January cohort has 2 users'
  ELSE '✗ January should have 2 users, got '||COALESCE((SELECT cohort_size FROM solution WHERE cohort_month='2024-01'),-1) END;
SELECT CASE WHEN (SELECT cohort_size FROM solution WHERE cohort_month='2024-02')=3
  THEN '✓ February cohort has 3 users'
  ELSE '✗ February should have 3 users, got '||COALESCE((SELECT cohort_size FROM solution WHERE cohort_month='2024-02'),-1) END;
SELECT CASE WHEN (SELECT COUNT(*) FROM solution)=3
  THEN '✓ returns 3 cohorts (Jan, Feb, Mar)'
  ELSE '✗ expected 3 rows, got '||(SELECT COUNT(*) FROM solution) END;

CREATE TABLE _ok (ok INT CHECK(ok=1));
INSERT INTO _ok VALUES ((SELECT CASE WHEN
  (SELECT cohort_size FROM solution WHERE cohort_month='2024-01')=2
  AND (SELECT cohort_size FROM solution WHERE cohort_month='2024-02')=3
  AND (SELECT COUNT(*) FROM solution)=3
  THEN 1 ELSE 0 END));`,
  hint: "Use `strftime('%Y-%m', signup_date)` for the bucket, then `GROUP BY` that expression.",
}

const STEP_3_3 = {
  id: STEP_3_3_ID,
  lessonId: LESSON_3_ID,
  order: 3,
  type: 'challenge' as const,
  title: 'Rewrite the slow churn report',
  solution: `WITH q1_users AS (
  SELECT DISTINCT user_id FROM orders
  WHERE order_date BETWEEN '2024-01-01' AND '2024-03-31'
),
q2_users AS (
  SELECT DISTINCT user_id FROM orders
  WHERE order_date >= '2024-04-01'
),
last_orders AS (
  SELECT user_id, MAX(order_date) AS last_order
  FROM orders
  GROUP BY user_id
)
SELECT u.user_id, u.name, lo.last_order
FROM users u
JOIN q1_users q1 ON q1.user_id = u.user_id
LEFT JOIN q2_users q2 ON q2.user_id = u.user_id
LEFT JOIN last_orders lo ON lo.user_id = u.user_id
WHERE q2.user_id IS NULL
ORDER BY lo.last_order DESC`,
  instruction: `This query finds churned users (active in Q1 but not in Q2). It works but runs in 8 seconds on a 1M-row table.

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

**Rewrite it** using CTEs + joins to produce the same result:
- Remove the correlated subquery in \`SELECT\`
- Replace \`NOT IN\` with \`NOT EXISTS\` or \`LEFT JOIN ... WHERE ... IS NULL\`

**Columns to return** (in order): \`user_id\`, \`name\`, \`last_order\`.

Order by \`last_order\` DESC.`,
  starterCode: `-- No correlated subqueries, no NOT IN.
WITH q1_users AS (
  -- user_ids with orders in Q1 (Jan-Mar 2024)
),
last_orders AS (
  -- MAX(order_date) per user, without a correlated subquery
)
SELECT
  u.user_id,
  u.name,
  -- last_order from last_orders
FROM users u
-- joins and churn filter (active in Q1 AND no Q2 activity)
ORDER BY last_order DESC`,
  testCode: `CREATE TABLE users (user_id INT, name TEXT);
CREATE TABLE orders (order_id INT, user_id INT, order_date DATE);
INSERT INTO users VALUES (1,'Alice'),(2,'Bob'),(3,'Carol'),(4,'Dave');
INSERT INTO orders VALUES
  (1,1,'2024-01-15'),(2,1,'2024-02-20'),(3,1,'2024-05-01'),
  (4,2,'2024-01-10'),(5,2,'2024-03-30'),
  (6,3,'2024-04-15'),
  (7,4,'2024-02-05');

-- @SOLUTION_FILE

SELECT CASE WHEN EXISTS (SELECT 1 FROM solution WHERE user_id=2)
  THEN '✓ Bob is churned (Q1 active, no Q2 activity)'
  ELSE '✗ Bob should appear as churned' END;
SELECT CASE WHEN EXISTS (SELECT 1 FROM solution WHERE user_id=4)
  THEN '✓ Dave is churned (Q1 active, no Q2 activity)'
  ELSE '✗ Dave should appear as churned' END;
SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM solution WHERE user_id=1)
  THEN '✓ Alice is excluded (has Q2 activity)'
  ELSE '✗ Alice should NOT appear — she has a May 2024 order' END;
SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM solution WHERE user_id=3)
  THEN '✓ Carol is excluded (no Q1 activity)'
  ELSE '✗ Carol should NOT appear — she has no Q1 orders' END;

CREATE TABLE _ok (ok INT CHECK(ok=1));
INSERT INTO _ok VALUES ((SELECT CASE WHEN
  EXISTS (SELECT 1 FROM solution WHERE user_id=2)
  AND EXISTS (SELECT 1 FROM solution WHERE user_id=4)
  AND NOT EXISTS (SELECT 1 FROM solution WHERE user_id=1)
  AND NOT EXISTS (SELECT 1 FROM solution WHERE user_id=3)
  THEN 1 ELSE 0 END));`,
  hint: 'Compute `last_orders` with `GROUP BY user_id` up front, then LEFT JOIN against a CTE of Q2 users and filter where the Q2 match is NULL.',
}

export const SQL_DEEP_CUTS_STEPS = [
  STEP_1_1, STEP_1_2, STEP_1_3,
  STEP_2_1, STEP_2_2, STEP_2_3,
  STEP_3_1, STEP_3_2, STEP_3_3,
]
