import { useEffect } from "react";

import "../../styles/testing-explained.css";

const benchmarkRows = [
  { model: "Prophet", mae: "123.84", rmse: "141.66", mape: "33.21%" },
  { model: "Naive Baseline", mae: "13.76", rmse: "23.09", mape: "4.06%" },
  { model: "Moving Average (7-day)", mae: "29.24", rmse: "40.99", mape: "8.19%" },
];

const functionalRows = [
  { category: "API Contract + Validation", executed: "12", passed: "11", failed: "1" },
  { category: "UI Authentication and Access Flows", executed: "12", passed: "12", failed: "0" },
  { category: "Total", executed: "24", passed: "23", failed: "1" },
];

const nonFunctionalRows = [
  { category: "Accuracy", result: "PASS", detail: "20 model series and 1,800 test observations were checked." },
  { category: "Performance", result: "PASS", detail: "Normal response time targets were met for health and prediction requests." },
  { category: "Load and Scalability", result: "FAIL", detail: "One burst test on the prediction service produced many unsuccessful responses and slow replies." },
  { category: "Security", result: "PASS", detail: "Unsafe input, wrong request types, unsupported models, and origin rules were checked successfully." },
];

const exampleRows = [
  {
    label: "More stable price pattern",
    series: "Big Onion Local",
    market: "Pettah",
    note: "This was one of the better-performing examples, with a MAPE of 7.75%.",
  },
  {
    label: "More stable price pattern",
    series: "Big Onion",
    market: "Narahenpita",
    note: "This also performed relatively well, with a MAPE of 8.62%.",
  },
  {
    label: "More difficult price pattern",
    series: "Lime",
    market: "Narahenpita",
    note: "This was one of the hardest examples to predict, with a MAPE of 97.21%.",
  },
  {
    label: "More difficult price pattern",
    series: "Green Chilli",
    market: "Pettah",
    note: "This also showed high difficulty, with a MAPE of 92.40%.",
  },
];

const statusClasses = {
  PASS: "testing-explained__status testing-explained__status--pass",
  FAIL: "testing-explained__status testing-explained__status--fail",
};

export default function TestingExplained() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Farm2Market_Testing_Explained";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="testing-explained-page">
      <section className="testing-explained__hero">
        <div className="testing-explained__shell">
          <span className="testing-explained__eyebrow">Testing Explained</span>
          <h1>How Farm2Market Was Tested</h1>
          <p className="testing-explained__intro">
            This page explains, in plain English, how the Farm2Market project was checked
            before final reporting. It is written for a client or reader who wants the
            real testing story without technical language.
          </p>

          <div className="testing-explained__actions">
            <button
              type="button"
              className="testing-explained__print-button"
              onClick={() => window.print()}
            >
              Download as PDF
            </button>
            <p className="testing-explained__print-note">
              This opens your browser print dialog. Save it as
              <strong> Farm2Market_Testing_Explained.pdf</strong>.
            </p>
          </div>
        </div>
      </section>

      <div className="testing-explained__shell testing-explained__content">
        <section className="testing-explained__stats" aria-label="Key testing numbers">
          <article className="testing-explained__stat-card">
            <span className="testing-explained__stat-value">20</span>
            <span className="testing-explained__stat-label">model series checked</span>
          </article>
          <article className="testing-explained__stat-card">
            <span className="testing-explained__stat-value">1,800</span>
            <span className="testing-explained__stat-label">test observations reviewed</span>
          </article>
          <article className="testing-explained__stat-card">
            <span className="testing-explained__stat-value">24</span>
            <span className="testing-explained__stat-label">functional tests executed</span>
          </article>
          <article className="testing-explained__stat-card">
            <span className="testing-explained__stat-value">23/24</span>
            <span className="testing-explained__stat-label">functional tests passed</span>
          </article>
        </section>

        <section className="testing-explained__section">
          <h2>What this page is</h2>
          <p>
            Farm2Market combines price prediction, website features, and a live online
            service. Because of that, the project was tested in more than one way. This
            page explains what was checked, how it was checked, and what the results meant.
          </p>
        </section>

        <section className="testing-explained__section">
          <h2>Why testing was done</h2>
          <p>
            The goal was to make sure the system worked properly before it was presented
            in the final project. We needed to know whether the prediction part gave useful
            answers, whether the main website features worked, whether the system stayed fast
            enough in normal use, and whether basic protection checks were in place.
          </p>
        </section>

        <section className="testing-explained__section">
          <h2>What parts of the system were tested</h2>
          <div className="testing-explained__grid">
            <article className="testing-explained__card">
              <h3>The prediction part</h3>
              <p>
                This checked how close the forecasted prices were to the real recorded prices.
              </p>
            </article>
            <article className="testing-explained__card">
              <h3>The website features</h3>
              <p>
                This covered sign-in, dashboard access, prediction requests, and other main flows.
              </p>
            </article>
            <article className="testing-explained__card">
              <h3>Speed and stability</h3>
              <p>
                This looked at how quickly the service replied and how it behaved under heavier traffic.
              </p>
            </article>
            <article className="testing-explained__card">
              <h3>Basic safety checks</h3>
              <p>
                This checked whether the system rejected unsafe or unsupported requests properly.
              </p>
            </article>
          </div>
        </section>

        <section className="testing-explained__section">
          <h2>How the prediction part was checked</h2>
          <p>
            Old vegetable price records were used to test the prediction model. For each price
            pattern, the earlier records were used to build the model. The last 90 daily records
            were kept aside and were not used during that step. After that, the model tried to
            predict those held-back records, and the predicted values were compared with the real ones.
          </p>
          <div className="testing-explained__metric-grid">
            <article className="testing-explained__metric-card">
              <h3>MAE</h3>
              <p>
                This shows the average size of the mistakes in normal price units.
              </p>
            </article>
            <article className="testing-explained__metric-card">
              <h3>RMSE</h3>
              <p>
                This is similar, but it gives more weight to bigger mistakes.
              </p>
            </article>
            <article className="testing-explained__metric-card">
              <h3>MAPE</h3>
              <p>
                This shows the mistake as a percentage, which makes comparison easier.
              </p>
            </article>
          </div>
          <p>
            The saved results showed that some price patterns were easier to predict than others.
            More stable price movements usually gave lower error, while sharper price swings were harder.
          </p>
        </section>

        <section className="testing-explained__section">
          <h2>What the comparison with simple methods means</h2>
          <p>
            The main prediction approach in this project was Prophet. To understand whether it
            was really helping, it was compared with two simpler methods. The first was a
            Naive Baseline, which simply assumes the next value will stay the same as the latest
            real value. The second was a 7-day moving average, which uses the average of the
            previous seven real values.
          </p>
          <p>
            All three methods were tested on the same held-back records. In this project, the
            two simpler methods gave lower average error than Prophet. That tells us the current
            prediction setup still needs improvement.
          </p>

          <div className="testing-explained__table-card">
            <h3>Exact benchmarking results</h3>
            <table className="testing-explained__table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Average MAE</th>
                  <th>Average RMSE</th>
                  <th>Average MAPE</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkRows.map((row) => (
                  <tr key={row.model}>
                    <td>{row.model}</td>
                    <td>{row.mae}</td>
                    <td>{row.rmse}</td>
                    <td>{row.mape}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="testing-explained__section">
          <h2>Real examples from the saved results</h2>
          <p>
            The saved results showed a clear difference between more stable and more difficult
            price patterns.
          </p>
          <div className="testing-explained__table-card">
            <table className="testing-explained__table">
              <thead>
                <tr>
                  <th>Example Type</th>
                  <th>Vegetable</th>
                  <th>Market</th>
                  <th>What the result showed</th>
                </tr>
              </thead>
              <tbody>
                {exampleRows.map((row) => (
                  <tr key={`${row.label}-${row.series}-${row.market}`}>
                    <td>{row.label}</td>
                    <td>{row.series}</td>
                    <td>{row.market}</td>
                    <td>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="testing-explained__section">
          <h2>How feature testing was done</h2>
          <p>
            The main website features were checked one by one on the live system. This included
            opening the login form, handling wrong passwords, signing in as different user types,
            blocking pages that should not open without the right access, loading prediction options,
            running a forecast, and checking that invalid requests were handled properly.
          </p>
          <div className="testing-explained__table-card">
            <h3>Functional testing summary</h3>
            <table className="testing-explained__table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Executed</th>
                  <th>Passed</th>
                  <th>Failed</th>
                </tr>
              </thead>
              <tbody>
                {functionalRows.map((row) => (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    <td>{row.executed}</td>
                    <td>{row.passed}</td>
                    <td>{row.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            In total, 24 functional tests were executed. Out of these, 23 passed and 1 failed.
          </p>
        </section>

        <section className="testing-explained__section">
          <h2>How speed, stability, and safety were checked</h2>
          <p>
            Another set of checks looked at how the system behaved, not just whether a button
            worked. This included normal response speed, heavier traffic, and basic protection rules.
          </p>
          <div className="testing-explained__table-card">
            <h3>Non-functional testing summary</h3>
            <table className="testing-explained__table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Result</th>
                  <th>What it meant</th>
                </tr>
              </thead>
              <tbody>
                {nonFunctionalRows.map((row) => (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    <td>
                      <span className={statusClasses[row.result]}>{row.result}</span>
                    </td>
                    <td>{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Under normal use, the saved results showed acceptable response times. Under one burst
            test, the prediction service became unstable. The safety checks passed for the cases
            that were tested.
          </p>
        </section>

        <section className="testing-explained__section testing-explained__section--issue">
          <h2>Known issue and what it means</h2>
          <p>
            One confirmed problem was found in the prediction request validation. When a user sent
            an invalid date range to <code>/predict</code>, the system returned a <code>500</code>
            error instead of giving a clearer validation message. This does not mean the whole
            system failed, but it does show that input checking still needs to be improved.
          </p>
        </section>

        <section className="testing-explained__section">
          <h2>Main results in simple words</h2>
          <div className="testing-explained__grid">
            <article className="testing-explained__card">
              <h3>What worked well</h3>
              <p>
                Most of the main website features worked correctly. Normal speed checks passed,
                and the basic safety checks that were run also passed.
              </p>
            </article>
            <article className="testing-explained__card">
              <h3>What did not work as well</h3>
              <p>
                Prediction quality was not equally strong for all vegetables and markets, and the
                main prediction method did not beat the simpler comparison methods on average.
              </p>
            </article>
            <article className="testing-explained__card">
              <h3>What still needs improvement</h3>
              <p>
                The project still needs stronger prediction quality in harder cases, better handling
                of invalid input, and better stability under sudden heavy request bursts.
              </p>
            </article>
          </div>
        </section>

        <section className="testing-explained__section">
          <h2>Final summary</h2>
          <p>
            Farm2Market was tested in several different ways so the project could be checked fairly.
            The testing covered the prediction results, the main website features, the speed and
            stability of the system, and the basic protection checks. The overall picture is that
            Farm2Market works as a prototype and that most important features are in place, but the
            prediction setup and heavier-load handling still need more work.
          </p>
        </section>

        <footer className="testing-explained__source-note">
          Source note: This explanation is based on the stored Chapter 8 testing evidence captured
          on March 4, 2026.
        </footer>
      </div>
    </main>
  );
}
