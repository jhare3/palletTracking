import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  // Container 1: Pallets Calculator State
  const [carriedOver, setCarriedOver] = useState('');
  const [delivered, setDelivered] = useState('');
  const [remaining, setRemaining] = useState('');
  const [processed, setProcessed] = useState('');
  const [error1, setError1] = useState('');

  // Container 2: CPH Calculator State
  const [extraInput, setExtraInput] = useState('');
  const [cphResult, setCphResult] = useState('');
  const [error2, setError2] = useState('');
  const [cartonsProcessed, setCartonsProcessed] = useState(0);

  // Container 3: ZPH Calculator State
  const [zRacks, setZRacks] = useState('');
  const [hoursHanging, setHoursHanging] = useState('');
  const [zphResult, setZphResult] = useState('');
  const [error3, setError3] = useState('');

  // Container 4: Submission State
  const [selectedDate, setSelectedDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Container 5: History State
  const [submissionHistory, setSubmissionHistory] = useState([]);

  // Calculate Cartons Processed (Pallets × 25)
  useEffect(() => {
    const pallets = parseFloat(processed) || 0;
    setCartonsProcessed((pallets * 25).toFixed(2));
  }, [processed]);

  // Handler for Form 1 (Pallets)
  const handleCalculateProcessed = (e) => {
    e.preventDefault();
    const c = Math.max(0, parseFloat(carriedOver) || 0);
    const d = Math.max(0, parseFloat(delivered) || 0);
    const r = Math.max(0, parseFloat(remaining) || 0);

    if (r > c + d) {
      setError1("Remaining cannot exceed total pallets!");
      return;
    }
    setError1('');
    setProcessed((c + d - r).toFixed(2));
  };

  // Handler for Form 2 (CPH)
  const handleCphCalculate = (e) => {
    e.preventDefault();
    const eInput = parseFloat(extraInput) || 0;

    if (eInput === 0) {
      setError2("Hours worked cannot be zero!");
      return;
    }
    setError2('');
    setCphResult((cartonsProcessed / eInput).toFixed(2));
  };

  // Handler for Form 3 (ZPH)
  const handleZphCalculate = (e) => {
    e.preventDefault();
    const z = parseFloat(zRacks) || 0;
    const h = parseFloat(hoursHanging) || 0;

    if (h === 0) {
      setError3("Hours hanging cannot be zero!");
      return;
    }
    setError3('');
    setZphResult((z / h).toFixed(2));
  };

  // Submit all data
  const handleSubmitAll = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newEntry = {
      date: selectedDate,
      remainingPallets: remaining,
      palletsDelivered: delivered,
      cartonsProcessed: cartonsProcessed,
      cph: cphResult,
      zph: zphResult,
      hoursWorked: extraInput
    };

    setSubmissionHistory([...submissionHistory, newEntry]);

    console.log('Submitting data:', newEntry);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Productivity Calculator</h2>
      <div className="row g-3">
        {/* Container 1: Pallets Calculator */}
        <div className="col-md-4">
          <form onSubmit={handleCalculateProcessed} className="p-3 border rounded h-100 bg-light">
            <h5 className="text">Pallets Calculator</h5>
            <div className="row g-2">
              <div className="col-md-6 mb-3">
                <label className="form-label">Carried-Over</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={carriedOver}
                  onChange={(e) => setCarriedOver(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Delivered</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={delivered}
                  onChange={(e) => setDelivered(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Remaining Pallets</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                value={remaining}
                onChange={(e) => setRemaining(e.target.value)}
                required
              />
            </div>
            {error1 && <div className="alert alert-danger">{error1}</div>}
            <button type="submit" className="btn w-100 mb-3 custom-btn">
              Calculate Processed
            </button>
            <div className="mb-3">
              <label className="form-label">Pallets Processed</label>
              <input
                type="number"
                className="form-control"
                value={processed}
                readOnly
              />
            </div>
          </form>
        </div>

        {/* Container 2: CPH Calculator */}
        <div className="col-md-4">
          <form onSubmit={handleCphCalculate} className="p-3 border rounded h-100 bg-light">
            <h5 className="text">CPH Calculator</h5>
            <div className="mb-3">
              <label className="form-label">Cartons Processed (Pallets × 25)</label>
              <input
                type="number"
                className="form-control"
                value={cartonsProcessed}
                readOnly
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Hours Worked</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="form-control"
                value={extraInput}
                onChange={(e) => setExtraInput(e.target.value)}
                required
              />
            </div>
            {error2 && <div className="alert alert-danger">{error2}</div>}
            <button type="submit" className="btn w-100 mb-3 custom-btn">
              Calculate CPH
            </button>
            <div className="mb-3">
              <label className="form-label">Cartons Per Hour</label>
              <input
                type="number"
                className="form-control"
                value={cphResult}
                readOnly
              />
            </div>
          </form>
        </div>

        {/* Container 3: ZPH Calculator */}
        <div className="col-md-4">
          <form onSubmit={handleZphCalculate} className="p-3 border rounded h-100 bg-light">
            <h5 className="text">ZPH Calculator</h5>
            <div className="mb-3">
              <label className="form-label">Z-Racks Filled</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                value={zRacks}
                onChange={(e) => setZRacks(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Hours Hanging</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="form-control"
                value={hoursHanging}
                onChange={(e) => setHoursHanging(e.target.value)}
                required
              />
            </div>
            {error3 && <div className="alert alert-danger">{error3}</div>}
            <button type="submit" className="btn w-100 mb-3 custom-btn">
              Calculate ZPH
            </button>
            <div className="mb-3">
              <label className="form-label">Z-Racks Per Hour</label>
              <input
                type="number"
                className="form-control"
                value={zphResult}
                readOnly
              />
            </div>
          </form>
        </div>

        {/* Container 4: Data Submission */}
        <div className="col-md-12 mt-4">
          <form onSubmit={handleSubmitAll} className="p-3 border rounded bg-light">
            <h5 className="text-secondary">Data Submission</h5>
            <div className="row align-items-end">
              <div className="col-md-3 mb-3">
                <label className="form-label">Select Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-3 mb-3">
                <button 
                  type="submit" 
                  className="btn btn-dark w-100"
                  disabled={isSubmitting || !selectedDate}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit All Data'
                  )}
                </button>
              </div>
              <div className="col-md-6 mb-3">
                {submitSuccess && (
                  <div className="alert alert-success mb-0">
                    Data submitted successfully for {selectedDate}!
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Container 5: Submission History */}
        <div className="col-md-12 mt-4">
          <div className="p-3 border rounded bg-light">
            <h5 className="text-secondary mb-3">Submission History</h5>
            {submissionHistory.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Remaining Pallets</th>
                      <th>Pallets Delivered</th>
                      <th>Cartons Processed</th>
                      <th>CPH</th>
                      <th>ZPH</th>
                      <th>Hours Worked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionHistory.map((entry, index) => (
                      <tr key={index}>
                        <td>{entry.date}</td>
                        <td>{entry.remainingPallets}</td>
                        <td>{entry.palletsDelivered}</td>
                        <td>{entry.cartonsProcessed}</td>
                        <td>{entry.cph}</td>
                        <td>{entry.zph}</td>
                        <td>{entry.hoursWorked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">
                No submissions yet. Data will appear here after submission.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;